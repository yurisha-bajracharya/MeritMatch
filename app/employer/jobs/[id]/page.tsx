import { getRanking } from "@/lib/shortlist";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import RankingList from "@/components/RankingList";
import { getSession } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import type { Bilingual } from "@/lib/types";

export default async function EmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getRanking(id);
  if (!result) notFound();
  const { job, entries } = result;

  // Photos, video, rating and Shortlist buttons are for the job's own employer only.
  const session = await getSession();
  const isOwner = session?.role === "employer" && session.userId === job.employer_id;

  const criteriaLabels = Object.fromEntries(
    getTemplate(job.category).rubric.map((c) => [c.id, c.label]),
  );

  // Template questions first, then the ones this employer added.
  const questions: { id: string; prompt: Bilingual; mine: boolean }[] = [
    ...getTemplate(job.category).scenarios.map((s) => ({ id: s.id, prompt: s.prompt, mine: false })),
    ...job.custom_questions.map((q) => ({
      id: q.id,
      prompt: { en: q.prompt.en || q.prompt.ne, ne: q.prompt.ne || q.prompt.en },
      mine: true,
    })),
  ];

  return (
    <>
      <Navbar />
      <RankingList
        job={{
          id: job.id,
          title: job.title,
          employer_name: job.employer_name,
          location: job.location,
          ai_scoring: job.ai_scoring,
          evidence: job.evidence,
        }}
        initial={isOwner ? entries : entries.map((e) => ({ ...e, answers: [] }))}
        questions={isOwner ? questions : []}
        isOwner={isOwner}
        criteriaLabels={criteriaLabels}
      />
    </>
  );
}
