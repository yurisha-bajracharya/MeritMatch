import { createHmac, randomInt } from "crypto";
import fs from "fs";
import path from "path";
import { getDb, newId } from "./db";
import { stripJpegMetadata } from "./media";
import type { EmployerBadges, LayerStatus } from "./types";

/**
 * Employer verification, in layers. Each layer asks for ONE suitable piece of
 * evidence, not every document: a tailoring shop can use a signboard photo,
 * a company can give its registration and website.
 *
 *  1. contact   phone OTP + contact person + "I am authorised" (automatic)
 *  2. business  PAN / registration / ward / licence / other  (person reviews)
 *  3. presence  map link / website / social page / premises photo / other (person reviews)
 *  4. each job  reviewed separately (see lib/jobs-review in the admin API)
 *
 * Honesty rules baked in here:
 *  - nothing uploaded is approved automatically
 *  - PAN numbers are stored as given; we do NOT claim IRD verification
 *  - "presence" never means a physical inspection
 */

export const BUSINESS_KINDS = ["pan", "registration", "ward", "licence", "other"] as const;
export const PRESENCE_KINDS = ["maps", "website", "social", "premises_photo", "other"] as const;
export type Layer = "business" | "presence";

export const PRIVATE_DIR = path.join(process.cwd(), "data", "private");
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type VerificationRow = {
  employer_id: string;
  business_name: string;
  contact_name: string;
  contact_position: string;
  email: string;
  authorized: number;
  phone_verified_at: string;
  business_status: LayerStatus;
  business_note: string;
  presence_status: LayerStatus;
  presence_note: string;
  manual_note: string;
  updated_at: string;
};

export function getVerification(employerId: string): VerificationRow {
  const db = getDb();
  let row = db.prepare("SELECT * FROM employer_verifications WHERE employer_id = ?").get(employerId) as
    | VerificationRow
    | undefined;
  if (!row) {
    db.prepare("INSERT INTO employer_verifications (employer_id, updated_at) VALUES (?, ?)").run(
      employerId,
      new Date().toISOString(),
    );
    row = db.prepare("SELECT * FROM employer_verifications WHERE employer_id = ?").get(employerId) as VerificationRow;
  }
  return row;
}

export function contactVerified(v: Pick<VerificationRow, "phone_verified_at" | "authorized" | "contact_name">) {
  return Boolean(v.phone_verified_at && v.authorized && v.contact_name);
}

export function badgesFor(v: VerificationRow | undefined): EmployerBadges {
  if (!v) return { contact: false, documents: false, employer: false };
  const contact = contactVerified(v);
  const documents = v.business_status === "approved";
  return { contact, documents, employer: contact && documents && v.presence_status === "approved" };
}

