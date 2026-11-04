"use client";

import Link from "next/link";
import type { Job, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";

const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  retail: { en: "Retail / Shop", ne: "पसल / रिटेल" },
  admin: { en: "Office / Admin", ne: "कार्यालय / प्रशासन" },
  office: { en: "Data / Clerical", ne: "डेटा / क्लेरिकल" },
  hospitality: { en: "Hotel / Restaurant", ne: "होटल / रेस्टुरेन्ट" },
  teaching: { en: "Teaching / Tutoring", ne: "शिक्षण / ट्युसन" },
  driving: { en: "Driving / Delivery", ne: "ड्राइभिङ / डेलिभरी" },
  construction: { en: "Construction / Labour", ne: "निर्माण / श्रम" },
  "it-support": { en: "IT / Tech Support", ne: "आईटी / टेक सपोर्ट" },
};

export default function JobCard({
  job,
  lang,
  highlight,
}: {
  job: Job;
  lang: Lang;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-hover ${highlight ? "ring-2 ring-brand" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate">{job.title}</h3>
          <p className="text-sm text-ink-light mt-0.5">
            {job.employer_name}
            {job.location && <span className="text-ink-muted"> · {job.location}</span>}
          </p>
        </div>
        {job.verified && (
          <span className="badge-moss shrink-0">
            {t("verified", lang)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="badge-brand">
          {CATEGORY_LABELS[job.category]?.[lang] ?? job.category}
        </span>
        {job.ai_scoring && (
          <span className="badge-ochre">{t("aiScored", lang)}</span>
        )}
        <span className="badge-muted">
          {t("minuteTask", lang, { min: String(job.duration_min) })}
        </span>
      </div>

      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs text-ink-muted bg-paper-dark rounded px-1.5 py-0.5">
              {TAG_LABELS[tag]?.[lang] ?? tag}
            </span>
          ))}
          {job.tags.length > 5 && (
            <span className="text-xs text-ink-muted">+{job.tags.length - 5}</span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/t/${job.id}`}
          className="btn-primary btn-sm"
        >
          {t("apply", lang)}
        </Link>
        <span className="text-xs text-ink-muted">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
