import type { Bilingual, Job } from "./types";

/** Every skill tag used by rubrics, jobs and the Experience Mapper. */
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
  leadership: { en: "Leadership", ne: "नेतृत्व" },
  "physical-fitness": { en: "Physical work", ne: "शारीरिक काम" },
  driving: { en: "Driving", ne: "सवारी चालक" },
  cooking: { en: "Cooking", ne: "खाना पकाउने" },
  teaching: { en: "Teaching", ne: "शिक्षण" },
};

export const isKnownTag = (tag: string) => tag in TAG_LABELS;

/** Aliases for fuzzy matching — maps common variants to canonical tag names */
const TAG_ALIASES: Record<string, string> = {
  // English aliases
  "software engineering": "digital-literacy",
  "software developer": "digital-literacy",
  "software development": "digital-literacy",
  programming: "digital-literacy",
  coding: "digital-literacy",
  "web development": "digital-literacy",
  developer: "digital-literacy",
  engineer: "digital-literacy",
  "it skills": "digital-literacy",
  "computer science": "digital-literacy",
  "tech skills": "digital-literacy",
  typing: "data-entry",
  "data processing": "data-entry",
  sales: "customer-service",
  "client relations": "customer-service",
  "customer support": "customer-service",
  "customer care": "customer-service",
  "public speaking": "communication",
  writing: "communication",
  "verbal skills": "communication",
  planning: "organization",
  management: "organization",
  coordination: "organization",
  scheduling: "time-management",
  punctuality: "time-management",
  "deadline management": "time-management",
  math: "numeracy",
  mathematics: "numeracy",
  accounting: "numeracy",
  bookkeeping: "numeracy",
  calculation: "numeracy",
  "attention to detail": "accuracy",
  "quality control": "accuracy",
  precision: "accuracy",
  collaboration: "teamwork",
  "team player": "teamwork",
  "group work": "teamwork",
  "critical thinking": "problem-solving",
  troubleshooting: "problem-solving",
  "analytical skills": "problem-solving",
  "work ethic": "professionalism",
  reliability: "professionalism",
  dependability: "professionalism",
  // Nepali aliases
  "सफ्टवेयर": "digital-literacy",
  "प्रोग्रामिङ": "digital-literacy",
  "बिक्री": "customer-service",
  "गणित": "numeracy",
};

/** Normalize a tag string for comparison */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[-_]/g, " ");
}

/** Resolve a tag to its canonical form, checking aliases and fuzzy substring */
export function resolveTag(input: string): string | null {
  const norm = normalize(input);
  // Direct match
  if (TAG_LABELS[input]) return input;
  // Check normalized direct match
  for (const key of Object.keys(TAG_LABELS)) {
    if (normalize(key) === norm) return key;
  }
  // Check aliases
  for (const [alias, canonical] of Object.entries(TAG_ALIASES)) {
    if (normalize(alias) === norm) return canonical;
  }
  // Substring matching — if input contains a known tag label
  for (const [key, labels] of Object.entries(TAG_LABELS)) {
    if (
      norm.includes(normalize(labels.en)) ||
      norm.includes(normalize(labels.ne)) ||
      normalize(labels.en).includes(norm) ||
      normalize(labels.ne).includes(norm)
    ) {
      return key;
    }
  }
  // Check alias substrings
  for (const [alias, canonical] of Object.entries(TAG_ALIASES)) {
    if (norm.includes(normalize(alias)) || normalize(alias).includes(norm)) {
      return canonical;
    }
  }
  return null;
}

export type JobMatch = { job: Job; shared: string[]; score: number };

/** Ranks jobs by fuzzy skill-tag overlap; jobs with no match are dropped. */
export function matchJobs(
  userTags: string[],
  jobs: Job[],
  excludeJobIds: string[] = [],
  limit = 20,
): JobMatch[] {
  // Resolve user tags to canonical forms
  const resolvedUser = new Set(
    userTags.map((t) => resolveTag(t) ?? t).filter(Boolean),
  );

  return jobs
    .filter((j) => !excludeJobIds.includes(j.id))
    .map((job) => {
      const jobTags = job.tags.map((t) => resolveTag(t) ?? t);
      const shared = jobTags.filter((t) => resolvedUser.has(t));
      const uniqueShared = [...new Set(shared)];
      const union = new Set([...jobTags, ...userTags.map((t) => resolveTag(t) ?? t)]).size;
      return {
        job,
        shared: uniqueShared,
        score: union === 0 ? 0 : uniqueShared.length / union,
      };
    })
    .filter((m) => m.shared.length > 0)
    .sort((a, b) => b.score - a.score || b.shared.length - a.shared.length)
    .slice(0, limit);
}
