import type { Bilingual } from "./types";

export type EvidenceStatus = "ai_checked" | "needs_review" | "reviewed" | "rejected";

/** What each status of a skill photo means, in both languages. */
export const EVIDENCE_STATUS: Record<EvidenceStatus, { label: Bilingual; cls: string }> = {
  ai_checked: { label: { en: "Photo fits the skill (AI check)", ne: "फोटो सीपसँग मिल्छ (AI जाँच)" }, cls: "badge-moss" },
  needs_review: { label: { en: "Waiting for a person to review", ne: "मानिसले जाँच्न बाँकी" }, cls: "badge-ochre" },
  reviewed: { label: { en: "Checked by MeritMatch", ne: "मेरिटम्याचले जाँचेको" }, cls: "badge-moss" },
  rejected: { label: { en: "Not accepted", ne: "स्वीकार भएन" }, cls: "badge-brand" },
};

export const EVIDENCE_DISCLAIMER: Bilingual = {
  en: "Photos show the kind of work. They do not prove who did it.",
  ne: "फोटोले कामको प्रकार देखाउँछ, कसले गर्‍यो भन्ने प्रमाणित गर्दैन।",
};
