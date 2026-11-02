import Link from "next/link";
import { notFound } from "next/navigation";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getRanking } from "@/lib/shortlist";
import { getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function ShortlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRanking(id);
  if (!data) notFound();
  const { job, entries } = data;
  const labels = new Map(
    getTemplate(job.category).rubric.map((c) => [c.id, c.label.en]),
  );
  const cut = entries.filter((e) => e.shortlisted).length;

  return (
    <main>
      <header className="py-5">
        <Link href="/" className="font-semibold text-brand">
          MeritMatch
        </Link>
      </header>

      <section className="border-t border-rule pt-8">
        <div className="mb-6">
          {job.verified ? (
            <VerifiedBadge />
          ) : (
            <p className="border-l-4 border-ochre pl-3 text-sm">
              Not verified yet. Candidates can still take the task; MeritMatch
              will review your business.
            </p>
          )}
        </div>
        <p className="text-sm text-ink/75">
          {job.employer}
          {job.location ? `, ${job.location}` : ""}
        </p>
        <h1 className="font-display text-3xl text-brand mt-1">{job.title}</h1>
        <p className="mt-3">
          {entries.length} {entries.length === 1 ? "applicant" : "applicants"},
          ranked by task score. Names stay hidden until a candidate agrees to
          share them.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/employer/jobs/${job.id}/bias`}
            className="btn btn-primary flex-1"
          >
            Fairness dashboard
          </Link>
          <Link href={`/t/${job.id}`} className="btn btn-quiet">
            Task link
          </Link>
        </div>
      </section>

      <section className="mt-8">
        {entries.length === 0 && (
          <p className="ledger-row">
            No answers yet. Share the task link with candidates.
          </p>
        )}
        {entries.map((e, i) => (
          <div key={e.submissionId}>
            {i === cut && (
              <p className="border-t-2 border-brand pt-2 pb-1 text-sm font-medium text-brand">
                Shortlist ends here
              </p>
            )}
            <details
              className={`ledger-row ${e.shortlisted ? "" : "text-ink/75"}`}
            >
              <summary className="flex items-start gap-3 cursor-pointer min-h-12 list-none">
                <span className="w-7 shrink-0 font-semibold text-brand">
                  {e.rank}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">
                    {e.contact ? e.contact.name : `Applicant ${e.label}`}
                  </span>
                  <span className="block text-sm">{e.reason}</span>
                </span>
                <span className="shrink-0 bg-ochre text-ink font-semibold px-2 py-0.5 rounded-[3px] tabular-nums">
                  {e.total}
                </span>
              </summary>

              <div className="pl-10 pt-3 space-y-3">
                {e.contact ? (
                  <p className="text-sm">
                    <span className="font-medium">{e.contact.name}</span>,{" "}
                    {e.contact.phone}
                    <span className="block text-moss font-medium">
                      Candidate agreed to share contact details
                    </span>
                  </p>
                ) : (
                  <p className="text-sm">
                    Name and phone hidden until the candidate agrees.
                  </p>
                )}
                <ul>
                  {e.criteria.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between gap-3 border-t border-rule py-1.5 text-sm"
                    >
                      <span>
                        <span className="block font-medium">
                          {labels.get(c.id) ?? c.id}
                        </span>
                        <span className="block">{c.reason}</span>
                      </span>
                      <span className="tabular-nums">
                        {c.score}/{c.max}
                      </span>
                    </li>
                  ))}
                </ul>
                {e.tags.length > 0 && (
                  <p className="text-sm">Shows: {e.tags.join(", ")}</p>
                )}
              </div>
            </details>
          </div>
        ))}
      </section>
    </main>
  );
}
