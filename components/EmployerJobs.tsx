"use client";

import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { useState } from "react";
import Icon from "./Icon";
import { x } from "@/lib/i18n-extra";
import { localizeDigits } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { JOB_STATUS } from "./EmployerVerification";

export type EmployerJobRow = {
  id: string;
  title: string;
  location: string;
  created_at: string;
  applicants: number;
  shortlisted: number;
  rejected: number;
  review_status: string;
  review_note: string;
};

export type EmployerVerificationSummary = {
  contact: boolean;
  business: string;
  presence: string;
  employer: boolean;
  restricted: boolean;
};

const STEP_WORD: Record<string, Record<"en" | "ne", string>> = {
  none: { en: "to do", ne: "बाँकी" },
  submitted: { en: "in review", ne: "समीक्षामा" },
  needs_info: { en: "more info needed", ne: "थप जानकारी चाहिन्छ" },
  approved: { en: "done", ne: "पूरा" },
  rejected: { en: "not accepted", ne: "स्वीकार भएन" },
};

/** The recruiter's home: every job they posted, with where each one stands. */
export default function EmployerJobs({
  name,
  jobs,
  verification,
  hires = 0,
  checkinsDue = 0,
}: {
  name: string;
  jobs: EmployerJobRow[];
  verification: EmployerVerificationSummary;
  hires?: number;
  checkinsDue?: number;
}) {
  const [lang] = useLang();
  const [copied, setCopied] = useState<string | null>(null);
  const n = (v: number) => localizeDigits(v, lang);
  const ne = lang === "ne";

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${id}`);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="container-main mx-auto max-w-4xl space-y-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{x("myJobsTitle", lang)}</h1>
          <p className="text-sm text-ink-light">{x("welcomeBack", lang, { name })}</p>
        </div>
        <Link href="/employer/post" className="btn-primary btn-sm shrink-0">
          {x("postFirstJob", lang)}
        </Link>
      </div>
      <p className="-mt-3 text-sm text-ink-muted">{x("myJobsSub", lang)}</p>

      {/* Hires and formalisation */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rule p-5">
        <div>
          <p className="text-base font-semibold">
            {ne ? `मेरिटम्याचबाट ${n(hires)} जना नियुक्त` : `${hires} ${hires === 1 ? "person" : "people"} hired through MeritMatch`}
          </p>
          <p className="mt-1 text-sm text-ink-light">
            {checkinsDue > 0
              ? ne
                ? `${n(checkinsDue)} वटा चेक-इन बाँकी। हरेकमा एक मिनेट लाग्छ।`
                : `${checkinsDue} check-in${checkinsDue === 1 ? "" : "s"} due. Each takes a minute.`
              : ne
                ? "नियुक्तिपत्र, SSF र ३०/६०/९० दिनको अवस्था एकै ठाउँमा।"
                : "Appointment letters, SSF and 30/60/90-day status in one place."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/employer/report" className="btn-secondary btn-sm">
            {ne ? "औपचारिक रोजगारी प्रतिवेदन" : "Formalisation report"}
          </Link>
          <Link href="/employer/talent" className="btn-primary btn-sm">
            {ne ? "प्रतिभा खोज्नुहोस्" : "Find top talent"}
          </Link>
          <Link href="/formalize" className="btn-secondary btn-sm">
            {ne ? "व्यवसाय औपचारिक बनाउनुहोस्" : "Formalize your business"}
          </Link>
        </div>
      </section>

      {/* Verification summary: what applicants see about this business */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rule p-5">
        <div>
          <p className="text-base font-semibold">
            {verification.employer
              ? ne
                ? "तपाईंको व्यवसाय प्रमाणित छ"
                : "Your business is verified"
              : ne
                ? "प्रमाणीकरण पूरा गर्नुहोस्"
                : "Finish verifying your business"}
          </p>
          <p className="mt-1 text-sm text-ink-light">
            {[
              [ne ? "सम्पर्क" : "Contact", verification.contact ? "approved" : "none"],
              [ne ? "पहिचान" : "Identity", verification.business],
              [ne ? "उपस्थिति" : "Presence", verification.presence],
            ]
              .map(([k, st]) => `${k}: ${STEP_WORD[st as string]?.[lang] ?? st}`)
              .join(" · ")}
          </p>
          {verification.restricted && (
            <p className="mt-2 text-sm font-medium text-danger">
              {ne ? "खाता अस्थायी रूपमा प्रतिबन्धित छ; तपाईंका काम लुकाइएका छन्।" : "Account temporarily restricted; your jobs are hidden."}
            </p>
          )}
        </div>
        <Link href="/employer/verify" className="btn-secondary btn-sm">
          {verification.employer ? (ne ? "विवरण हेर्नुहोस्" : "View details") : ne ? "जारी राख्नुहोस्" : "Continue"}
        </Link>
      </section>

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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{j.title}</h2>
                      <span className={JOB_STATUS[j.review_status]?.cls ?? "badge-muted"}>
                        {JOB_STATUS[j.review_status]?.label[lang] ?? j.review_status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {j.location} · {formatDate(j.created_at, lang, true)}
                    </p>
                  </div>
                  <Link href={`/employer/jobs/${j.id}`} className="btn-primary btn-sm">
                    {x("viewApplicants", lang)}
                  </Link>
                </div>
                {j.review_note && j.review_status !== "approved" && (
                  <p className="alert-note mt-3">
                    <span className="font-semibold">{ne ? "समीक्षकको सन्देश: " : "Reviewer: "}</span>
                    {j.review_note}
                  </p>
                )}
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
                <button type="button" onClick={() => copy(j.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-ink hover:underline">
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
