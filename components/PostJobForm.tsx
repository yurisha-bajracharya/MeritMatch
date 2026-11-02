"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicTemplate } from "@/lib/templates";
import type { Category, Job } from "@/lib/types";

export default function PostJobForm({
  templates,
}: {
  templates: PublicTemplate[];
}) {
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("retail");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = templates.find((t) => t.category === category)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !employer.trim()) {
      setError("Job title and business name are required.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, employer, location, category }),
      });
      if (!res.ok) throw new Error();
      setJob((await res.json()).job);
    } catch {
      setError("Could not post the job. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (job) {
    const link = `${window.location.origin}/t/${job.id}`;
    return (
      <main>
        <header className="py-5">
          <Link href="/" className="font-semibold text-brand">
            MeritMatch
          </Link>
        </header>
        <section className="border-t border-rule pt-8">
          <h1 className="font-display text-3xl text-brand">
            Task ready for {job.title}
          </h1>
          <p className="mt-3">
            Send this link to candidates by SMS, Viber or WhatsApp. They can
            open it on any phone.
          </p>
          <p className="mt-3 border-l-4 border-ochre pl-3 text-sm">
            MeritMatch will review your business. Once approved, a verified
            stamp appears on this task for candidates.
          </p>
        </section>
        <section className="border-t border-rule mt-8 pt-6 space-y-4">
          <p className="field break-all select-all">{link}</p>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
          <Link
            href={`/employer/jobs/${job.id}`}
            className="btn btn-quiet w-full"
          >
            View shortlist
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="py-5">
        <Link href="/" className="font-semibold text-brand">
          MeritMatch
        </Link>
      </header>
      <form onSubmit={submit} noValidate>
        <section className="border-t border-rule pt-8">
          <h1 className="font-display text-3xl text-brand">Post a job</h1>
          <p className="mt-3">
            Pick a job type. We prepare a 15 minute task for it, and score every
            answer the same way.
          </p>
        </section>

        <section className="border-t border-rule mt-8 pt-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Job title
            </label>
            <input
              id="title"
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label
              htmlFor="employer"
              className="block text-sm font-medium mb-2"
            >
              Business name
            </label>
            <input
              id="employer"
              className="field"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-2"
            >
              Location
            </label>
            <input
              id="location"
              className="field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={80}
            />
          </div>
        </section>

        <section className="border-t border-rule mt-8 pt-6">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Job type</legend>
            {templates.map((t) => (
              <label
                key={t.category}
                className={`ledger-row flex items-center gap-3 min-h-12 cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ochre ${
                  category === t.category ? "font-semibold text-brand" : ""
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={t.category}
                  checked={category === t.category}
                  onChange={() => setCategory(t.category)}
                  className="size-5 accent-brand"
                />
                {t.name.en}
              </label>
            ))}
          </fieldset>
        </section>

        <section className="border-t border-rule mt-2 pt-6">
          <h2 className="font-semibold">The task candidates will answer</h2>
          <ol className="mt-3">
            {selected.scenarios.map((s, i) => (
              <li key={s.id} className="ledger-row flex gap-3">
                <span className="font-semibold text-brand w-6 shrink-0">
                  {i + 1}
                </span>
                <span className="whitespace-pre-line text-sm">
                  {s.prompt.en}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {error && (
          <p role="alert" className="border-l-4 border-ink pl-3 mt-4">
            {error}
          </p>
        )}

        <div className="border-t border-rule mt-4 pt-6">
          <button
            type="submit"
            className="btn btn-proof w-full"
            disabled={sending}
          >
            {sending ? "Posting…" : "Post job and get link"}
          </button>
        </div>
      </form>
    </main>
  );
}
