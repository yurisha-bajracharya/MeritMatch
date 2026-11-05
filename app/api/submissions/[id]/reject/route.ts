import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { employerOwnsSubmission } from "@/lib/access";

/**
 * The employer who owns the job rejects (or un-rejects) an applicant.
 * Rejecting also takes back a shortlist and the "you are shortlisted"
 * notification, so nobody is left with a message that is no longer true.
 * The candidate sees "Not shortlisted this time" on their own result page.
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
  const rejected = Boolean(body.rejected);

  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.job_id, c.phone FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE s.id = ?`,
    )
    .get(id) as { job_id: string; phone: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (rejected) {
    db.prepare("UPDATE submissions SET rejected = 1, shortlisted = 0, shortlisted_at = '' WHERE id = ?").run(id);
    const user = db
      .prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'")
      .get(row.phone) as { id: string } | undefined;
    if (user) {
      db.prepare(
        "DELETE FROM notifications WHERE user_id = ? AND job_id = ? AND type = 'shortlisted'",
      ).run(user.id, row.job_id);
    }
  } else {
    db.prepare("UPDATE submissions SET rejected = 0 WHERE id = ?").run(id);
  }
  return NextResponse.json({ ok: true, rejected });
}
