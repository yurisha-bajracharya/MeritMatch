"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";

export default function VerifyList() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs))
      .catch(() => setError("Could not load jobs."));
  }, []);

  async function setVerified(job: Job, verified: boolean) {
    setBusy(job.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ verified }),
      });
      if (res.status === 401) throw new Error("Wrong or missing admin key.");
      if (!res.ok) throw new Error("Could not update.");
      const { job: updated } = await res.json();
      setJobs(
        (list) => list?.map((j) => (j.id === updated.id ? updated : j)) ?? null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main>
      <header className="py-5">
        <Link href="/" className="font-semibold text-brand">
          MeritMatch
        </Link>
      </header>
      <section className="border-t border-rule pt-8">
        <h1 className="font-display text-3xl text-brand">Verify employers</h1>
        <p className="mt-3">
          Check the business is real before approving. The stamp then shows on
          the job&apos;s task page and shortlist.
        </p>
        <div className="mt-6">
          <label htmlFor="key" className="block text-sm font-medium mb-2">
            Admin key
          </label>
          <input
            id="key"
            type="password"
            className="field"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
          <p className="mt-2 text-sm">
            Leave empty when running locally without an ADMIN_KEY.
          </p>
        </div>
        {error && (
          <p role="alert" className="border-l-4 border-ink pl-3 mt-4">
            {error}
          </p>
        )}
      </section>

      <section className="mt-8">
        {jobs === null && !error && <p className="ledger-row">Loading…</p>}
        {jobs?.length === 0 && (
          <p className="ledger-row">No jobs posted yet.</p>
        )}
        {jobs?.map((j) => (
          <div
            key={j.id}
            className="ledger-row flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-semibold">{j.employer}</p>
              <p className="text-sm">
                {j.title}
                {j.location ? `, ${j.location}` : ""}
              </p>
              <p
                className={`text-sm font-medium ${j.verified ? "text-moss" : "text-ink/75"}`}
              >
                {j.verified ? "Verified" : "Not verified"}
              </p>
            </div>
            <button
              type="button"
              className={`btn shrink-0 ${j.verified ? "btn-quiet" : "btn-primary"}`}
              disabled={busy === j.id}
              onClick={() => setVerified(j, !j.verified)}
            >
              {j.verified ? "Revoke" : "Approve"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
