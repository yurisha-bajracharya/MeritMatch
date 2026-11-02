import Link from "next/link";
import { notFound } from "next/navigation";
import BiasDashboard from "@/components/BiasDashboard";
import { computeBias, RESUME_ODDS } from "@/lib/bias";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BiasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) notFound();

  const candidates = new Map(db.candidates.map((c) => [c.id, c]));
  const jobSubs = db.submissions.filter((s) => s.jobId === id);
  const stats = computeBias(jobSubs, candidates);
  const isDemo = jobSubs.some((s) => s.scoredBy === "demo");

  return (
    <main>
      <header className="py-5">
        <Link
          href={`/employer/jobs/${job.id}`}
          className="font-semibold text-brand"
        >
          &larr; Shortlist
        </Link>
      </header>
      <section className="pb-8 pt-3">
        <p className="text-sm text-ink/75">
          {job.title}, {job.employer}
        </p>
        <h1 className="font-display text-4xl leading-tight text-brand mt-1">
          Who made the shortlist
        </h1>
        {isDemo && (
          <p className="mt-3 border-l-4 border-ochre pl-3 text-sm">
            Demo data: these applicants are synthetic.
          </p>
        )}
      </section>
      {stats.applicants === 0 ? (
        <p className="ledger-row">No applicants yet.</p>
      ) : (
        <BiasDashboard stats={stats} odds={RESUME_ODDS} />
      )}
    </main>
  );
}
