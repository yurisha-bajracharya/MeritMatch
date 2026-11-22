import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { employerOwnsSubmission } from "@/lib/access";
import { UNLOCK_PRICE_NPR, isFreeEmployer } from "@/lib/unlock";

/**
 * Unlock a candidate's name and phone. Needs all three: shortlisted by this
 * employer, agreed by the candidate, then unlocked here. The payment is a
 * mock (the amount is recorded, nothing is charged); the demo / admin
 * recruiter account unlocks for free.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await employerOwnsSubmission(id))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const session = (await getSession())!;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.shortlisted, s.consent, c.name, c.phone
         FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE s.id = ?`,
    )
    .get(id) as { shortlisted: number; consent: number; name: string; phone: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!row.shortlisted) {
    return NextResponse.json({ error: "Shortlist this person first" }, { status: 400 });
  }
  if (!row.consent) {
    return NextResponse.json({ error: "The candidate has not agreed to share yet" }, { status: 400 });
  }

  const free = isFreeEmployer(session.userId);
  db.prepare(
    "INSERT OR IGNORE INTO unlocks (submission_id, employer_id, amount, created_at) VALUES (?, ?, ?, ?)",
  ).run(id, session.userId, free ? 0 : UNLOCK_PRICE_NPR, new Date().toISOString());

  return NextResponse.json({ ok: true, free, contact: { name: row.name, phone: row.phone } });
}
