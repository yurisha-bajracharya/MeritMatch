import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { employerOwnsSubmission } from "@/lib/access";

/**
 * A HUMAN rating of photos or video, by the employer who owns the job.
 * Stored on its own and never added into the ranking total: a 1-5 rating of
 * a video is a judgement call, and mixing it into an automatic score would
 * make that score look more objective than it is.
 */
const RUBRICS = {
  photo: ["finish", "technique", "fit"],
  video: ["clarity", "engagement", "structure"],
} as const;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const submissionId = String(body.submission_id ?? "");
  const kind = body.kind === "video" ? "video" : body.kind === "photo" ? "photo" : null;
  if (!kind) return NextResponse.json({ error: "kind must be photo or video" }, { status: 400 });

  if (!(await employerOwnsSubmission(submissionId))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const scores: Record<string, number> = {};
  for (const key of RUBRICS[kind]) {
    const n = Number(body.scores?.[key]);
    if (Number.isInteger(n) && n >= 1 && n <= 5) scores[key] = n;
  }
  const note = String(body.note ?? "").slice(0, 300);

  getDb()
    .prepare(
      `INSERT INTO evidence_reviews (submission_id, kind, scores, note, reviewed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(submission_id, kind) DO UPDATE SET scores = excluded.scores, note = excluded.note, reviewed_at = excluded.reviewed_at`,
    )
    .run(submissionId, kind, JSON.stringify(scores), note, new Date().toISOString());

  return NextResponse.json({ ok: true, scores });
}
