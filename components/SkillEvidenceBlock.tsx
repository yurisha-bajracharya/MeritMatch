"use client";

import { useState } from "react";
import Icon from "./Icon";
import { cleanForUpload } from "@/lib/clean-upload";
import { SKILL_PROMPTS } from "@/lib/skill-prompts";
import { EVIDENCE_STATUS, type EvidenceStatus } from "@/lib/evidence-labels";
import { TAG_LABELS } from "@/lib/tags";
import type { Lang } from "@/lib/types";

export type SkillPhoto = { id: string; tag: string; caption: string; status: EvidenceStatus; ai_note: string; review_note: string };

const MAX = 3;

/**
 * One skill: the follow-up question, the photos already added (with their
 * check status), and a simple phone-friendly upload.
 */
export default function SkillEvidenceBlock({
  tag,
  lang,
  photos,
  onChange,
}: {
  tag: string;
  lang: Lang;
  photos: SkillPhoto[];
  onChange: () => void;
}) {
  const ne = lang === "ne";
  const prompt = SKILL_PROMPTS[tag] ?? {
    question: {
      en: `Can you show a photo of your ${TAG_LABELS[tag]?.en.toLowerCase() ?? tag} work?`,
      ne: `${TAG_LABELS[tag]?.ne ?? tag} कामको फोटो देखाउन सक्नुहुन्छ?`,
    },
    hint: { en: "A photo of the work itself is best.", ne: "कामकै फोटो सबैभन्दा राम्रो।" },
  };
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [key, setKey] = useState(0);
  const active = photos.filter((p) => p.status !== "rejected");
  const inputId = `ev-${tag}-${key}`;

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("tag", tag);
      fd.set("caption", caption);
      fd.set("file", await cleanForUpload(file), "photo.jpg");
      const r = await fetch("/api/skill-evidence", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) {
        const msg: Record<number, [string, string]> = {
          401: ["Log in first to add photos.", "फोटो थप्न पहिले लगइन गर्नुहोस्।"],
          409: [`Up to ${MAX} photos per skill.`, `एउटा सीपमा बढीमा ${MAX} फोटो।`],
          413: ["The photo must be under 5 MB.", "फोटो ५ MB भन्दा सानो हुनुपर्छ।"],
          415: ["Use a photo (JPG or PNG).", "फोटो (JPG वा PNG) प्रयोग गर्नुहोस्।"],
        };
        const m = msg[r.status];
        throw new Error(m ? m[ne ? 1 : 0] : d.error || (ne ? "फोटो थप्न सकिएन।" : "Could not add the photo."));
      }
      setFile(null);
      setCaption("");
      setKey((k) => k + 1);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/skill-evidence?id=${id}`, { method: "DELETE" });
    onChange();
  };

  return (
    <div className="rounded-lg border border-rule p-4">
      <p className="text-base font-semibold text-ink">{TAG_LABELS[tag]?.[lang] ?? tag}</p>
      <p className="mt-1 text-base text-ink-light">{prompt.question[lang]}</p>
      <p className="mt-1 text-sm text-ink-muted">{prompt.hint[lang]}</p>

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/skill-evidence/file/${p.id}`} alt={p.caption || TAG_LABELS[tag]?.[lang] || tag} className="aspect-square w-full rounded-md border border-rule object-cover" />
              <span className={`${EVIDENCE_STATUS[p.status].cls} mt-1.5 !whitespace-normal`}>{EVIDENCE_STATUS[p.status].label[lang]}</span>
              {p.status === "rejected" && p.review_note && <p className="mt-1 text-xs text-ink-light">{p.review_note}</p>}
              <button type="button" onClick={() => remove(p.id)} className="mt-1 block text-xs text-ink-muted underline-offset-2 hover:text-danger hover:underline">
                {ne ? "हटाउनुहोस्" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {active.length < MAX && (
        <div className="mt-3 space-y-2">
          <label htmlFor={inputId} className="btn-secondary btn-sm w-full cursor-pointer sm:w-auto">
            <Icon name="camera" size={16} />
            {file ? (ne ? "अर्को फोटो छान्नुहोस्" : "Choose another photo") : ne ? "फोटो खिच्नुहोस् वा छान्नुहोस्" : "Take or choose a photo"}
          </label>
          <input
            key={key}
            id={inputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <>
              <p className="truncate text-sm text-ink-light">{file.name}</p>
              <label className="sr-only" htmlFor={`${inputId}-cap`}>{ne ? "छोटो विवरण" : "Short caption"}</label>
              <input
                id={`${inputId}-cap`}
                className="input"
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={ne ? "यो के हो? (ऐच्छिक)" : "What is this? (optional)"}
              />
              <button type="button" className="btn-primary btn-sm w-full sm:w-auto" disabled={busy} onClick={upload}>
                {busy ? (ne ? "जाँच्दै…" : "Checking…") : ne ? "फोटो थप्नुहोस्" : "Add photo"}
              </button>
            </>
          )}
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
