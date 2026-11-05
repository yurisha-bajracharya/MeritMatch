"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import { x } from "@/lib/i18n-extra";
import { localizeDigits } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export type EmployerJobRow = {
  id: string;
  title: string;
  location: string;
  created_at: string;
  applicants: number;
  shortlisted: number;
  rejected: number;
};

/** The recruiter's home: every job they posted, with where each one stands. */
export default function EmployerJobs({ name, jobs }: { name: string; jobs: EmployerJobRow[] }) {
  const [lang] = useLang();
  const [copied, setCopied] = useState<string | null>(null);
  const n = (v: number) => localizeDigits(v, lang);

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${id}`);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="container-main mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title">{x("myJobsTitle", lang)}</h1>
          <p className="text-sm text-ink-light">{x("welcomeBack", lang, { name })}</p>
        </div>
        <Link href="/employer/post" className="btn-primary btn-sm shrink-0">
          {x("postFirstJob", lang)}
        </Link>
      </div>
      <p className="-mt-3 text-xs text-ink-muted">{x("myJobsSub", lang)}</p>

      {jobs.length === 0 ? (
        <div className="card py-12 text-center text-sm text-ink-muted">{x("noJobsYet", lang)}</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => {
            const pending = Math.max(0, j.applicants - j.shortlisted - j.rejected);
            return (
              <div key={j.id} className="card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{j.title}</h2>
                    <p className="text-xs text-ink-muted">
                      {j.location} · {new Date(j.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : undefined)}
                    </p>
                  </div>
                  <Link href={`/employer/jobs/${j.id}`} className="btn-primary btn-sm">
                    {x("viewApplicants", lang)}
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {[
                    [x("statApplicants", lang), j.applicants],
                    [x("statPending", lang), pending],
                    [x("statShortlisted", lang), j.shortlisted],
                    [x("statRejected", lang), j.rejected],
                  ].map(([label, v]) => (
                    <div key={String(label)} className="rounded bg-paper-dark p-2">
                      <p className="text-ink-muted">{label}</p>
                      <p className="text-base font-bold">{n(Number(v))}</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => copy(j.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand hover:underline">
                  <Icon name={copied === j.id ? "check" : "upload"} size={12} />
                  {copied === j.id ? x("done", lang) : x("shareTaskLink", lang)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
