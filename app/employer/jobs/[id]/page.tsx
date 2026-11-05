import { getRanking } from "@/lib/shortlist";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import RankingList from "@/components/RankingList";
import { getSession } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";

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
        initial={entries}
        isOwner={isOwner}
        criteriaLabels={criteriaLabels}
      />
    </>
  );
}
