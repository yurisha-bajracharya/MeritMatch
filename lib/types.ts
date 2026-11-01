export type Category = "retail" | "admin" | "office";
export type Lang = "en" | "ne";
export type InputMode = "text" | "voice";
export type Bilingual = Record<Lang, string>;

export const CATEGORIES: Category[] = ["retail", "admin", "office"];

export type Criterion = {
  id: string;
  label: Bilingual;
  /** What a strong answer shows. Sent to the scorer. */
  description: string;
  max: number;
  /** Skill tags earned when the criterion is scored well. */
  tags: string[];
  /** Keywords (English + Nepali) used only by the offline fallback scorer. */
  signals: string[];
};

export type Scenario = {
  id: string;
  /** English text is also what the scorer sees. */
  prompt: Bilingual;
};

export type TaskTemplate = {
  category: Category;
  name: Bilingual;
  durationMin: number;
  scenarios: Scenario[];
  rubric: Criterion[];
};

export type Job = {
  id: string;
  title: string;
  employer: string;
  location: string;
  category: Category;
  tags: string[];
  verified: boolean;
  createdAt: string;
};

export type Gender = "female" | "male" | "other";
export type Region = "urban" | "rural";

/** Identity data. Never sent to the scorer. */
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

export type Submission = {
  id: string;
  jobId: string;
  candidateId: string;
  language: Lang;
  inputMode: InputMode;
  answers: Answer[];
  criteria: CriterionScore[];
  /** 0-100 */
  total: number;
  /** One line shown to the employer */
  reason: string;
  tags: string[];
  scoredBy: "gemini" | "openai" | "fallback";
  /** Candidate agreed to share contact details with the employer */
  consent: boolean;
  createdAt: string;
};

export type Db = {
  jobs: Job[];
  candidates: Candidate[];
  submissions: Submission[];
};
