import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { employerOwnsSubmission } from "@/lib/access";

/**
 * Invite a SHORTLISTED applicant to an interview, with an optional note
 * (time, place, who to ask for). The candidate gets a notification and sees
 * the note on their own result page. No contact details change hands here.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await employerOwnsSubmission(id))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const invited = Boolean(body.invited);
  const note = String(body.note ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.shortlisted, s.access_token, s.job_id, c.phone
         FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE s.id = ?`,
    )
    .get(id) as
    | { shortlisted: number; access_token: string; job_id: string; phone: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invited && !row.shortlisted) {
    return NextResponse.json({ error: "Shortlist this person first" }, { status: 400 });
  }

  db.prepare("UPDATE submissions SET interview = ?, interview_note = ? WHERE id = ?").run(
    invited ? 1 : 0,
    invited ? note : "",
    id,
  );

  const user = db
    .prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'")
    .get(row.phone) as { id: string } | undefined;
  if (user) {
    db.prepare(
      "DELETE FROM notifications WHERE user_id = ? AND job_id = ? AND type = 'interview'",
    ).run(user.id, row.job_id);
    if (invited) {
      db.prepare(
        `INSERT INTO notifications (id, user_id, type, title, message, job_id, link, read, created_at)
         VALUES (?, ?, 'interview', ?, ?, ?, ?, 0, ?)`,
      ).run(
        newId(),
        user.id,
        "You are invited to an interview",
        note,
        row.job_id,
        `/outcome/${id}?k=${row.access_token}`,
        new Date().toISOString(),
      );
    }
  }
  return NextResponse.json({ ok: true, invited, note: invited ? note : "" });
}
