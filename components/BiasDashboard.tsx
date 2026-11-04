"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

type BiasStats = {
  applicants: number;
  shortlisted: number;
  pool: { women: number; rural: number };
  merit: { women: number; rural: number };
  resume: { women: number; rural: number };
};

function Bar({
  label,
  merit,
  resume,
  lang,
}: {
  label: string;
  merit: number;
  resume: number;
  lang: Lang;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-brand" />
            {t("meritBased", lang)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-ink-muted/30" />
            {t("resumeBased", lang)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-6 rounded bg-paper-dark overflow-hidden relative">
          <div
            className="h-full rounded bg-brand transition-all duration-1000 ease-out flex items-center px-2"
            style={{ width: animate ? `${merit}%` : "0%" }}
          >
            <span className="text-[10px] font-bold text-paper whitespace-nowrap">
              {merit}%
            </span>
          </div>
        </div>
        <div className="h-6 rounded bg-paper-dark overflow-hidden relative">
          <div
            className="h-full rounded bg-ink-muted/30 transition-all duration-1000 ease-out flex items-center px-2"
            style={{ width: animate ? `${resume}%` : "0%" }}
          >
            <span className="text-[10px] font-bold text-ink-light whitespace-nowrap">
              {resume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BiasDashboard({
  jobId,
  lang = "en",
}: {
  jobId: string;
  lang?: Lang;
}) {
  const [stats, setStats] = useState<BiasStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/jobs/${jobId}/verify`)
      .catch(() => null);

    // Bias data comes from server-side rendering or an API
    // For now we compute it client-side via a simple endpoint
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then(() => {
        // Use the bias data from the server component
        // This is a simplified version
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  // In the real implementation, bias stats come from the server component
  // This is a client-side display component
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="space-y-3">
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <div>
        <h3 className="section-title">{t("biasTitle", lang)}</h3>
        <p className="section-sub text-sm">{t("biasSub", lang)}</p>
      </div>
    </div>
  );
}

/** Server-side rendered version with pre-computed stats */
export function BiasDashboardWithStats({
  stats,
  lang = "en",
}: {
  stats: BiasStats;
  lang?: Lang;
}) {
  return (
    <div className="card space-y-6 animate-fade-in">
      <div>
        <h3 className="section-title">{t("biasTitle", lang)}</h3>
        <p className="section-sub text-sm">{t("biasSub", lang)}</p>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between p-2 rounded bg-paper-dark">
          <span className="text-ink-light">Total applicants</span>
          <span className="font-semibold">{stats.applicants}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-paper-dark">
          <span className="text-ink-light">Shortlisted</span>
          <span className="font-semibold">{stats.shortlisted}</span>
        </div>
      </div>

      <div className="space-y-5">
        <Bar
          label={t("women", lang)}
          merit={stats.merit.women}
          resume={stats.resume.women}
          lang={lang}
        />
        <Bar
          label={t("ruralCandidates", lang)}
          merit={stats.merit.rural}
          resume={stats.resume.rural}
          lang={lang}
        />
      </div>

      <div className="text-xs text-ink-muted">
        <p>
          <strong>{t("poolShare", lang)}:</strong> Women {stats.pool.women}%, Rural {stats.pool.rural}%
        </p>
      </div>
    </div>
  );
}
