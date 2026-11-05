"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "./Icon";
import EvidenceReview from "./EvidenceReview";
import ScoringExplainer from "./ScoringExplainer";
import { MCQ_WEIGHT } from "@/lib/mcq";
import { x, flagText } from "@/lib/i18n-extra";
import { localizeDigits } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { TAG_LABELS } from "@/lib/tags";
import type { RankedEntry } from "@/lib/shortlist";
import type { Bilingual, Evidence } from "@/lib/types";

type JobInfo = {
  id: string;
  title: string;
  employer_name: string;
  location: string;
  ai_scoring: boolean;
  evidence: Evidence;
};

/**
 * The employer's ranked list. The employer decides who is shortlisted (the
 * quarter-by-score rule is only a "Suggested" hint); once at least one person
 * is shortlisted the list opens on just those people.
 */
export default function RankingList({
  job,
  initial,
  isOwner,
  criteriaLabels,
}: {
  job: JobInfo;
  initial: RankedEntry[];
  isOwner: boolean;
  criteriaLabels: Record<string, Bilingual>;
}) {
  const [lang] = useLang();
  const [entries, setEntries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const shortlistedCount = entries.filter((e) => e.shortlisted).length;
  // null = follow the default (shortlisted if any, otherwise everyone)
  const [tab, setTab] = useState<"all" | "shortlisted" | null>(null);
  const view = tab ?? (shortlistedCount > 0 ? "shortlisted" : "all");
  const n = (v: number) => localizeDigits(v, lang);

  const shown = useMemo(
    () => (view === "shortlisted" ? entries.filter((e) => e.shortlisted) : entries),
    [entries, view],
  );

  const toggle = async (e: RankedEntry) => {
    setBusy(e.submissionId);
    setError("");
    try {
      const res = await fetch(`/api/submissions/${e.submissionId}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlisted: !e.shortlisted }),
      });
      if (!res.ok) throw new Error("save");
      setEntries((prev) =>
        prev.map((p) => (p.submissionId === e.submissionId ? { ...p, shortlisted: !e.shortlisted } : p)),
      );
      // First shortlist? Open on the shortlisted view, as asked.
      setTab(null);
    } catch {
      setError(x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const fitLabel = { preferred: "fitPreferred", anywhere: "fitAnywhere", elsewhere: "fitElsewhere" } as const;
  const w = Math.round(MCQ_WEIGHT * 100);

  const tabBtn = (id: "all" | "shortlisted", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={view === id}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        view === id ? "border-brand bg-brand-light text-brand" : "border-rule text-ink-light hover:border-brand/50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container-main mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title">{job.title}</h1>
          <p className="text-sm text-ink-light">
            {job.employer_name} · {job.location} · {x("applicantsCount", lang, { n: n(entries.length) })}
          </p>
        </div>
        <Link href={`/employer/jobs/${job.id}/bias`} className="btn-secondary btn-sm shrink-0">
          {x("fairness", lang)}
        </Link>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tabBtn("shortlisted", x("tabShortlisted", lang, { n: n(shortlistedCount) }))}
          {tabBtn("all", x("tabAll", lang, { n: n(entries.length) }))}
        </div>
      )}
      {view === "shortlisted" && shortlistedCount > 0 && (
        <p className="-mt-3 text-xs text-ink-muted">{x("onlyShortlistedNote", lang)}</p>
      )}
      {isOwner && shortlistedCount === 0 && entries.length > 0 && (
        <p className="-mt-3 text-xs text-ink-muted">{x("suggestedHint", lang)}</p>
      )}

      {error && <div className="rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</div>}

      {entries.length === 0 ? (
        <div className="card py-12 text-center text-sm text-ink-muted">{x("noApplicants", lang)}</div>
      ) : shown.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink-muted">{x("noneShortlisted", lang)}</div>
      ) : (
        <div className="space-y-3">
          {shown.map((entry) => (
            <div key={entry.submissionId} className={`card !p-4 ${entry.shortlisted ? "ring-1 ring-brand" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
                    #{n(entry.rank)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold">{entry.label}</span>
                    {entry.shortlisted ? (
                      <span className="badge-moss inline-flex items-center gap-1 text-[10px]">
                        <Icon name="check" size={11} strokeWidth={3} />
                        {x("shortlistedBadge", lang)}
                      </span>
                    ) : (
                      entry.suggested && <span className="badge-muted text-[10px]">{x("suggestedBadge", lang)}</span>
                    )}
                  </div>
                </div>
                <span className="text-lg font-bold text-brand">{n(entry.total)}%</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                {entry.mcqTotal ? (
                  <span className="badge-muted">
                    {x("choices", lang, { a: n(entry.mcqCorrect ?? 0), b: n(entry.mcqTotal), w: n(w) })}
                  </span>
                ) : null}
                {entry.writtenScore !== null && (
                  <span className="badge-muted">
                    {x("written", lang, { a: n(entry.writtenScore), w: n(100 - w) })}
                  </span>
                )}
                {entry.fit !== "unknown" && (
                  <span className={`inline-flex items-center gap-1 ${entry.fit === "elsewhere" ? "badge-ochre" : "badge-moss"}`}>
                    <Icon name="pin" size={11} />
                    {x(fitLabel[entry.fit], lang)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-ink-muted">{entry.reason}</p>

              {entry.flags.length > 0 && (
                <div className="mt-3 rounded-lg border border-ochre/25 bg-ochre-light p-3">
                  <p className="text-xs font-semibold text-ochre">{x("closerLook", lang)}</p>
                  <ul className="mt-1 space-y-0.5">
                    {entry.flags.map((f, i) => (
                      <li key={i} className="text-xs text-ink-light">
                        {flagText(f, lang)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] text-ink-muted">{x("closerLookHint", lang)}</p>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                {entry.criteria.map((c) => (
                  <div key={c.id} className="rounded bg-paper-dark p-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-ink-light">{criteriaLabels[c.id]?.[lang] ?? c.id}</span>
                      <span className="font-semibold">
                        {n(c.score)}/{n(c.max)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink-muted">{c.reason}</p>
                  </div>
                ))}
              </div>

              {entry.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="badge-brand text-[10px]">
                      {TAG_LABELS[tag]?.[lang] ?? tag}
                    </span>
                  ))}
                </div>
              )}

              {isOwner && (
                <EvidenceReview submissionId={entry.submissionId} media={entry.media} reviews={entry.reviews} />
              )}
              {!isOwner && entry.media.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <Icon name="lock" size={12} />
                  {x("privateMedia", lang)}
                </p>
              )}

              {entry.consent && entry.contact ? (
                <div className="mt-3 rounded bg-moss-light p-2 text-xs text-moss">
                  <span className="font-semibold">{x("identityRevealed", lang)}:</span> {entry.contact.name} ·{" "}
                  {entry.contact.phone}
                </div>
              ) : entry.shortlisted ? (
                <p className="mt-2 text-[10px] italic text-ink-muted">{x("waitingConsent", lang)}</p>
              ) : null}

              {isOwner && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggle(entry)}
                    disabled={busy === entry.submissionId}
                    className={entry.shortlisted ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
                  >
                    {busy === entry.submissionId
                      ? x("saving", lang)
                      : entry.shortlisted
                        ? x("removeShortlist", lang)
                        : x("shortlist", lang)}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ScoringExplainer
        lang={lang}
        audience="employer"
        aiScoring={job.ai_scoring}
        evidence={job.evidence}
        title={x("howScored", lang)}
      />
    </div>
  );
}
