import type { Bilingual, Job } from "./types";

/** Every skill tag used by rubrics, jobs and the career-break translator. */
export const TAG_LABELS: Record<string, Bilingual> = {
  "customer-service": { en: "Customer service", ne: "ग्राहक सेवा" },
  communication: { en: "Communication", ne: "सञ्चार" },
  "problem-solving": { en: "Problem solving", ne: "समस्या समाधान" },
  "time-management": { en: "Time management", ne: "समय व्यवस्थापन" },
  numeracy: { en: "Working with numbers", ne: "गणना" },
  accuracy: { en: "Accuracy", ne: "शुद्धता" },
  "data-entry": { en: "Data entry", ne: "डेटा इन्ट्री" },
  organization: { en: "Organisation", ne: "व्यवस्थापन" },
  "digital-literacy": { en: "Computer skills", ne: "कम्प्युटर सीप" },
  professionalism: { en: "Professionalism", ne: "व्यावसायिकता" },
  teamwork: { en: "Teamwork", ne: "टोली कार्य" },
};

export const isKnownTag = (tag: string) => tag in TAG_LABELS;

export type JobMatch = { job: Job; shared: string[]; score: number };

/** Ranks jobs by skill-tag overlap (Jaccard); jobs with no shared tag are dropped. */
export function similarJobs(tags: string[], jobs: Job[], excludeJobIds: string[] = [], limit = 5): JobMatch[] {
  const mine = new Set(tags);
  return jobs
    .filter((j) => !excludeJobIds.includes(j.id))
    .map((job) => {
      const shared = job.tags.filter((t) => mine.has(t));
      const union = new Set([...job.tags, ...tags]).size;
      return { job, shared, score: union === 0 ? 0 : shared.length / union };
    })
    .filter((m) => m.shared.length > 0)
    .sort((a, b) => b.score - a.score || b.shared.length - a.shared.length)
    .slice(0, limit);
}
