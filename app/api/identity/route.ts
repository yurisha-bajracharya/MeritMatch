import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ID_TYPES, deleteIdFiles, getIdentity } from "@/lib/identity";
import { MAX_FILE_BYTES, audit, savePrivateFile, sniffDoc } from "@/lib/verification";

async function candidate() {
  const u = await getSessionUser();
  return u?.role === "candidate" ? u : null;
}

/** The candidate's own ID-check status. Never returns the images. */
export async function GET() {
  const user = await candidate();
  if (!user) return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const row = getIdentity(user.id);
  return NextResponse.json({
    status: row?.status ?? "none",
    doc_type: row?.doc_type ?? "",
    note: row?.note ?? "",
    submitted_at: row?.submitted_at ?? "",
    reviewed_at: row?.reviewed_at ?? "",
    account_name: user.name,
  });
}

/** Upload one ID (front, optional back). Replaces any earlier upload. */
export async function POST(req: Request) {
  const user = await candidate();
  if (!user) return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form" }, { status: 400 });

  const docType = String(form.get("doc_type") ?? "");
  if (!(ID_TYPES as readonly string[]).includes(docType)) {
    return NextResponse.json({ error: "Choose the type of ID." }, { status: 400 });
  }
  const nameOnDoc = String(form.get("name_on_doc") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!nameOnDoc) return NextResponse.json({ error: "Type your name as it is written on the ID." }, { status: 400 });
  if (form.get("consent") !== "true") {
    return NextResponse.json({ error: "Please agree to the review before uploading." }, { status: 400 });
  }

  const current = getIdentity(user.id);
  if (current?.status === "approved") {
    return NextResponse.json({ error: "Your ID is already verified." }, { status: 409 });
  }

  const saved: Record<"front" | "back", { rel: string; mime: string } | null> = { front: null, back: null };
  for (const side of ["front", "back"] as const) {
    const f = form.get(side);
    if (!f || typeof f === "string" || f.size === 0) continue;
    if (f.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Each photo must be under 5 MB." }, { status: 413 });
    const buf = Buffer.from(await f.arrayBuffer());
    const sn = sniffDoc(buf);
    if (!sn) return NextResponse.json({ error: "Use a photo (JPG, PNG) or a PDF." }, { status: 415 });
    const out = savePrivateFile("verification", buf, sn.ext, sn.mime);
    saved[side] = { rel: out.rel, mime: sn.mime };
  }
  if (!saved.front) return NextResponse.json({ error: "Add a photo of the front of the ID." }, { status: 400 });

  if (current) deleteIdFiles(current);
  getDb()
    .prepare(
      `INSERT INTO identity_verifications (user_id, doc_type, name_on_doc, front_path, front_mime, back_path, back_mime, status, note, submitted_at, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', '', ?, '')
       ON CONFLICT(user_id) DO UPDATE SET doc_type = excluded.doc_type, name_on_doc = excluded.name_on_doc,
         front_path = excluded.front_path, front_mime = excluded.front_mime, back_path = excluded.back_path,
         back_mime = excluded.back_mime, status = 'submitted', note = '', submitted_at = excluded.submitted_at, reviewed_at = ''`,
    )
    .run(user.id, docType, nameOnDoc, saved.front.rel, saved.front.mime, saved.back?.rel ?? "", saved.back?.mime ?? "", new Date().toISOString());
  audit("id_submitted", "candidate", user.id, docType, "candidate");
  return NextResponse.json({ ok: true, status: "submitted" }, { status: 201 });
}

/** Withdraw: deletes the images and the record (also removes the badge). */
export async function DELETE() {
  const user = await candidate();
  if (!user) return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const row = getIdentity(user.id);
  if (row) {
    deleteIdFiles(row);
    getDb().prepare("DELETE FROM identity_verifications WHERE user_id = ?").run(user.id);
    audit("id_withdrawn", "candidate", user.id, "", "candidate");
  }
  return NextResponse.json({ ok: true, status: "none" });
}
