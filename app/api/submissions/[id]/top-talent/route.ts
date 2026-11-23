import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { employerOwnsSubmission } from "@/lib/access";
import { audit } from "@/lib/verification";
import { TOP_TALENT_MIN, giveTopTalent, topTalentOptions } from "@/lib/talent";

/**
 * Mark an applicant as "Top talent in <skill>". Allowed only while the
 * person is still anonymous to this employer (contact not unlocked), and
 * only after a task score of at least TOP_TALENT_MIN.
 */
async function load(id: string) {
  if (!(await employerOwnsSubmission(id))) return null;
  return getDb()
    .prepare(
      `SELECT s.id, s.total, s.tags, s.job_id, j.category, j.employer_id, c.phone,
              (SELECT 1 FROM unlocks u WHERE u.submission_id = s.id) AS unlocked
         FROM submissions s JOIN jobs j ON j.id = s.job_id JOIN candidates c ON c.id = s.candidate_id WHERE s.id = ?`,
    )
    .get(id) as any;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await load(id);
  if (!row) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { tag } = await req.json().catch(() => ({}));
  if (row.unlocked) return NextResponse.json({ error: "Top talent can only be given before you see who the person is.", code: "unlocked" }, { status: 409 });
  if (row.total < TOP_TALENT_MIN) return NextResponse.json({ error: `Needs a task score of at least ${TOP_TALENT_MIN}%.`, code: "score" }, { status: 400 });
  if (String(row.phone).startsWith("anon-")) return NextResponse.json({ error: "This applicant left no phone number.", code: "anon" }, { status: 400 });
  if (!topTalentOptions(JSON.parse(row.tags || "[]"), row.category).includes(tag)) {
    return NextResponse.json({ error: "Pick a skill this task showed." }, { status: 400 });
  }
  giveTopTalent({ phone: row.phone, tag, employerId: row.employer_id, jobId: row.job_id, submissionId: id, score: row.total });
  const s = await getSession();
  audit("top_talent_given", "submission", id, tag, s?.userId ?? "employer");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await load(id);
  if (!row) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const tag = new URL(req.url).searchParams.get("tag") ?? "";
  getDb().prepare("DELETE FROM talent_tags WHERE submission_id = ? AND tag = ?").run(id, tag);
  return NextResponse.json({ ok: true });
}
