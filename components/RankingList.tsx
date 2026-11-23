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
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: "month" | "day" | "hour";
  hours?: string;
  employment_type?: string;
  responsibilities?: string;
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
  questions,
  unlock,
}: {
  job: JobInfo;
  initial: RankedEntry[];
  isOwner: boolean;
  criteriaLabels: Record<string, Bilingual>;
  questions: { id: string; prompt: Bilingual; mine: boolean }[];
  unlock: { price: number; free: boolean };
}) {
  const [lang] = useLang();
  const [entries, setEntries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [idHint, setIdHint] = useState<string | null>(null);
  const [hiring, setHiring] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [hireForm, setHireForm] = useState({
    start_date: today,
    salary: String(job.salary_max ?? job.salary_min ?? ""),
    salary_period: job.salary_period ?? "month",
    employment_type: job.employment_type || "full-time",
    probation_months: "3",
  });
  const shortlistedCount = entries.filter((e) => e.shortlisted).length;
  // null = follow the default (shortlisted if any, otherwise everyone)
  const [tab, setTab] = useState<"all" | "shortlisted" | "rejected" | null>(null);
  const rejectedCount = entries.filter((e) => e.rejected).length;
  const view = tab ?? (shortlistedCount > 0 ? "shortlisted" : "all");
  const n = (v: number) => localizeDigits(v, lang);

  const shown = useMemo(
    () =>
      view === "shortlisted"
        ? entries.filter((e) => e.shortlisted)
        : view === "rejected"
          ? entries.filter((e) => e.rejected)
          : entries,
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
        prev.map((p) =>
          p.submissionId === e.submissionId
            ? { ...p, shortlisted: !e.shortlisted, rejected: !e.shortlisted ? false : p.rejected, interview: e.shortlisted ? false : p.interview }
            : p,
        ),
      );
      // First shortlist? Open on the shortlisted view, as asked.
      setTab(null);
    } catch {
      setError(x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const reject = async (e: RankedEntry) => {
    setBusy(e.submissionId);
    setError("");
    try {
      const res = await fetch(`/api/submissions/${e.submissionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejected: !e.rejected }),
      });
      if (!res.ok) throw new Error("save");
      setEntries((prev) =>
        prev.map((p) =>
          p.submissionId === e.submissionId
            ? { ...p, rejected: !e.rejected, shortlisted: !e.rejected ? false : p.shortlisted, interview: !e.rejected ? false : p.interview }
            : p,
        ),
      );
      setTab(null);
    } catch {
      setError(x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const patch = (id: string, change: Partial<RankedEntry>) =>
    setEntries((prev) => prev.map((p) => (p.submissionId === id ? { ...p, ...change } : p)));

  const invite = async (e: RankedEntry, on: boolean) => {
    setBusy(e.submissionId);
    setError("");
    try {
      const res = await fetch(`/api/submissions/${e.submissionId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invited: on, note: on ? note : "" }),
      });
      if (!res.ok) throw new Error("save");
      patch(e.submissionId, { interview: on, interviewNote: on ? note.trim() : "" });
      setInviting(null);
      setNote("");
    } catch {
      setError(x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const unlockContact = async (e: RankedEntry) => {
    setBusy(e.submissionId);
    setError("");
    try {
      const res = await fetch(`/api/submissions/${e.submissionId}/unlock`, { method: "POST" });
      if (!res.ok) throw new Error("save");
      const d = await res.json();
      patch(e.submissionId, { unlocked: true, contact: d.contact });
    } catch {
      setError(x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const hire = async (e: RankedEntry) => {
    setBusy(e.submissionId);
    setError("");
    try {
      const res = await fetch(`/api/submissions/${e.submissionId}/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hireForm),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "save");
      patch(e.submissionId, { hireId: d.hire_id });
      setHiring(null);
    } catch (err) {
      setError(err instanceof Error && err.message !== "save" ? err.message : x("couldNotSave", lang));
    } finally {
      setBusy(null);
    }
  };

  const fitLabel = { preferred: "fitPreferred", anywhere: "fitAnywhere", elsewhere: "fitElsewhere" } as const;
  const w = Math.round(MCQ_WEIGHT * 100);

  const tabBtn = (id: "all" | "shortlisted" | "rejected", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={view === id}
      className={`chip ${view === id ? "chip-on" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="container-main mx-auto max-w-4xl space-y-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{job.title}</h1>
          <p className="text-sm text-ink-light">
            {job.employer_name} · {job.location} · {x("applicantsCount", lang, { n: n(entries.length) })}
          </p>
        </div>
        <Link href={`/employer/jobs/${job.id}/bias`} className="btn-secondary btn-sm shrink-0">
          {x("fairness", lang)}
        </Link>
      </div>

      {isOwner && questions.length > 0 && (
        <details className="card !p-4 text-sm">
          <summary className="cursor-pointer font-medium">
            {x("questionsTitle", lang, { n: n(questions.length) })}
          </summary>
          <p className="mt-2 text-xs text-ink-muted">{x("questionsHint", lang)}</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-light">
            {questions.map((q) => (
              <li key={q.id}>
                {q.prompt[lang]}
                {q.mine && <span className="badge-brand ml-2 text-xs">{x("mine", lang)}</span>}
              </li>
            ))}
          </ol>
        </details>
      )}

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tabBtn("shortlisted", x("tabShortlisted", lang, { n: n(shortlistedCount) }))}
          {tabBtn("all", x("tabAll", lang, { n: n(entries.length) }))}
          {rejectedCount > 0 && tabBtn("rejected", x("tabRejected", lang, { n: n(rejectedCount) }))}
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
        <div className="card py-10 text-center text-sm text-ink-muted">
          {view === "rejected" ? x("noneRejected", lang) : x("noneShortlisted", lang)}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((entry) => (
            <div key={entry.submissionId} className={`card !p-4 ${entry.shortlisted ? "ring-1 ring-brand" : ""} ${entry.rejected ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-ink">
                    #{n(entry.rank)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold">{entry.label}</span>
                    {entry.idVerified && (
                      <button
                        type="button"
                        className="badge-moss cursor-help"
                        title={x("idVerifiedHint", lang)}
                        aria-label={`${x("idVerified", lang)}. ${x("idVerifiedHint", lang)}`}
                        onClick={() => setIdHint(idHint === entry.submissionId ? null : entry.submissionId)}
                      >
                        <Icon name="check-circle" size={12} />
                        {x("idVerified", lang)}
                      </button>
                    )}
                    {entry.shortlisted ? (
                      <span className="badge-moss inline-flex items-center gap-1 text-xs">
                        <Icon name="check" size={11} strokeWidth={3} />
                        {x("shortlistedBadge", lang)}
                      </span>
                    ) : entry.rejected ? (
                      <span className="badge-ochre text-xs">{x("rejectedBadge", lang)}</span>
                    ) : (
                      entry.suggested && <span className="badge-muted text-xs">{x("suggestedBadge", lang)}</span>
                    )}
                  </div>
                </div>
                <span className="text-lg font-bold text-brand-ink">{n(entry.total)}%</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
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

              {idHint === entry.submissionId && (
                <p className="mt-2 rounded-md border border-moss/20 bg-moss-light/50 p-2 text-xs text-ink">{x("idVerifiedHint", lang)}</p>
              )}
              <p className="mt-2 text-xs text-ink-muted">{entry.reason}</p>

              {/* Skills: what this person has SHOWN (this task, earlier tasks)
                  kept apart from what they only SAY they have. */}
              <div className="mt-3 rounded-lg border border-rule p-3">
                <p className="text-sm font-semibold text-ink">{x("skillsTitle", lang)}</p>

                <div className="mt-2">
                  <p className="text-xs text-ink-muted">{x("skillsThisTask", lang)}</p>
                  {entry.tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="badge-moss">
                          <Icon name="check" size={12} strokeWidth={3} />
                          {TAG_LABELS[tag]?.[lang] ?? tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-ink-light">{x("skillsNoneYet", lang)}</p>
                  )}
                </div>

                {isOwner && entry.track.proven.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-ink-muted">{x("skillsEarlier", lang)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {entry.track.proven.map((p) => (
                        <span key={p.tag} className="badge-moss">
                          {TAG_LABELS[p.tag]?.[lang] ?? p.tag}
                          {p.count > 1 ? ` x${n(p.count)}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isOwner && entry.track.claimed.some((t) => !entry.tags.includes(t)) && (
                  <div className="mt-3">
                    <p className="text-xs text-ink-muted">{x("trackClaimed", lang)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {entry.track.claimed.filter((t) => !entry.tags.includes(t)).map((tag) => (
                        <span key={tag} className="badge-muted">
                          {TAG_LABELS[tag]?.[lang] ?? tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isOwner && (
                  <p className="mt-3 border-t border-rule pt-2 text-xs text-ink-light">
                    <span className="font-semibold">{x("trackTitle", lang)}: </span>
                    {entry.track.tasks === 0
                      ? x("trackNone", lang)
                      : x("trackSummary", lang, { n: n(entry.track.tasks), avg: n(entry.track.average) })}
                    {entry.track.recent.length > 0 &&
                      ` (${entry.track.recent.map((r) => `${r.name[lang]} ${n(r.total)}%`).join(", ")})`}
                    <span className="block text-ink-muted">{x("trackAnon", lang)}</span>
                  </p>
                )}
              </div>

              {entry.flags.length === 0 && isOwner && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-moss">
                  <Icon name="check-circle" size={13} />
                  {x("noFlags", lang)}
                </p>
              )}
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
                  <p className="mt-2 text-xs text-ink-muted">{x("closerLookHint", lang)}</p>
                </div>
              )}

              {isOwner && entry.answers.length > 0 && (
                <details className="mt-3 rounded-lg border border-rule p-3 text-sm" open={entry.flags.length > 0}>
                  <summary className="cursor-pointer font-medium">{x("answersTitle", lang)}</summary>
                  <ol className="mt-3 space-y-3">
                    {questions.map((q, qi) => {
                      const a = entry.answers.find((r) => r.scenarioId === q.id);
                      return (
                        <li key={q.id}>
                          <p className="text-xs font-semibold text-ink-light">
                            {n(qi + 1)}. {q.prompt[lang]}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap rounded bg-paper-dark p-2 text-xs text-ink">
                            {a?.text?.trim() || x("noAnswer", lang)}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </details>
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
                    <p className="mt-0.5 text-xs text-ink-muted">{c.reason}</p>
                  </div>
                ))}
              </div>

              {isOwner && (
                <EvidenceReview submissionId={entry.submissionId} media={entry.media} reviews={entry.reviews} />
              )}
              {!isOwner && entry.media.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Icon name="lock" size={12} />
                  {x("privateMedia", lang)}
                </p>
              )}

              {entry.interview && (
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-moss">
                  <Icon name="check-circle" size={13} />
                  <span className="font-semibold">{x("interviewInvitedBadge", lang)}</span>
                  {entry.interviewNote && <span className="text-ink-light">: {entry.interviewNote}</span>}
                </p>
              )}

              {entry.contact ? (
                <div className="mt-3 rounded bg-moss-light p-2 text-xs text-moss">
                  <span className="font-semibold">{x("identityRevealed", lang)}:</span> {entry.contact.name} ·{" "}
                  {entry.contact.phone}
                  {isOwner && entry.hireId && (
                    <a href={`/hire/${entry.hireId}`} className="ml-2 font-semibold underline">
                      {lang === "ne" ? "नियुक्ति र चेक-इन हेर्नुहोस्" : "Hired: view job record"}
                    </a>
                  )}
                  {isOwner && !entry.hireId && entry.shortlisted && hiring !== entry.submissionId && (
                    <button type="button" onClick={() => setHiring(entry.submissionId)} className="btn-primary btn-sm mt-2 block">
                      {lang === "ne" ? "नियुक्त गरियो भनी चिनो लगाउनुहोस्" : "Mark as hired"}
                    </button>
                  )}
                  {isOwner && hiring === entry.submissionId && (
                    <div className="mt-3 grid gap-3 rounded-md border border-rule bg-white p-3 text-ink sm:grid-cols-2">
                      <div>
                        <label className="label" htmlFor={`hs-${entry.submissionId}`}>{lang === "ne" ? "सुरु मिति" : "Start date"}</label>
                        <input id={`hs-${entry.submissionId}`} type="date" className="input" value={hireForm.start_date} onChange={(ev) => setHireForm({ ...hireForm, start_date: ev.target.value })} />
                      </div>
                      <div>
                        <label className="label" htmlFor={`hp-${entry.submissionId}`}>{lang === "ne" ? "परीक्षणकाल (महिना)" : "Probation (months)"}</label>
                        <input id={`hp-${entry.submissionId}`} type="number" min={0} max={12} className="input" value={hireForm.probation_months} onChange={(ev) => setHireForm({ ...hireForm, probation_months: ev.target.value })} />
                      </div>
                      <div>
                        <label className="label" htmlFor={`hm-${entry.submissionId}`}>{lang === "ne" ? "तय भएको तलब (रु)" : "Agreed salary (Rs)"}</label>
                        <input id={`hm-${entry.submissionId}`} inputMode="numeric" className="input" value={hireForm.salary} onChange={(ev) => setHireForm({ ...hireForm, salary: ev.target.value.replace(/[^\d]/g, "") })} />
                      </div>
                      <div>
                        <label className="label" htmlFor={`hper-${entry.submissionId}`}>{lang === "ne" ? "अवधि" : "Per"}</label>
                        <select id={`hper-${entry.submissionId}`} className="input" value={hireForm.salary_period} onChange={(ev) => setHireForm({ ...hireForm, salary_period: ev.target.value as "month" | "day" | "hour" })}>
                          <option value="month">{lang === "ne" ? "महिना" : "month"}</option>
                          <option value="day">{lang === "ne" ? "दिन" : "day"}</option>
                          <option value="hour">{lang === "ne" ? "घण्टा" : "hour"}</option>
                        </select>
                      </div>
                      <p className="hint sm:col-span-2">
                        {lang === "ne"
                          ? "न्यूनतम पारिश्रमिक (२०८२ साउनदेखि): मासिक रु १९,५५०, दैनिक रु ७५४। नियुक्तिपत्रको मस्यौदा स्वतः बन्छ र ३०/६०/९० दिनका चेक-इन सुरु हुन्छन्।"
                          : "Legal minimum (from 17 July 2025): Rs 19,550 a month, Rs 754 a day. An appointment letter is drafted for you and 30/60/90-day check-ins begin."}
                      </p>
                      <div className="flex gap-2 sm:col-span-2">
                        <button type="button" className="btn-primary btn-sm" disabled={busy === entry.submissionId} onClick={() => hire(entry)}>
                          {lang === "ne" ? "नियुक्ति पक्का गर्नुहोस्" : "Confirm hire"}
                        </button>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => setHiring(null)}>
                          {lang === "ne" ? "रद्द" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : entry.shortlisted && entry.consent && isOwner ? (
                <div className="mt-3 rounded bg-paper-dark p-2 text-xs">
                  <p className="text-ink-light">{x("agreedLocked", lang)}</p>
                  <button
                    type="button"
                    onClick={() => unlockContact(entry)}
                    disabled={busy === entry.submissionId}
                    className="btn-primary btn-sm mt-2"
                  >
                    {busy === entry.submissionId
                      ? x("unlocking", lang)
                      : unlock.free
                        ? x("unlockFree", lang)
                        : x("unlockContact", lang, { price: n(unlock.price) })}
                  </button>
                </div>
              ) : entry.shortlisted ? (
                <p className="mt-2 text-xs italic text-ink-muted">{x("waitingConsent", lang)}</p>
              ) : (
                <p className="mt-2 text-xs italic text-ink-muted">{x("needShortlistFirst", lang)}</p>
              )}

              {isOwner && (
                <div className="mt-3 flex flex-wrap gap-2">
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
                  <button
                    type="button"
                    onClick={() => reject(entry)}
                    disabled={busy === entry.submissionId}
                    className="btn-secondary btn-sm"
                  >
                    {entry.rejected ? x("undoReject", lang) : x("reject", lang)}
                  </button>
                  {entry.shortlisted &&
                    (entry.interview ? (
                      <button
                        type="button"
                        onClick={() => invite(entry, false)}
                        disabled={busy === entry.submissionId}
                        className="btn-secondary btn-sm"
                      >
                        {x("cancelInvite", lang)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setInviting(inviting === entry.submissionId ? null : entry.submissionId);
                          setNote("");
                        }}
                        className="btn-secondary btn-sm"
                      >
                        {x("inviteInterview", lang)}
                      </button>
                    ))}
                </div>
              )}
              {isOwner && inviting === entry.submissionId && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={note}
                    onChange={(ev) => setNote(ev.target.value)}
                    maxLength={200}
                    placeholder={x("interviewNotePh", lang)}
                    className="input min-w-0 flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => invite(entry, true)}
                    disabled={busy === entry.submissionId}
                    className="btn-primary btn-sm"
                  >
                    {x("sendInvite", lang)}
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
