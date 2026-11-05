export type Category = "retail" | "admin" | "office" | "hospitality" | "teaching" | "driving" | "construction" | "it-support" | "tailoring";
export type Lang = "en" | "ne";
export type InputMode = "text" | "voice";
export type Bilingual = Record<Lang, string>;
export type Role = "candidate" | "employer";

export const CATEGORIES: Category[] = [
  "retail", "admin", "office", "hospitality",
  "teaching", "driving", "construction", "it-support", "tailoring",
];

/**
 * What proof-of-work an employer asks for besides the written task.
 *  - photos: up to 4 photos of finished work (sewing, cooking, carpentry...)
 *  - video:  one short demo video, requested ONLY from shortlisted candidates
 *            (a face on camera would otherwise break anonymity)
 */
export type Evidence = "none" | "photos" | "video";

/** One situational multiple-choice question. `correct` never leaves the server. */
export type McqQuestion = {
  id: string;
  prompt: Bilingual;
  options: Bilingual[];
  correct: number;
};

/** What a candidate is allowed to see: no answer key. */
export type PublicMcq = Omit<McqQuestion, "correct">;

export type McqResult = {
  answers: { id: string; choice: number }[];
  correct: number;
  total: number;
};

export type Criterion = {
  id: string;
  label: Bilingual;
  description: string;
  max: number;
  tags: string[];
  signals: string[];
};

export type Scenario = {
  id: string;
  prompt: Bilingual;
};

export type TaskTemplate = {
  category: Category;
  name: Bilingual;
  durationMin: number;
  scenarios: Scenario[];
  rubric: Criterion[];
};

export type CustomQuestion = {
  id: string;
  prompt: Bilingual;
};

export type Job = {
  id: string;
  title: string;
  employer_name: string;
  employer_id: string;
  location: string;
  category: Category;
  tags: string[];
  custom_questions: CustomQuestion[];
  duration_min: number;
  ai_scoring: boolean;
  evidence: Evidence;
  verified: boolean;
  verified_at: string;
  created_at: string;
};

export type Gender = "female" | "male" | "other";
export type Region = "urban" | "rural";

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  gender: string;
  region: string;
  /** Skills the person CLAIMED (from the Experience Mapper). Never used for ranking. */
  skills: string[];
  /** Skills they DEMONSTRATED: tags earned by scoring well on real work tasks. */
  proven_skills?: string[];
  /** City ids from lib/places.ts, or "anywhere". Drives job ranking and alerts. */
  preferred_cities?: string[];
  experience_text: string;
  created_at: string;
};

export type Candidate = {
  id: string;
  name: string;
  phone: string;
  gender: Gender;
  region: Region;
};

export type Answer = { scenarioId: string; text: string };

export type CriterionScore = {
  id: string;
  score: number;
  max: number;
  reason: string;
};

/**
 * An integrity signal for the employer to look at. These are hints, never
 * proof, and they never change a score or remove anyone from the ranking.
 */
export type IntegrityFlag = {
  code: "similar" | "pasted" | "fast" | "late";
  /** English sentence, kept for older rows and as a fallback. */
  note: string;
  /** Numbers behind the note, so the screen can write it in either language. */
  data?: Record<string, number | string>;
};

export type Submission = {
  id: string;
  job_id: string;
  candidate_id: string;
  language: Lang;
  input_mode: InputMode;
  answers: Answer[];
  criteria: CriterionScore[];
  total: number;
  reason: string;
  tags: string[];
  scored_by: "gemini" | "openai" | "fallback" | "demo";
  consent: boolean;
  /** Set by the employer. The top-25% rule only suggests; this is the decision. */
  shortlisted?: boolean;
  /** Set by the employer: not moving forward. Never set automatically. */
  rejected?: boolean;
  flags?: IntegrityFlag[];
  /**
   * `total` is the combined score the ranking uses. These two show where it
   * came from. Null on submissions made before choice questions existed.
   */
  mcq_score?: number | null;
  written_score?: number | null;
  mcq?: McqResult | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  tags: string[];
  category: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  job_id: string;
  /** Where clicking it goes (the candidate's own outcome page for "shortlisted"). */
  link?: string;
  /** Joined from the job so the bell can write the text in either language. */
  job_title?: string;
  job_employer?: string;
  job_location?: string;
  read: boolean;
  created_at: string;
};
