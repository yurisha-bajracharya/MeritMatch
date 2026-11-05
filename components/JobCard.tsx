"use client";

import Link from "next/link";
import Icon from "./Icon";
import type { LocationFit } from "@/lib/places";
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
  tailoring: { en: "Tailoring / Crafts", ne: "सिलाइ / हस्तकला" },
};

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
  return (
    <div
      className={`card-hover ${highlight ? "ring-2 ring-brand" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate">{job.title}</h3>
          <p className="text-sm text-ink-light mt-0.5 flex items-center gap-1 flex-wrap">
            <span>{job.employer_name}</span>
            {job.location && (
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <Icon name="pin" size={13} />
                {job.location}
              </span>
            )}
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
        {fit === "preferred" && (
          <span className="badge-moss inline-flex items-center gap-1">
            <Icon name="pin" size={11} />
            {lang === "ne" ? "तपाईंको शहरमा" : "In your city"}
          </span>
        )}
        {job.ai_scoring && (
          <span className="badge-ochre">{t("aiScored", lang)}</span>
        )}
        {job.evidence === "photos" && (
          <span className="badge-muted inline-flex items-center gap-1">
            <Icon name="camera" size={11} />
            {lang === "ne" ? "फोटो" : "Photos"}
          </span>
        )}
        {job.evidence === "video" && (
          <span className="badge-muted inline-flex items-center gap-1">
            <Icon name="video" size={11} />
            {lang === "ne" ? "भिडियो" : "Video"}
          </span>
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
