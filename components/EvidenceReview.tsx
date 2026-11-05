"use client";

import { useState } from "react";
import Icon from "./Icon";

type Media = { id: string; kind: "photo" | "video"; caption: string };
type Review = { scores: Record<string, number>; note: string } | undefined;

const RUBRIC = {
  photo: [
    { key: "finish", label: "Finish and neatness" },
    { key: "technique", label: "Technique" },
    { key: "fit", label: "Fit to the brief" },
  ],
  video: [
    { key: "clarity", label: "Clarity" },
    { key: "engagement", label: "Engagement" },
    { key: "structure", label: "Structure" },
  ],
} as const;

/**
 * Employer-side view of a candidate's photos or video, with a 1-5 rating.
 * The rating is a human judgement, stored separately, and never changes the
 * candidate's rank. Files load through /api/media, which only serves them to
 * the employer who owns the job.
 */
export default function EvidenceReview({
  submissionId,
  media,
  reviews,
}: {
  submissionId: string;
  media: Media[];
  reviews: { photo?: Review; video?: Review };
}) {
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");
  if (media.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {photos.length > 0 && (
        <Block kind="photo" submissionId={submissionId} review={reviews.photo}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photos.map((m) => (
              <a key={m.id} href={`/api/media/${m.id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${m.id}`}
                  alt="Candidate work sample"
                  className="aspect-square w-full rounded-lg border border-rule object-cover"
                />
              </a>
            ))}
          </div>
        </Block>
      )}
      {videos.length > 0 && (
        <Block kind="video" submissionId={submissionId} review={reviews.video}>
          {videos.map((m) => (
            <video key={m.id} src={`/api/media/${m.id}`} controls preload="metadata" className="w-full rounded-lg" />
          ))}
        </Block>
      )}
    </div>
  );
}

function Block({
  kind,
  submissionId,
  review,
  children,
}: {
  kind: "photo" | "video";
  submissionId: string;
  review: Review;
  children: React.ReactNode;
}) {
  const [scores, setScores] = useState<Record<string, number>>(review?.scores ?? {});
  const [saved, setSaved] = useState(Boolean(review));
  const [error, setError] = useState("");
  const complete = RUBRIC[kind].every((r) => scores[r.key]);

  const save = async () => {
    setError("");
    const res = await fetch("/api/evidence-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId, kind, scores }),
    });
    if (res.ok) setSaved(true);
    else setError("Could not save. Are you logged in as this job's employer?");
  };

  return (
    <div className="rounded-lg border border-rule p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-light">
        <Icon name={kind === "photo" ? "camera" : "video"} size={14} />
        {kind === "photo" ? "Photos of work" : "Demo video"}
        <span className="badge-brand ml-1 text-[10px]">Human review</span>
      </p>
      {children}
      <div className="mt-3 space-y-1.5">
        {RUBRIC[kind].map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-light">{r.label}</span>
            <span className="flex gap-1" role="radiogroup" aria-label={r.label}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={scores[r.key] === n}
                  onClick={() => {
                    setSaved(false);
                    setScores((p) => ({ ...p, [r.key]: n }));
                  }}
                  className={`h-7 w-7 rounded-md border text-xs font-semibold ${
                    scores[r.key] === n
                      ? "border-brand bg-brand-light text-brand"
                      : "border-rule text-ink-muted hover:border-brand/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={!complete || saved} className="btn-secondary btn-sm">
          {saved ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={13} strokeWidth={2.5} /> Saved
            </span>
          ) : (
            "Save rating"
          )}
        </button>
        <span className="text-[11px] text-ink-muted">Not part of the score or rank.</span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
