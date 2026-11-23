import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/** A worker's own jobs from MeritMatch, with any check-in that is due. */
export async function GET() {
  const u = await getSessionUser();
  if (u?.role !== "candidate") return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const now = new Date().toISOString();
  const rows = getDb()
    .prepare(
      `SELECT h.id, h.position, h.start_date, h.status, COALESCE(v.business_name, j.employer_name) AS business_name,
              (SELECT MIN(c.day) FROM checkins c WHERE c.hire_id = h.id AND c.respondent = 'worker' AND c.answered_at = '' AND c.due_at <= ?) AS due_day,
              h.letter_issued_at != '' AND h.letter_confirmed_at = '' AS letter_waiting
         FROM hires h JOIN jobs j ON j.id = h.job_id LEFT JOIN employer_verifications v ON v.employer_id = h.employer_id
        WHERE h.worker_phone = ? ORDER BY h.start_date DESC`,
    )
    .all(now, u.phone);
  return NextResponse.json(rows);
}
