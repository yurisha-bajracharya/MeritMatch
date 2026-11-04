import type { Answer, IntegrityFlag, InputMode } from "./types";

/**
 * Integrity signals for work-sample answers.
 *
 * Principle: these only ever ADD a note for the employer. They never change
 * a score, never hide anyone, never auto-reject. Each one has an innocent
 * explanation (a shared phone, a fast typist, a patchy connection), so the
 * wording says what was observed and leaves the judgement to a human.
 *
 * Be honest about the limits: the behavioural signals come from the browser,
 * so a technical cheater can spoof them. They catch the casual cases, which
 * is most of them, and they are a reason to ask a follow-up question,
 * not a verdict.
 */

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Words, Unicode-aware. \p{M} matters: Devanagari vowel signs (matras) are
 * combining marks, not letters, so [\p{L}\p{N}]+ would chop every Nepali
 * word into fragments.
 */
function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
}

function shingles(text: string, n = 3): Set<string> {
  const w = words(text);
  if (w.length === 0) return new Set();
  if (w.length < n) return new Set([w.join(" ")]);
  const out = new Set<string>();
  for (let i = 0; i <= w.length - n; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared);
}

const joinAnswers = (answers: Answer[]) =>
  answers.map((a) => a.text ?? "").join(" ");

/* ------------------------------------------------------------------ */
/* 1. Behavioural signals, computed once when the answer is submitted  */
/* ------------------------------------------------------------------ */

const num = (v: unknown, max: number): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : undefined;
};

export function behaviourFlags(input: {
  answers: Answer[];
  inputMode: InputMode;
  durationMin: number;
  elapsedSec?: unknown;
  pasteChars?: unknown;
}): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  const text = joinAnswers(input.answers);
  const totalChars = text.trim().length;
  const wordCount = words(text).length;
  const elapsed = num(input.elapsedSec, 24 * 3600);
  const pasted = num(input.pasteChars, 1_000_000) ?? 0;

  // Mostly pasted in from somewhere else.
  if (
    input.inputMode === "text" &&
    totalChars > 0 &&
    pasted >= 40 &&
    pasted / totalChars >= 0.6
  ) {
    flags.push({
      code: "pasted",
      note: `About ${Math.round((pasted / totalChars) * 100)}% of the text was pasted in rather than typed.`,
    });
  }

  if (elapsed !== undefined && elapsed > 0) {
    // Typed faster than a person can read the question, think and type.
    // Voice is skipped: people speak at ~150 wpm, so it would always trip.
    if (input.inputMode === "text" && wordCount >= 60) {
      const wpm = wordCount / (elapsed / 60);
      if (wpm > 90) {
        flags.push({
          code: "fast",
          note: `${wordCount} words in ${Math.max(1, Math.round(elapsed / 60))} min (~${Math.round(wpm)} words/min), faster than usual typing plus thinking.`,
        });
      }
    }

    // Submitted well after the timer ended (60s grace for slow connections).
    const limit = input.durationMin * 60;
    if (elapsed > limit + 60) {
      flags.push({
        code: "late",
        note: `Submitted ${Math.round((elapsed - limit) / 60)} min after the ${input.durationMin}-minute timer ended.`,
      });
    }
  }

  return flags;
}

/* ------------------------------------------------------------------ */
/* 2. Similarity, computed when the employer opens the ranking         */
/*    (read time, so it is symmetric: BOTH copies are flagged, not     */
/*    only whichever happened to be submitted second)                  */
/* ------------------------------------------------------------------ */

const MIN_WORDS_FOR_SIMILARITY = 20;
const SIMILARITY_THRESHOLD = 0.45; // 3-word shingles; independent answers sit near 0.05

const labelOf = (id: string) => `#${id.slice(0, 4).toUpperCase()}`;

export function findSimilar(
  subs: { id: string; answers: Answer[] }[],
): Map<string, IntegrityFlag[]> {
  const prepared = subs
    .map((s) => {
      const text = joinAnswers(s.answers);
      return {
        id: s.id,
        wordCount: words(text).length,
        grams: shingles(text),
      };
    })
    .filter((s) => s.wordCount >= MIN_WORDS_FOR_SIMILARITY);

  const out = new Map<string, IntegrityFlag[]>();
  const add = (id: string, flag: IntegrityFlag) => {
    const list = out.get(id) ?? [];
    list.push(flag);
    out.set(id, list);
  };

  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const sim = jaccard(prepared[i].grams, prepared[j].grams);
      if (sim < SIMILARITY_THRESHOLD) continue;
      const pct = Math.round(sim * 100);
      add(prepared[i].id, {
        code: "similar",
        note: `${pct}% of its wording matches ${labelOf(prepared[j].id)}.`,
      });
      add(prepared[j].id, {
        code: "similar",
        note: `${pct}% of its wording matches ${labelOf(prepared[i].id)}.`,
      });
    }
  }
  return out;
}
