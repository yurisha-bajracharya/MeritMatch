import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb, newId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { REPORT_CATEGORIES, newRef } from "@/lib/reports";
import { MAX_FILE_BYTES, audit, savePrivateFile, sniffDoc } from "@/lib/verification";

const MAX_FILES = 3;

/**
 * Anyone can report a job or an employer, verified or not, logged in or not.
 * Free, private (never shown publicly), and the reporter's identity is never
 * shown to the employer. Returns a reference and a secret link to check status.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form" }, { status: 400 });

  const category = String(form.get("category") ?? "");
  if (!(REPORT_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Choose what the problem is." }, { status: 400 });
  }
  const db = getDb();
  let jobId = String(form.get("job_id") ?? "");
  let employerId = String(form.get("employer_id") ?? "");
  if (jobId) {
    const job = db.prepare("SELECT employer_id FROM jobs WHERE id = ?").get(jobId) as { employer_id: string } | undefined;
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    employerId = employerId || job.employer_id;
  }
  if (employerId) {
    const u = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employer'").get(employerId);
    if (!u) employerId = "";
  }
  if (!jobId && !employerId) {
    return NextResponse.json({ error: "Say which job or employer this is about." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => typeof f !== "string" && f.size > 0);
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Up to ${MAX_FILES} files.` }, { status: 400 });
  const saved: { rel: string; bytes: number; mime: string }[] = [];
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Each file must be under 5 MB." }, { status: 413 });
    const buf = Buffer.from(await f.arrayBuffer());
    const sn = sniffDoc(buf);
    if (!sn) return NextResponse.json({ error: "Attach screenshots (JPG, PNG) or a PDF." }, { status: 415 });
    saved.push({ ...savePrivateFile("reports", buf, sn.ext, sn.mime), mime: sn.mime });
  }

  const session = await getSession();
  const id = newId() + newId();
  let ref = newRef();
  while (db.prepare("SELECT 1 FROM reports WHERE ref = ?").get(ref)) ref = newRef();
  const token = randomBytes(12).toString("hex");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO reports (id, ref, access_token, reporter_user_id, reporter_contact, employer_id, job_id, category, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  ).run(
    id,
    ref,
    token,
    session?.userId ?? "",
    String(form.get("contact") ?? "").trim().slice(0, 120),
    employerId,
    jobId,
    category,
    String(form.get("description") ?? "").trim().slice(0, 3000),
    now,
    now,
  );
  for (const f of saved) {
    db.prepare("INSERT INTO report_attachments (id, report_id, path, mime, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      newId() + newId(),
      id,
      f.rel,
      f.mime,
      f.bytes,
      now,
    );
  }
  audit("report_received", "report", id, `${ref} ${category}`, "applicant");
  return NextResponse.json({ ref, link: `/report/${ref}?k=${token}` }, { status: 201 });
}
