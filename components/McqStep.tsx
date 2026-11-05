"use client";

import { useMemo } from "react";
import Icon from "./Icon";
import { localizeDigits } from "@/lib/i18n";
import type { Lang, PublicMcq } from "@/lib/types";

/** Small deterministic PRNG so a question's option order is stable per seed. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Options are shuffled per candidate so "the answer is always C" can't be
 * passed around. What is stored is the ORIGINAL option index, so the server's
 * answer key works however the options were displayed.
 */
export function shuffledOrder(count: number, seed: string): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const rand = mulberry32(hash(seed));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function McqStep({
  questions,
  lang,
  picked,
  onPick,
  seed,
  onDone,
}: {
  questions: PublicMcq[];
  lang: Lang;
  /** question id -> chosen ORIGINAL option index (as a string) */
  picked: Record<string, string>;
  onPick: (id: string, optionIndex: number) => void;
  seed: string;
  onDone: () => void;
}) {
  const orders = useMemo(
    () =>
      Object.fromEntries(
        questions.map((q) => [q.id, shuffledOrder(q.options.length, `${seed}:${q.id}`)]),
      ),
    [questions, seed],
  );
  const answered = questions.filter((q) => picked[q.id] !== undefined).length;
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card !p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-light">
          {lang === "ne" ? "छनोट प्रश्न" : "Choice questions"}
        </span>
        <span className="text-xs text-ink-muted">
          {localizeDigits(answered, lang)}/{localizeDigits(questions.length, lang)}{" "}
          {lang === "ne" ? "उत्तर दिइयो" : "answered"}
        </span>
      </div>

      {questions.map((q, qi) => (
        <fieldset key={q.id} className="card">
          <legend className="sr-only">{q.prompt[lang]}</legend>
          <p className="text-sm font-medium text-ink leading-relaxed">
            <span className="text-ink-muted">{localizeDigits(qi + 1, lang)}. </span>
            {q.prompt[lang] || q.prompt.en}
          </p>
          <div className="mt-3 space-y-2" role="radiogroup">
            {orders[q.id].map((original, shown) => {
              const selected = picked[q.id] === String(original);
              return (
                <button
                  key={original}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onPick(q.id, original)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? "border-brand bg-brand-light text-ink"
                      : "border-rule bg-paper-dark/40 text-ink-light hover:border-brand/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                      selected ? "border-brand bg-brand text-paper" : "border-rule"
                    }`}
                  >
                    {selected ? <Icon name="check" size={12} strokeWidth={3} /> : letters[shown]}
                  </span>
                  <span>{q.options[original][lang] || q.options[original].en}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex justify-end">
        <button onClick={onDone} className="btn-primary" disabled={answered < questions.length}>
          {lang === "ne" ? "लिखित प्रश्नतर्फ" : "Continue to written questions"}
        </button>
      </div>
      {answered < questions.length && (
        <p className="text-right text-xs text-ink-muted">
          {lang === "ne" ? "सबै प्रश्नको उत्तर दिएपछि अगाडि बढ्न सकिन्छ।" : "Answer every question to continue."}
        </p>
      )}
    </div>
  );
}
