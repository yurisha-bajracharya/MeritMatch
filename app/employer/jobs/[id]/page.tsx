import { getRanking } from "@/lib/shortlist";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Icon from "@/components/Icon";
import ScoringExplainer from "@/components/ScoringExplainer";
import EvidenceReview from "@/components/EvidenceReview";
import { getSession } from "@/lib/auth";
import { MCQ_WEIGHT } from "@/lib/mcq";

export default async function EmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getRanking(id);
  if (!result) notFound();

  const { job, entries } = result;

  // Photos, video and the rating form are for the job's own employer only.
  const session = await getSession();
  const isOwner = session?.role === "employer" && session.userId === job.employer_id;
  const fitLabel = {
    preferred: "Wants this city",
    anywhere: "Open to anywhere",
    elsewhere: "Prefers another city",
    unknown: "",
  } as const;

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
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-bold">
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

                {/* Where the number came from, and the city signal */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {entry.mcqTotal ? (
                    <span className="badge-muted">
                      Choices {entry.mcqCorrect}/{entry.mcqTotal} ({Math.round(MCQ_WEIGHT * 100)}%)
                    </span>
                  ) : null}
                  {entry.writtenScore !== null && (
                    <span className="badge-muted">
                      Written {entry.writtenScore}% ({100 - Math.round(MCQ_WEIGHT * 100)}%)
                    </span>
                  )}
                  {entry.fit !== "unknown" && (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        entry.fit === "elsewhere" ? "badge-ochre" : "badge-moss"
                      }`}
                    >
                      <Icon name="pin" size={11} />
                      {fitLabel[entry.fit]}
                    </span>
                  )}
                </div>

                <p className="text-xs text-ink-muted mt-2">{entry.reason}</p>

                {/* Integrity notes: advisory, never affect rank */}
                {entry.flags.length > 0 && (
                  <div className="mt-3 rounded-lg bg-ochre-light border border-ochre/25 p-3">
                    <p className="text-xs font-semibold text-ochre">
                      Worth a closer look
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {entry.flags.map((f, i) => (
                        <li key={i} className="text-xs text-ink-light">
                          {f.note}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-ink-muted mt-2">
                      A signal, not proof. Consider asking a short follow-up
                      question before deciding.
                    </p>
                  </div>
                )}

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

                {/* Photos / video + human rating (owner only) */}
                {isOwner && (
                  <EvidenceReview
                    submissionId={entry.submissionId}
                    media={entry.media}
                    reviews={entry.reviews}
                  />
                )}
                {!isOwner && entry.media.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <Icon name="lock" size={12} />
                    Photos and video are private to the employer who posted this job.
                  </p>
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

        <ScoringExplainer
          audience="employer"
          aiScoring={job.ai_scoring}
          evidence={job.evidence}
          title="How these scores were produced"
        />
      </div>
    </>
  );
}
