import { getMcq } from "./mcq-bank";
import type { Category, McqResult } from "./types";

/**
 * Why every task has BOTH choice questions and written answers.
 *
 * Choice only: fast and perfectly consistent, but there are only a handful of
 * possible scores, so many applicants tie and an employer can't tell them
 * apart. It also can't show how someone actually communicates.
 *
 * Written only: shows real thinking, but is the part an AI or a helper can
 * fake, and is the slower, less consistent thing to score.
 *
 * Together: the choice questions are a cheap, objective, tamper-proof
 * screen for judgement (no AI involved, scored against a key); the written
 * answers do the separating. So written carries most of the weight, and
 * ties are broken by the written score, never the choice score.
 */
export const MCQ_WEIGHT = 0.3;

export type McqScore = McqResult & { score: number };

/**
 * Score submitted choices against the key. Unanswered or invalid counts as
 * wrong. `given` is untrusted browser input, so every field is validated.
 */
export function scoreMcq(category: Category, given: unknown): McqScore {
  const bank = getMcq(category);
  const list = Array.isArray(given) ? given : [];
  const byId = new Map<string, number>();
  for (const g of list) {
    const id = String((g as { id?: unknown })?.id ?? "");
    const choice = Number((g as { choice?: unknown })?.choice);
    if (id && Number.isInteger(choice)) byId.set(id, choice);
  }

  const answers = bank.map((q) => ({ id: q.id, choice: byId.get(q.id) ?? -1 }));
  const correct = bank.reduce(
    (n, q, i) => n + (answers[i].choice === q.correct ? 1 : 0),
    0,
  );
  const total = bank.length;
  return {
    answers,
    correct,
    total,
    score: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

/** Blend into the one number the ranking uses. Null mcq = legacy submission. */
export function combineScores(written: number, mcq: number | null): number {
  if (mcq === null) return written;
  return Math.round(MCQ_WEIGHT * mcq + (1 - MCQ_WEIGHT) * written);
}
