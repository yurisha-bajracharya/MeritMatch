import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  BUSINESS_KINDS,
  MAX_FILE_BYTES,
  PRIVATE_DIR,
  PRESENCE_KINDS,
  getVerification,
  savePrivateFile,
  sniffDoc,
} from "@/lib/verification";

/**
 * Add one piece of verification evidence: a typed value (PAN number, link)
 * and/or a file (photo or PDF). Files are private: only admins can open them.
 * Adding evidence never approves anything; a person reviews it.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (user?.role !== "employer") return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form" }, { status: 400 });
  const layer = form.get("layer") === "presence" ? "presence" : "business";
  const kind = String(form.get("kind") ?? "");
  const allowed: readonly string[] = layer === "business" ? BUSINESS_KINDS : PRESENCE_KINDS;
  if (!allowed.includes(kind)) return NextResponse.json({ error: "Unknown evidence type" }, { status: 400 });

  let value = String(form.get("value") ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (["maps", "website", "social"].includes(kind) && value) {
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    try {
      new URL(value);
    } catch {
      return NextResponse.json({ error: "That link does not look right." }, { status: 400 });
    }
  }

  const file = form.get("file");
  let saved: { rel: string; bytes: number } | null = null;
  let mime = "";
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File is larger than 5 MB." }, { status: 413 });
    const buf = Buffer.from(await file.arrayBuffer());
    const sn = sniffDoc(buf);
    if (!sn) return NextResponse.json({ error: "Use a photo (JPG, PNG) or a PDF." }, { status: 415 });
    saved = savePrivateFile("verification", buf, sn.ext, sn.mime);
    mime = sn.mime;
  }
  if (!value && !saved) {
    return NextResponse.json({ error: "Type the detail or attach a photo or PDF." }, { status: 400 });
  }
  if (kind === "premises_photo" && !saved) {
    return NextResponse.json({ error: "Attach a photo of the shop, office or signboard." }, { status: 400 });
  }

  getVerification(user.id);
  getDb()
    .prepare(
      "INSERT INTO verification_evidence (id, employer_id, layer, kind, value, file_path, mime, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(newId() + newId(), user.id, layer, kind, value, saved?.rel ?? "", mime, saved?.bytes ?? 0, new Date().toISOString());
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (user?.role !== "employer") return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const db = getDb();
  const v = getVerification(user.id);
  const row = db.prepare("SELECT layer, file_path FROM verification_evidence WHERE id = ? AND employer_id = ?").get(id, user.id) as
    | { layer: "business" | "presence"; file_path: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Approved evidence stays on record; ask an admin to change it.
  if (v[`${row.layer}_status`] === "approved") {
    return NextResponse.json({ error: "This step is already approved." }, { status: 409 });
  }
  db.prepare("DELETE FROM verification_evidence WHERE id = ?").run(id);
  if (row.file_path) {
    const full = path.resolve(PRIVATE_DIR, row.file_path);
    if (full.startsWith(PRIVATE_DIR + path.sep)) fs.rmSync(full, { force: true });
  }
  return NextResponse.json({ ok: true });
}
