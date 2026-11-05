import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { employerOwnsSubmission } from "@/lib/access";

/**
 * The employer who owns the job shortlists (or un-shortlists) an applicant.
 * Shortlisting:
 *  - is what the candidate sees as their status
 *  - lets the candidate upload a video, if the job asks for one
 *  - sends the candidate a notification, if they have an account
 *    (people who applied without one still see the status on their own
 *    outcome link)
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
  const shortlisted = Boolean(body.shortlisted);

  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.shortlisted, s.access_token, s.job_id, c.phone
         FROM submissions s JOIN candidates c ON c.id = s.candidate_id
        WHERE s.id = ?`,
    )
    .get(id) as
    | { shortlisted: number; access_token: string; job_id: string; phone: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare("UPDATE submissions SET shortlisted = ?, shortlisted_at = ? WHERE id = ?").run(
    shortlisted ? 1 : 0,
    shortlisted ? new Date().toISOString() : "",
    id,
  );

  // Link candidates to accounts by phone number, the same way the dashboard does.
  const user = db
    .prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'")
    .get(row.phone) as { id: string } | undefined;

  let notified = false;
  if (user) {
    if (shortlisted && !row.shortlisted) {
      const exists = db
        .prepare(
          "SELECT id FROM notifications WHERE user_id = ? AND job_id = ? AND type = 'shortlisted'",
        )
        .get(user.id, row.job_id);
      if (!exists) {
        db.prepare(
          `INSERT INTO notifications (id, user_id, type, title, message, job_id, link, read, created_at)
           VALUES (?, ?, 'shortlisted', ?, ?, ?, ?, 0, ?)`,
        ).run(
          newId(),
          user.id,
          "You have been shortlisted",
          "The employer shortlisted you.",
          row.job_id,
          `/outcome/${id}?k=${row.access_token}`,
          new Date().toISOString(),
        );
        notified = true;
      }
    } else if (!shortlisted) {
      // Taking it back removes the notification, so nobody is left with a
      // stale "you're shortlisted" that is no longer true.
      db.prepare(
        "DELETE FROM notifications WHERE user_id = ? AND job_id = ? AND type = 'shortlisted'",
      ).run(user.id, row.job_id);
    }
  }

  return NextResponse.json({ ok: true, shortlisted, notified });
}
