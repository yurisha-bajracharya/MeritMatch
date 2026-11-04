"use client";

import { useEffect, useState } from "react";
import type { Job, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

export default function VerifyList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState("");
  const lang: Lang = "en";

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (jobId: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) throw new Error("Failed");

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, verified, verified_at: verified ? new Date().toISOString() : "" }
            : j,
        ),
      );
    } catch (err) {
      alert("Failed to update. Check your admin key.");
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title">{t("adminVerify", lang)}</h2>
        <div className="mt-4">
          <label className="label">Admin Key</label>
          <input
            type="password"
            className="input max-w-xs"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin key…"
          />
        </div>
      </div>

      <div className="space-y-2 stagger-children">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="card !p-4 flex items-center justify-between"
          >
            <div>
              <h4 className="font-medium text-sm">{job.title}</h4>
              <p className="text-xs text-ink-muted">
                {job.employer_name} · {job.location || "—"} · {job.category}
              </p>
              {job.verified && (
                <span className="badge-moss mt-1 text-[10px]">
                  Verified {job.verified_at && `on ${new Date(job.verified_at).toLocaleDateString()}`}
                </span>
              )}
            </div>
            <button
              onClick={() => toggle(job.id, !job.verified)}
              className={job.verified ? "btn-ghost btn-sm" : "btn-primary btn-sm"}
              disabled={!adminKey}
            >
              {job.verified ? t("revoke", lang) : t("verify", lang)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
