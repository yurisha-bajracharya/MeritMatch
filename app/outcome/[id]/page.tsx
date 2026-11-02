import { notFound } from "next/navigation";
import OutcomeView from "@/components/OutcomeView";
import { getRanking } from "@/lib/shortlist";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OutcomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const sub = db.submissions.find((s) => s.id === id);
  const candidate = sub && db.candidates.find((c) => c.id === sub.candidateId);
  const ranking = sub && (await getRanking(sub.jobId));
  if (!sub || !candidate || !ranking) notFound();

  // Candidates learn only whether they made the shortlist, never scores or rank.
  const shortlisted =
    ranking.entries.find((e) => e.submissionId === id)?.shortlisted ?? false;

  return (
    <OutcomeView
      submissionId={sub.id}
      initialLang={sub.language}
      name={candidate.name}
      title={ranking.job.title}
      employer={ranking.job.employer}
      shortlisted={shortlisted}
      initialConsent={sub.consent}
      tags={sub.tags}
    />
  );
}
