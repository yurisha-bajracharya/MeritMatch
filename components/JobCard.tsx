"use client";

import Link from "next/link";
import { formatDate } from "@/lib/dates";
import Icon from "./Icon";
import type { LocationFit } from "@/lib/places";
import type { Job, Lang } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";
import { EMPLOYMENT_LABEL, formatSalary } from "@/lib/job-format";
import ReportButton from "./ReportButton";
import VerificationBadges from "./VerificationBadges";

export const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  retail: { en: "Retail / Shop", ne: "पसल / रिटेल" },
  admin: { en: "Office / Admin", ne: "कार्यालय / प्रशासन" },
  office: { en: "Data / Clerical", ne: "डेटा / क्लेरिकल" },
  hospitality: { en: "Hotel / Restaurant", ne: "होटल / रेस्टुरेन्ट" },
  teaching: { en: "Teaching / Tutoring", ne: "शिक्षण / ट्युसन" },
  driving: { en: "Driving / Delivery", ne: "ड्राइभिङ / डेलिभरी" },
  construction: { en: "Construction / Labour", ne: "निर्माण / श्रम" },
  "it-support": { en: "IT / Tech Support", ne: "आईटी / टेक सपोर्ट" },
  tailoring: { en: "Tailoring / Crafts", ne: "सिलाइ / हस्तकला" },
};

/**
 * One job as a row: what it is, where, how long the task takes, which skills
 * it tests, then the one action. Badges only for facts that change whether
 * someone applies (AI scoring, photo/video asked, their city, verified).
 */
export default function JobCard({
  job,
  lang,
  highlight,
  fit,
}: {
  job: Job;
  lang: Lang;
  highlight?: boolean;
  /** How this job's city compares to the viewer's preferred cities. */
  fit?: LocationFit;
}) {
  const salary = formatSalary(job, lang);
  const skills = job.tags.slice(0, 4).map((tag) => TAG_LABELS[tag]?.[lang] ?? tag);
  const more = job.tags.length - skills.length;
  const posted = formatDate(job.created_at, lang, true);

  return (
    <article
      className={`grid gap-4 rounded-lg border bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:p-6 ${
        highlight ? "border-brand ring-2 ring-brand/30" : "border-rule"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{CATEGORY_LABELS[job.category]?.[lang] ?? job.category}</p>
        <h3 className="mt-0.5 text-xl font-semibold text-ink">
          <Link href={`/t/${job.id}`} className="hover:underline underline-offset-4">
            {job.title}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-ink-light">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="building" size={16} className="text-ink-muted" />
            {job.employer_id ? (
              <Link href={`/employers/${job.employer_id}`} className="underline-offset-4 hover:text-ink hover:underline">
                {job.employer_name}
              </Link>
            ) : (
              job.employer_name
            )}
          </span>
          {job.location && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" size={16} className="text-ink-muted" />
              {job.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={16} className="text-ink-muted" />
            {lang === "ne"
              ? `${localizeDigits(job.duration_min, lang)} मिनेटको कार्य`
              : `${job.duration_min}-minute task`}
          </span>
        </p>

        {salary && (
          <p className="mt-2 text-base font-semibold text-ink">
            {salary}
            {job.employment_type && (
              <span className="font-normal text-ink-light"> · {EMPLOYMENT_LABEL[job.employment_type][lang]}</span>
            )}
          </p>
        )}

        {skills.length > 0 && (
          <p className="mt-2 text-sm text-ink-light">
            <span className="text-ink-muted">{lang === "ne" ? "जाँचिने सीप: " : "Tests: "}</span>
            {skills.join(", ")}
            {more > 0 && (lang === "ne" ? ` र अरू ${localizeDigits(more, lang)}` : ` and ${more} more`)}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {fit === "preferred" && (
            <span className="badge-moss">
              <Icon name="pin" size={13} />
              {lang === "ne" ? "तपाईंको शहरमा" : "In your city"}
            </span>
          )}
          {job.ai_scoring && <span className="badge-ochre">{t("aiScored", lang)}</span>}
          {job.evidence === "photos" && (
            <span className="badge-muted">
              <Icon name="camera" size={13} />
              {lang === "ne" ? "कामको फोटो माग्छ" : "Asks for work photos"}
            </span>
          )}
          {job.evidence === "video" && (
            <span className="badge-muted">
              <Icon name="video" size={13} />
              {lang === "ne" ? "छनौटपछि भिडियो" : "Video if shortlisted"}
            </span>
          )}
          <span className="text-xs text-ink-muted">
            {lang === "ne" ? `पोस्ट गरिएको ${posted}` : `Posted ${posted}`}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <VerificationBadges badges={job.employer_badges} jobVerified={job.verified} lang={lang} />
          <ReportButton jobId={job.id} about={`${job.title} · ${job.employer_name}`} lang={lang} />
        </div>
      </div>

      <Link href={`/t/${job.id}`} className="btn-primary w-full sm:w-auto">
        {t("apply", lang)}
        <Icon name="arrow-right" size={18} />
      </Link>
    </article>
  );
}
