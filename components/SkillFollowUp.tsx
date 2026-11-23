"use client";

import { TAG_LABELS } from "@/lib/tags";
import { ACTIVITIES, TOOLS, WHERE, YEARS, frameSkill, hasDetail, type SkillDetail, type Where, type Years } from "@/lib/skill-details";
import type { Lang } from "@/lib/types";

/** Tappable chip used for single and multi choice. */
function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        on ? "border-brand bg-brand-light font-medium text-brand-ink" : "border-rule bg-white text-ink-light hover:border-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}

const Q = {
  years: { en: "How long did you do this?", ne: "कति समय गर्नुभयो?" },
  where: { en: "Where?", ne: "कहाँ?" },
  did: { en: "What exactly did you do? Pick all that apply.", ne: "ठ्याक्कै के के गर्नुभयो? मिल्ने सबै छान्नुहोस्।" },
  tools: { en: "What did you use?", ne: "के प्रयोग गर्नुभयो?" },
  preview: { en: "How employers will read it", ne: "रोजगारदाताले यसरी पढ्छन्" },
};

/**
 * Follow-up questions for one skill. Turns "I know accounting" into
 * "Recorded daily sales, kept the credit list. 1 to 3 years, family business."
 */
export default function SkillFollowUp({
  tag,
  lang,
  value,
  onChange,
  open,
}: {
  tag: string;
  lang: Lang;
  value: SkillDetail;
  onChange: (v: SkillDetail) => void;
  open?: boolean;
}) {
  const acts = ACTIVITIES[tag];
  if (!acts) return null;
  const toggle = (list: string[], k: string) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
  const done = hasDetail(value);

  return (
    <details className="group rounded-lg border border-rule bg-white" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="text-base font-semibold text-ink">{TAG_LABELS[tag]?.[lang] ?? tag}</span>
        <span className={done ? "badge-moss" : "badge-muted"}>{done ? (lang === "ne" ? "भरियो" : "Added") : lang === "ne" ? "बाँकी" : "To do"}</span>
      </summary>
      <div className="space-y-4 border-t border-rule p-4">
        <fieldset>
          <legend className="text-sm font-semibold text-ink">{Q.years[lang]}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(YEARS) as Years[]).map((k) => (
              <Chip key={k} on={value.years === k} onClick={() => onChange({ ...value, years: value.years === k ? undefined : k })}>
                {YEARS[k][lang]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">{Q.where[lang]}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(WHERE) as Where[]).map((k) => (
              <Chip key={k} on={value.where === k} onClick={() => onChange({ ...value, where: value.where === k ? undefined : k })}>
                {WHERE[k][lang]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">{Q.did[lang]}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(acts).map(([k, label]) => (
              <Chip key={k} on={value.did.includes(k)} onClick={() => onChange({ ...value, did: toggle(value.did, k) })}>
                {label[lang]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">{Q.tools[lang]}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(TOOLS).map(([k, label]) => (
              <Chip key={k} on={value.tools.includes(k)} onClick={() => onChange({ ...value, tools: toggle(value.tools, k) })}>
                {label[lang]}
              </Chip>
            ))}
          </div>
        </fieldset>
        {done && (
          <div className="rounded-md bg-paper-dark p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{Q.preview[lang]}</p>
            <p className="mt-1 text-base text-ink">{frameSkill(value, lang)}</p>
          </div>
        )}
      </div>
    </details>
  );
}
