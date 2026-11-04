"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

export default function OutcomePage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [lang, setLang] = useState<Lang>("en");
  const [data, setData] = useState<any>(null);
  const [consent, setConsent] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Get submission and ranking data
    // For now, we'll reconstruct from the jobs listing
    // In a full implementation, we'd have a dedicated endpoint
    fetch("/api/jobs")
      .then((r) => r.json())
      .then(async (jobs) => {
        // Try to find submission in each job's results
        for (const job of jobs) {
          try {
            const res = await fetch(`/api/jobs/${job.id}`);
            const jobData = await res.json();
            // The submission data would come from a dedicated API
            // This is a simplified approach
          } catch {}
        }
      })
      .catch(() => {});
  }, [submissionId]);

  const toggleConsent = async () => {
    setToggling(true);
    try {
      await fetch(`/api/submissions/${submissionId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: !consent }),
      });
      setConsent(!consent);
    } catch {} finally {
      setToggling(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-lg mx-auto">
        <div className="card animate-fade-in text-center">
          <h1 className="section-title">{t("outcomeTitle", lang)}</h1>
          <p className="text-sm text-ink-muted mt-2">
            Submission #{submissionId.slice(0, 4).toUpperCase()}
          </p>

          {/* Consent toggle */}
          <div className="mt-8 p-4 rounded-lg bg-paper-dark text-left">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={toggleConsent}
                disabled={toggling}
                className="mt-1 w-4 h-4 rounded border-rule text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium">
                  {t("consentLabel", lang)}
                </span>
                <p className="text-xs text-ink-muted mt-0.5">
                  {consent ? t("consentGranted", lang) : t("consentHint", lang)}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
