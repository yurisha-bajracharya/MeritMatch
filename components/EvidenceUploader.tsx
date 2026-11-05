"use client";

import { useRef, useState } from "react";
import Icon from "./Icon";
import type { Lang } from "@/lib/types";

type Item = { id: string; kind: "photo" | "video"; caption?: string };

const T = {
  photosTitle: { en: "Photos of your work", ne: "तपाईंको कामका फोटो" },
  videoTitle: { en: "Short demo video", ne: "छोटो डेमो भिडियो" },
  photosHint: {
    en: "Add up to 4 clear photos of finished work. Only this employer can see them. Location and camera details are removed before upload.",
    ne: "सकिएको कामका ४ वटासम्म स्पष्ट फोटो थप्नुहोस्। यो रोजगारदाताले मात्र हेर्न सक्छन्। अपलोड अघि स्थान र क्यामेराको विवरण हटाइन्छ।",
  },
  videoHint: {
    en: "You are shortlisted, so the employer asks for one video, up to 90 seconds. Show or explain how you would teach or do the work. A person watches it; no AI is used. Only this employer can see it, it is deleted after 30 days, and you can delete it any time.",
    ne: "तपाईं छनौटमा पर्नुभयो, त्यसैले रोजगारदाताले ९० सेकेन्डसम्मको एउटा भिडियो माग्छन्। तपाईंले कसरी पढाउनुहुन्छ वा काम गर्नुहुन्छ देखाउनुहोस् वा बुझाउनुहोस्। मानिसले हेर्छ; AI प्रयोग हुँदैन। यो रोजगारदाताले मात्र हेर्न सक्छन्, ३० दिनमा मेटिन्छ, र तपाईं जुनसुकै बेला मेट्न सक्नुहुन्छ।",
  },
  addPhoto: { en: "Add photo", ne: "फोटो थप्नुहोस्" },
  addVideo: { en: "Choose video", ne: "भिडियो छान्नुहोस्" },
  remove: { en: "Delete", ne: "मेटाउनुहोस्" },
  uploading: { en: "Uploading…", ne: "अपलोड हुँदैछ…" },
  failed: { en: "Upload failed.", ne: "अपलोड भएन।" },
  tooLong: { en: "Video must be 90 seconds or shorter.", ne: "भिडियो ९० सेकेन्ड वा सोभन्दा छोटो हुनुपर्छ।" },
  tooBig: { en: "Video must be under 30 MB.", ne: "भिडियो ३० MB भन्दा सानो हुनुपर्छ।" },
} satisfies Record<string, Record<Lang, string>>;

/**
 * Re-draw the photo onto a canvas and export JPEG at most 1280px wide.
 * This is the main privacy step: re-encoding drops EXIF (GPS location, camera
 * model, time) because a canvas has no metadata. It also makes uploads small
 * enough for slow mobile data. The server strips metadata again as a backstop.
 */
async function toCleanJpeg(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

function videoSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      resolve(Number.isFinite(v.duration) ? v.duration : 0);
    };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(file);
  });
}

export default function EvidenceUploader({
  kind,
  submissionId,
  token,
  items,
  lang,
  onChange,
}: {
  kind: "photos" | "video";
  submissionId: string;
  token: string;
  items: Item[];
  lang: Lang;
  onChange: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isPhoto = kind === "photos";
  const mine = items.filter((i) => i.kind === (isPhoto ? "photo" : "video"));
  const max = isPhoto ? 4 : 1;

  const upload = async (file: File) => {
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("submission_id", submissionId);
      form.set("k", token);
      if (isPhoto) {
        form.set("file", await toCleanJpeg(file), "photo.jpg");
      } else {
        if (file.size > 30 * 1024 * 1024) throw new Error(T.tooBig[lang]);
        const secs = await videoSeconds(file);
        if (secs > 90) throw new Error(T.tooLong[lang]);
        form.set("duration_sec", String(Math.round(secs)));
        form.set("file", file);
      }
      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || T.failed[lang]);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : T.failed[lang]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/media/${id}?k=${encodeURIComponent(token)}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card text-left">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon name={isPhoto ? "camera" : "video"} size={18} className="text-brand" />
        {isPhoto ? T.photosTitle[lang] : T.videoTitle[lang]}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        {isPhoto ? T.photosHint[lang] : T.videoHint[lang]}
      </p>

      {mine.length > 0 && (
        <ul className={`mt-4 grid gap-3 ${isPhoto ? "grid-cols-2" : "grid-cols-1"}`}>
          {mine.map((m) => (
            <li key={m.id} className="relative overflow-hidden rounded-lg border border-rule bg-paper-dark">
              {isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/${m.id}?k=${encodeURIComponent(token)}`}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <video
                  src={`/api/media/${m.id}?k=${encodeURIComponent(token)}`}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                disabled={busy}
                className="btn-secondary btn-sm absolute right-2 top-2 !px-2"
                aria-label={T.remove[lang]}
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {mine.length < max && (
        <>
          <input
            ref={input}
            type="file"
            accept={isPhoto ? "image/*" : "video/mp4,video/webm,video/quicktime"}
            className="sr-only"
            id="evidence-file"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <label
            htmlFor="evidence-file"
            className={`btn-secondary mt-4 inline-flex cursor-pointer items-center gap-2 ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            <Icon name={isPhoto ? "camera" : "upload"} size={16} />
            {busy ? T.uploading[lang] : isPhoto ? T.addPhoto[lang] : T.addVideo[lang]}
          </label>
          {isPhoto && (
            <span className="ml-3 text-xs text-ink-muted">
              {mine.length}/{max}
            </span>
          )}
        </>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-danger-light p-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
