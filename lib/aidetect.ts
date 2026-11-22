import { redact } from "./scoring";
import type { Answer, IntegrityFlag } from "./types";

/**
 * Optional AI-writing check using Sapling's AI detector
 * (https://sapling.ai/ai-detection-apis). Off unless SAPLING_API_KEY is set.
 *
 * It is ONLY a review note for the employer, like the paste and speed notes.
 * It never changes the score or rank, because AI detectors are known to
 * wrongly flag people who write English as a second language (a Stanford
 * study found most TOEFL essays by real people were labelled AI-written).
 * To keep false alarms down:
 *  - Nepali answers are skipped (the detector does not support Nepali)
 *  - short answers are skipped (too little text to judge)
 *  - only a very high score with no "low confidence" warning raises a note
 *  - phone numbers, emails and links are removed first, and Sapling is asked
 *    not to keep the text (zero_retention)
 */
const URL = process.env.AI_DETECT_URL || "https://api.sapling.ai/api/v1/aidetect";
const MIN_CHARS = 300;
const TIMEOUT_MS = 6000;

function threshold(): number {
  const v = Number(process.env.AI_DETECT_THRESHOLD);
  return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.9;
}

/** Share of letters that are Devanagari (Nepali script). */
function devanagariShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 0;
  return letters.filter((c) => /[ऀ-ॿ]/.test(c)).length / letters.length;
}

export async function aiWritingFlag(answers: Answer[], language: string): Promise<IntegrityFlag | null> {
  const key = process.env.SAPLING_API_KEY;
  if (!key) return null;
  if (language === "ne") return null;

  const text = redact(
    answers
      .map((a) => String(a?.text ?? "").trim())
      .filter(Boolean)
      .join("\n\n"),
  );
  if (text.length < MIN_CHARS || devanagariShare(text) > 0.2) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ text, zero_retention: true }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const score = Number(data?.score);
    if (!Number.isFinite(score) || data?.low_confidence) return null;
    if (score < threshold()) return null;
    const pct = Math.round(score * 100);
    return {
      code: "ai",
      note: `An AI detector rated this text ${pct}% likely to be AI-written. Detectors often wrongly flag people writing in a second language, so ask about it rather than reject.`,
      data: { pct },
    };
  } catch (err) {
    // A slow or failed check must never block or fail an application.
    console.error("AI detector skipped:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
