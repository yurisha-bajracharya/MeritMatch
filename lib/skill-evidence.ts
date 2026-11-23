import { getDb } from "./db";
import { askVision } from "./scoring";
import { readPrivateFile } from "./verification";
import { TAG_LABELS } from "./tags";
import type { Bilingual } from "./types";
import { SKILL_PROMPTS } from "./skill-prompts";

/**
 * Photos that back up a skill from the Experience Mapper.
 *
 * The AI check answers ONE narrow question: "does this photo look like
 * evidence of <skill>?" It cannot tell who took the photo or whether this
 * person did the work, and the labels say so. If the AI is unsure, or no AI
 * key is set, the photo waits for a person at MeritMatch to review it.
 */

import type { EvidenceStatus } from "./evidence-labels";
export type { EvidenceStatus };
export const MAX_PER_SKILL = 3;

export function promptFor(tag: string): { question: Bilingual; hint: Bilingual } {
  return (
    SKILL_PROMPTS[tag] ?? {
      question: {
        en: `You said you have ${TAG_LABELS[tag]?.en.toLowerCase() ?? tag} skills. Can you show a photo of this work?`,
        ne: `तपाईंले ${TAG_LABELS[tag]?.ne ?? tag} सीप भएको भन्नुभयो। यो कामको फोटो देखाउन सक्नुहुन्छ?`,
      },
      hint: { en: "A photo of the work itself is best.", ne: "कामकै फोटो सबैभन्दा राम्रो।" },
    }
  );
}

const SYSTEM = `You check whether a photo is plausible evidence for a work skill on a hiring platform.
Rules:
- Judge only whether the photo shows work, tools, products, a workplace or a record that fits the named skill.
- Never identify, describe or guess anything about people in the photo (identity, gender, age, caste, ethnicity).
- You cannot know who did the work; do not claim to.
- If the photo is unclear, unrelated, a screenshot of text you cannot connect to the skill, or inappropriate, say "unclear" or "no".
Respond with JSON only: {"match":"yes"|"no"|"unclear","confidence":0-1,"seen":"<max 15 words, what the photo shows, no people details>"}`;

/** Runs the AI check. Returns the status to store and a short note. */
export async function aiCheck(
  tag: string,
  caption: string,
  file: { path: string; mime: string },
): Promise<{ status: EvidenceStatus; note: string; by: string }> {
  const buf = readPrivateFile(file.path);
  if (!buf) return { status: "needs_review", note: "", by: "" };
  try {
    const out = await askVision(
      SYSTEM,
      JSON.stringify({
        skill: TAG_LABELS[tag]?.en ?? tag,
        what_we_asked: promptFor(tag).question.en,
        caption_from_person: caption.slice(0, 200),
      }),
      { base64: buf.toString("base64"), mime: file.mime },
    );
    if (!out) return { status: "needs_review", note: "", by: "" };
    const data = JSON.parse(out.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    const seen = String(data?.seen ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    const conf = Number(data?.confidence);
    // Only a clear, confident "yes" skips the human queue.
    if (data?.match === "yes" && Number.isFinite(conf) && conf >= 0.75) {
      return { status: "ai_checked", note: seen, by: out.by };
    }
    return { status: "needs_review", note: seen, by: out.by };
  } catch (err) {
    console.error("Skill photo AI check skipped:", err instanceof Error ? err.message : err);
    return { status: "needs_review", note: "", by: "" };
  }
}

export type EvidenceItem = {
  id: string;
  tag: string;
  caption: string;
  status: EvidenceStatus;
  ai_note: string;
  review_note: string;
  created_at: string;
};

export function evidenceForUser(userId: string, includeRejected = true): EvidenceItem[] {
  return getDb()
    .prepare(
      `SELECT id, tag, caption, status, ai_note, review_note, created_at FROM skill_evidence
        WHERE user_id = ? ${includeRejected ? "" : "AND status != 'rejected'"} ORDER BY created_at`,
    )
    .all(userId) as EvidenceItem[];
}

/** May this employer see this candidate's skill photos? Only if the
 * candidate applied to one of the employer's jobs. */
export function employerCanSeeUser(employerId: string, userId: string): boolean {
  return Boolean(
    getDb()
      .prepare(
        `SELECT 1 FROM users u JOIN candidates c ON c.phone = u.phone JOIN submissions s ON s.candidate_id = c.id
           JOIN jobs j ON j.id = s.job_id WHERE u.id = ? AND j.employer_id = ? LIMIT 1`,
      )
      .get(userId, employerId),
  );
}
