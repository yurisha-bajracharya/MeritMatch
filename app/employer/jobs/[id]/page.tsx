import { getRanking } from "@/lib/shortlist";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function EmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getRanking(id);
  if (!result) notFound();

  const { job, entries } = result;

  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">{job.title}</h1>
            <p className="text-sm text-ink-light">
              {job.employer_name} · {job.location} · {entries.length} applicants
            </p>
          </div>
          <Link
            href={`/employer/jobs/${id}/bias`}
            className="btn-secondary btn-sm"
          >
            Fairness Dashboard
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="card text-center text-sm text-ink-muted py-12">
            No applicants yet. Share your job link to get started.
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {entries.map((entry) => (
              <div
                key={entry.submissionId}
                className={`card !p-4 ${entry.shortlisted ? "ring-1 ring-brand" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand-dark flex items-center justify-center text-xs font-bold">
                      #{entry.rank}
                    </span>
                    <div>
                      <span className="font-mono text-sm font-semibold">
                        {entry.label}
                      </span>
                      {entry.shortlisted && (
                        <span className="badge-moss ml-2 text-[10px]">
                          Shortlisted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand">
                      {entry.total}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted mt-2">{entry.reason}</p>

                {/* Criteria breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {entry.criteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded bg-paper-dark text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="text-ink-light">{c.id}</span>
                        <span className="font-semibold">
                          {c.score}/{c.max}
                        </span>
                      </div>
                      <p className="text-ink-muted mt-0.5 text-[10px]">
                        {c.reason}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="badge-brand text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact info (if consent given) */}
                {entry.consent && entry.contact ? (
                  <div className="mt-3 p-2 rounded bg-moss-light text-xs text-moss">
                    <span className="font-semibold">Identity Revealed:</span>{" "}
                    {entry.contact.name} · {entry.contact.phone}
                  </div>
                ) : entry.shortlisted ? (
                  <p className="mt-2 text-[10px] text-ink-muted italic">
                    Waiting for candidate consent to reveal identity
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
