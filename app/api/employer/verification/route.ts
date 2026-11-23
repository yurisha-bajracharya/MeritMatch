import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  audit,
  badgesFor,
  checkOtp,
  contactVerified,
  evidenceFor,
  getVerification,
  otpDemoMode,
  startOtp,
} from "@/lib/verification";

/** The employer's own verification state. Never another employer's. */
async function me() {
  const user = await getSessionUser();
  return user?.role === "employer" ? user : null;
}

function state(employerId: string, phone: string) {
  const v = getVerification(employerId);
  const u = getDb().prepare("SELECT restricted, restricted_reason FROM users WHERE id = ?").get(employerId) as {
    restricted: number;
    restricted_reason: string;
  };
  const jobs = getDb()
    .prepare("SELECT id, title, review_status, review_note, created_at FROM jobs WHERE employer_id = ? ORDER BY created_at DESC")
    .all(employerId);
  return {
    phone,
    business_name: v.business_name,
    contact_name: v.contact_name,
    contact_position: v.contact_position,
    email: v.email,
    authorized: Boolean(v.authorized),
    phone_verified: Boolean(v.phone_verified_at),
    contact_verified: contactVerified(v),
    business_status: v.business_status,
    business_note: v.business_note,
    presence_status: v.presence_status,
    presence_note: v.presence_note,
    manual_note: v.manual_note,
    evidence: evidenceFor(employerId),
    badges: badgesFor(v),
    restricted: Boolean(u?.restricted),
    restricted_reason: u?.restricted_reason || "",
    otp_demo: otpDemoMode(),
    jobs,
  };
}

export async function GET() {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  return NextResponse.json(state(user.id, user.phone));
}

export async function POST(req: Request) {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = getDb();
  const now = new Date().toISOString();
  const clean = (v: unknown, n = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  getVerification(user.id);

  switch (body.action) {
    case "contact": {
      const contactName = clean(body.contact_name);
      const position = clean(body.contact_position, 80);
      const business = clean(body.business_name, 120);
      const email = clean(body.email, 160);
      if (!contactName || !position || !business) {
        return NextResponse.json({ error: "Business name, your name and your position are needed." }, { status: 400 });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });
      }
      if (body.authorized !== true) {
        return NextResponse.json({ error: "Please confirm you are allowed to post jobs for this business." }, { status: 400 });
      }
      db.prepare(
        "UPDATE employer_verifications SET business_name = ?, contact_name = ?, contact_position = ?, email = ?, authorized = 1, updated_at = ? WHERE employer_id = ?",
      ).run(business, contactName, position, email, now, user.id);
      break;
    }
    case "send_otp": {
      try {
        const out = await startOtp(user.id, user.phone);
        return NextResponse.json({ ...state(user.id, user.phone), demo_code: out.demoCode });
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Could not send code" }, { status: 503 });
      }
    }
    case "verify_otp": {
      const r = checkOtp(user.id, String(body.code ?? ""));
      if (r !== "ok") {
        const msg = {
          wrong: "That code is not right. Check it and try again.",
          expired: "That code has expired. Send a new one.",
          locked: "Too many wrong tries. Send a new code.",
        }[r];
        return NextResponse.json({ error: msg, code: r }, { status: 400 });
      }
      audit("phone_verified", "employer", user.id, "OTP confirmed", "system");
      break;
    }
    case "submit_layer": {
      // Employer says "this is my evidence, please review". Needs at least one item.
      const layer = body.layer === "presence" ? "presence" : "business";
      const n = (db.prepare("SELECT COUNT(*) AS n FROM verification_evidence WHERE employer_id = ? AND layer = ?").get(user.id, layer) as { n: number }).n;
      const note = clean(body.note, 600);
      if (!n && !note) {
        return NextResponse.json({ error: "Add at least one piece of evidence, or explain your situation for a manual review." }, { status: 400 });
      }
      db.prepare(
        `UPDATE employer_verifications SET ${layer}_status = 'submitted', manual_note = CASE WHEN ? != '' THEN ? ELSE manual_note END, updated_at = ? WHERE employer_id = ?`,
      ).run(note, note, now, user.id);
      audit("submitted_for_review", "employer", user.id, `${layer}${note ? `: ${note}` : ""}`, "employer");
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json(state(user.id, user.phone));
}
