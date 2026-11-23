"use client";

import { useCallback, useEffect, useState } from "react";
import SkillEvidenceBlock, { type SkillPhoto } from "./SkillEvidenceBlock";
import { EVIDENCE_DISCLAIMER } from "@/lib/evidence-labels";
import { localizeDigits } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Profile section: photos backing up each described skill. */
export default function MyWorkPhotos({ tags, lang }: { tags: string[]; lang: Lang }) {
  const ne = lang === "ne";
  const [photos, setPhotos] = useState<SkillPhoto[]>([]);
  const load = useCallback(() => {
    fetch("/api/skill-evidence")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const all = [...new Set([...tags, ...photos.map((p) => p.tag)])];
  if (all.length === 0) return null;
  const shown = photos.filter((p) => p.status !== "rejected").length;
  const waiting = photos.filter((p) => p.status === "needs_review").length;

  return (
    <details className="mt-4 rounded-lg border border-rule p-5" open={photos.length > 0}>
      <summary className="cursor-pointer text-base font-semibold text-ink">
        {ne ? "कामका फोटो" : "Photos of your work"}
        <span className="ml-2 text-sm font-normal text-ink-muted">
          {localizeDigits(String(shown), lang)} {ne ? "वटा" : shown === 1 ? "photo" : "photos"}
          {waiting > 0 && ` · ${localizeDigits(String(waiting), lang)} ${ne ? "जाँच्न बाँकी" : "waiting for review"}`}
        </span>
      </summary>
      <p className="mt-2 text-sm text-ink-light">
        {ne
          ? "तपाईंले आवेदन दिएका रोजगारदाताले यी फोटो देख्छन्। स्वीकार नभएका फोटो देखिँदैनन्।"
          : "Employers you apply to can see these photos. Photos that were not accepted are hidden."}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{EVIDENCE_DISCLAIMER[lang]}</p>
      <div className="mt-4 space-y-4">
        {all.map((tg) => (
          <SkillEvidenceBlock key={tg} tag={tg} lang={lang} photos={photos.filter((p) => p.tag === tg)} onChange={load} />
        ))}
      </div>
    </details>
  );
}
