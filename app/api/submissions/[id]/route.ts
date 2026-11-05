import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tokenOpens } from "@/lib/access";
import { getRanking, rowToJob, rowToSubmission } from "@/lib/shortlist";
import { getTemplate } from "@/lib/templates";

/**
 * The candidate's own result. Needs the secret token from their outcome link.
 * Never returns other applicants' scores or any employer-side notes
 * (integrity flags are for the employer only).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const k = new URL(req.url).searchParams.get("k");
  if (!tokenOpens(id, k)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = getDb();
  const sub = rowToSubmission(
    db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any,
  );
  const job = rowToJob(
    db.prepare("SELECT * FROM jobs WHERE id = ?").get(sub.job_id) as any,
  );
  const ranking = getRanking(sub.job_id);
  const me = ranking?.entries.find((e) => e.submissionId === id);

  const media = db
    .prepare(
      "SELECT id, kind, caption, expires_at FROM media WHERE submission_id = ? AND expires_at > ? ORDER BY created_at",
    )
    .all(id, new Date().toISOString());

  return NextResponse.json({
    id: sub.id,
    job: {
      id: job.id,
      title: job.title,
      employer_name: job.employer_name,
      location: job.location,
      evidence: job.evidence,
      ai_scoring: job.ai_scoring,
    },
    total: sub.total,
    writtenScore: sub.written_score ?? null,
    mcqScore: sub.mcq_score ?? null,
    mcqCorrect: sub.mcq?.correct ?? null,
    mcqTotal: sub.mcq?.total ?? null,
    reason: sub.reason,
    criteria: sub.criteria,
    // Bilingual names for the scoring criteria, from the job's task template.
    criteriaLabels: Object.fromEntries(
      getTemplate(job.category).rubric.map((c) => [c.id, c.label]),
    ),
    tags: sub.tags,
    scoredBy: sub.scored_by,
    consent: sub.consent,
    rank: me?.rank ?? null,
    applicants: ranking?.entries.length ?? null,
    shortlisted: sub.shortlisted === true,
    media,
    limits: { maxPhotos: 4, maxVideoSeconds: 90, maxVideoMb: 30 },
  });
}
