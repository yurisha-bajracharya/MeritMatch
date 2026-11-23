import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isKnownTag } from "@/lib/tags";
import { MAX_FILE_BYTES, audit, savePrivateFile, sniffDoc } from "@/lib/verification";
import { MAX_PER_SKILL, aiCheck, evidenceForUser } from "@/lib/skill-evidence";

async function candidate() {
  const u = await getSessionUser();
  return u?.role === "candidate" ? u : null;
}

/** The candidate's own skill photos and their status. */
export async function GET() {
  const u = await candidate();
  if (!u) return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  return NextResponse.json(evidenceForUser(u.id));
}

/** Add one photo for one skill. The AI check runs straight away when available. */
export async function POST(req: Request) {
  const u = await candidate();
  if (!u) return NextResponse.json({ error: "Log in as a job seeker", code: "login" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form" }, { status: 400 });
  const tag = String(form.get("tag") ?? "");
  if (!isKnownTag(tag)) return NextResponse.json({ error: "Unknown skill" }, { status: 400 });
  const caption = String(form.get("caption") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "The photo must be under 5 MB." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const sn = sniffDoc(buf);
  if (!sn || sn.mime === "application/pdf") return NextResponse.json({ error: "Use a photo (JPG or PNG)." }, { status: 415 });

  const db = getDb();
  const n = (db.prepare("SELECT COUNT(*) AS n FROM skill_evidence WHERE user_id = ? AND tag = ? AND status != 'rejected'").get(u.id, tag) as { n: number }).n;
  if (n >= MAX_PER_SKILL) return NextResponse.json({ error: `Up to ${MAX_PER_SKILL} photos per skill.` }, { status: 409 });

  const saved = savePrivateFile("verification", buf, sn.ext, sn.mime);
  const check = await aiCheck(tag, caption, { path: saved.rel, mime: sn.mime });
  const id = newId() + newId();
  db.prepare(
    "INSERT INTO skill_evidence (id, user_id, tag, path, mime, bytes, caption, status, ai_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, u.id, tag, saved.rel, sn.mime, saved.bytes, caption, check.status, check.note, new Date().toISOString());
  audit("skill_photo_added", "candidate", u.id, `${tag}: ${check.status}${check.by ? ` (${check.by})` : ""}`, "candidate");
  return NextResponse.json(evidenceForUser(u.id).find((e) => e.id === id), { status: 201 });
}

/** Remove a photo (also deletes the file). */
export async function DELETE(req: Request) {
  const u = await candidate();
  if (!u) return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const db = getDb();
  const row = db.prepare("SELECT path FROM skill_evidence WHERE id = ? AND user_id = ?").get(id, u.id) as { path: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare("DELETE FROM skill_evidence WHERE id = ?").run(id);
  const { deleteIdFiles } = await import("@/lib/identity");
  deleteIdFiles({ front_path: row.path, back_path: "" });
  return NextResponse.json({ ok: true });
}