/** Badges for many employers at once (job lists). */
export function badgesMap(employerIds: string[]): Map<string, EmployerBadges> {
  const ids = [...new Set(employerIds.filter(Boolean))];
  const out = new Map<string, EmployerBadges>();
  if (!ids.length) return out;
  const rows = getDb()
    .prepare(`SELECT * FROM employer_verifications WHERE employer_id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids) as VerificationRow[];
  for (const r of rows) out.set(r.employer_id, badgesFor(r));
  return out;
}

export function evidenceFor(employerId: string) {
  return getDb()
    .prepare(
      "SELECT id, layer, kind, value, mime, bytes, created_at, (file_path != '') AS has_file FROM verification_evidence WHERE employer_id = ? ORDER BY created_at",
    )
    .all(employerId) as {
    id: string;
    layer: Layer;
    kind: string;
    value: string;
    mime: string;
    bytes: number;
    created_at: string;
    has_file: number;
  }[];
}

/* ---------------- OTP ---------------- */

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;

function otpSecret() {
  return process.env.SESSION_SECRET || "meritmatch-otp-dev";
}
const hashOtp = (employerId: string, code: string) =>
  createHmac("sha256", otpSecret()).update(`${employerId}:${code}`).digest("hex");

/**
 * No SMS provider is connected in this prototype. Without one, the code is
 * returned to the screen in demo mode so the flow can be shown honestly.
 * Set SMS_PROVIDER_URL (and wire it in sendSms) for real delivery; in
 * production without it, sending fails instead of pretending.
 */
export function otpDemoMode() {
  return !process.env.SMS_PROVIDER_URL;
}

export async function startOtp(employerId: string, phone: string): Promise<{ demoCode?: string }> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  getVerification(employerId);
  getDb()
    .prepare(
      "UPDATE employer_verifications SET otp_hash = ?, otp_expires = ?, otp_attempts = 0, updated_at = ? WHERE employer_id = ?",
    )
    .run(
      hashOtp(employerId, code),
      new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
      new Date().toISOString(),
      employerId,
    );
  if (otpDemoMode()) {
    if (process.env.NODE_ENV === "production" && process.env.OTP_DEMO !== "1") {
      throw new Error("SMS is not configured on this server.");
    }
    console.log(`[OTP demo] code for ${phone}: ${code}`);
    return { demoCode: code };
  }
  await fetch(process.env.SMS_PROVIDER_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: phone, text: `MeritMatch code: ${code}. Valid ${OTP_TTL_MIN} minutes.` }),
  });
  return {};
}

export function checkOtp(employerId: string, code: string): "ok" | "wrong" | "expired" | "locked" {
  const v = getDb().prepare("SELECT otp_hash, otp_expires, otp_attempts FROM employer_verifications WHERE employer_id = ?").get(employerId) as
    | { otp_hash: string; otp_expires: string; otp_attempts: number }
    | undefined;
  if (!v?.otp_hash || !v.otp_expires) return "expired";
  if (v.otp_attempts >= OTP_MAX_ATTEMPTS) return "locked";
  if (new Date(v.otp_expires).getTime() < Date.now()) return "expired";
  const db = getDb();
  if (hashOtp(employerId, String(code).trim()) !== v.otp_hash) {
    db.prepare("UPDATE employer_verifications SET otp_attempts = otp_attempts + 1 WHERE employer_id = ?").run(employerId);
    return "wrong";
  }
  db.prepare(
    "UPDATE employer_verifications SET phone_verified_at = ?, otp_hash = '', otp_expires = '', otp_attempts = 0, updated_at = ? WHERE employer_id = ?",
  ).run(new Date().toISOString(), new Date().toISOString(), employerId);
  return "ok";
}

/* ---------------- files ---------------- */

/** Images (JPEG/PNG/WebP) and PDF only, identified by their first bytes. */
export function sniffDoc(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 8) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", ext: "png" };
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  if (buf.toString("latin1", 0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

/** Saves a private file outside the public folder and returns its relative path. */
export function savePrivateFile(folder: "verification" | "reports", buf: Buffer, ext: string, mime: string) {
  const dir = path.join(PRIVATE_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${newId()}${newId()}.${ext}`;
  const data = mime === "image/jpeg" ? stripJpegMetadata(buf) : buf;
  fs.writeFileSync(path.join(dir, name), data, { mode: 0o600 });
  return { rel: path.join(folder, name), bytes: data.length };
}

export function readPrivateFile(rel: string): Buffer | null {
  const full = path.resolve(PRIVATE_DIR, rel);
  if (!full.startsWith(PRIVATE_DIR + path.sep)) return null;
  try {
    return fs.readFileSync(full);
  } catch {
    return null;
  }
}

/* ---------------- audit + messages ---------------- */

export function audit(action: string, targetType: string, targetId: string, detail = "", actor = "admin") {
  getDb()
    .prepare(
      "INSERT INTO audit_log (id, actor, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(newId() + newId(), actor, action, targetType, targetId, detail.slice(0, 1000), new Date().toISOString());
}

/** In-app message to a user (employer or applicant) through the notification bell. */
export function notifyUser(userId: string, type: string, title: string, message: string, link = "", jobId = "") {
  if (!userId) return;
  getDb()
    .prepare(
      `INSERT INTO notifications (id, user_id, type, title, message, job_id, link, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(newId(), userId, type, title, message.slice(0, 500), jobId, link, new Date().toISOString());
}

/** Jobs applicants may see and apply to. */
export function isPublicJob(row: { review_status?: string; employer_id?: string }): boolean {
  if (row.review_status !== "approved") return false;
  if (!row.employer_id) return true;
  const u = getDb().prepare("SELECT restricted FROM users WHERE id = ?").get(row.employer_id) as
    | { restricted: number }
    | undefined;
  return !u?.restricted;
}

export const PUBLIC_JOBS_SQL = `SELECT j.* FROM jobs j LEFT JOIN users u ON u.id = j.employer_id
  WHERE j.review_status = 'approved' AND COALESCE(u.restricted, 0) = 0`;
