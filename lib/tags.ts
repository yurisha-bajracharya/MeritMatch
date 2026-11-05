import { FIT_WEIGHT, locationFit, type LocationFit } from "./places";
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
  tailoring: { en: "Tailoring / crafts", ne: "सिलाइ / हस्तकला" },
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
  // Leadership
  leader: "leadership",
  "team lead": "leadership",
  "team leader": "leadership",
  "led a team": "leadership",
  "managed a team": "leadership",
  "team management": "leadership",
  supervisor: "leadership",
  supervised: "leadership",
  supervising: "leadership",
  captain: "leadership",
  mentoring: "leadership",
  // Software / IT
  "software engineer": "digital-literacy",
  programmer: "digital-literacy",
  "web developer": "digital-literacy",
  "app developer": "digital-literacy",
  "computer engineering": "digital-literacy",
  // Other trades
  driver: "driving",
  "delivery rider": "driving",
  chef: "cooking",
  teacher: "teaching",
  tutor: "teaching",
  tutoring: "teaching",
  "heavy lifting": "physical-fitness",
  "manual labour": "physical-fitness",
  // Tailoring and crafts
  tailor: "tailoring",
  tailoring: "tailoring",
  sewing: "tailoring",
  stitching: "tailoring",
  seamstress: "tailoring",
  embroidery: "tailoring",
  knitting: "tailoring",
  weaving: "tailoring",
  handicraft: "tailoring",
  handicrafts: "tailoring",
  "सिलाइ": "tailoring",
  "बुनाइ": "tailoring",
  "हस्तकला": "tailoring",
  "दर्जी": "tailoring",
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
  if (!norm) return null;

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

  // Substring matching is only safe for inputs long enough to be meaningful.
  // Without this guard a 1-2 character query matches almost every label.
  if (norm.length < 3) return null;

  // If input contains a known tag label, or vice versa
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

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Does `phrase` appear in `text` as a whole word / phrase?
 * Latin phrases use word boundaries so "led" doesn't match "called" and
 * "lead" doesn't match "misleading". Nepali has no spaces-as-boundaries
 * guarantee, so it uses a plain substring check.
 */
function mentions(text: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  if (/^[a-z0-9 ]+$/.test(p)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRe(p)}([^a-z0-9]|$)`).test(text);
  }
  return text.includes(p);
}

/**
 * Find skill tags a piece of free text names directly: a tag's own label
 * ("leadership"), an alias ("software engineering"), or the Nepali label.
 * Returns each tag once, with the phrase that triggered it, so the UI can
 * show real evidence ("You mentioned 'software engineering'").
 */
export function findTagsInText(
  input: string,
): { tag: string; phrase: string }[] {
  const text = normalize(input).replace(/\s+/g, " ");
  const found = new Map<string, string>();

  for (const [tag, labels] of Object.entries(TAG_LABELS)) {
    for (const phrase of [labels.en, labels.ne, tag]) {
      if (mentions(text, phrase)) {
        found.set(tag, phrase);
        break;
      }
    }
  }
  for (const [alias, tag] of Object.entries(TAG_ALIASES)) {
    if (!found.has(tag) && mentions(text, alias)) found.set(tag, alias);
  }

  return [...found].map(([tag, phrase]) => ({ tag, phrase }));
}

/** Resolve a list of raw tags to canonical form, dropping blanks and duplicates. */
export function resolveTags(tags: string[]): string[] {
  const out = new Set<string>();
  for (const raw of tags) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) continue;
    out.add(resolveTag(trimmed) ?? normalize(trimmed));
  }
  return [...out];
}

export type JobMatch = {
  job: Job;
  shared: string[];
  /** 0..1. Skill overlap, nudged by how well the city fits. */
  score: number;
  /** How the job's city compares to the person's preferred cities. */
  fit: LocationFit;
};

export type MatchOptions = {
  /** City ids the person wants to work in (see lib/places.ts). */
  cities?: string[];
  /** Drop jobs in cities the person did not choose. */
  onlyPreferred?: boolean;
};

/** Skill is what qualifies you; location only nudges the order. */
const LOCATION_SHARE = 0.2;

/**
 * Ranks jobs by fuzzy skill-tag overlap; jobs with no skill match are dropped.
 * Location never creates a match by itself, it only reorders matches.
 */
export function matchJobs(
  userTags: string[],
  jobs: Job[],
  excludeJobIds: string[] = [],
  limit = 20,
  opts: MatchOptions = {},
): JobMatch[] {
  const cities = opts.cities ?? [];
  // Resolve BOTH sides to canonical form, so a job tagged "sales" still
  // matches a candidate skill of "customer-service".
  const resolvedUser = new Set(resolveTags(userTags));
  if (resolvedUser.size === 0) return [];

  const excluded = new Set(excludeJobIds);

  return jobs
    .filter((j) => !excluded.has(j.id))
    .map((job) => {
      const jobTags = new Set(resolveTags(job.tags));
      const shared = [...jobTags].filter((tag) => resolvedUser.has(tag));

      // Blend two views so neither a broad job nor a broad candidate wins
      // purely on tag count: how much of the job's need the person covers,
      // and how much of the person's skill set the job uses.
      const jobCoverage = jobTags.size ? shared.length / jobTags.size : 0;
      const skillCoverage = shared.length / resolvedUser.size;
      const skill = (jobCoverage + skillCoverage) / 2;

      const fit = locationFit(job.location, cities);
      const score =
        cities.length === 0
          ? skill
          : (1 - LOCATION_SHARE) * skill + LOCATION_SHARE * FIT_WEIGHT[fit];

      return { job, shared, score, fit };
    })
    .filter((m) => m.shared.length > 0)
    .filter((m) => !(opts.onlyPreferred && m.fit === "elsewhere"))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.shared.length - a.shared.length ||
        (b.job.created_at > a.job.created_at ? 1 : -1),
    )
    .slice(0, limit);
}
