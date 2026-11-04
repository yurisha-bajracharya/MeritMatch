export type Category = "retail" | "admin" | "office" | "hospitality" | "teaching" | "driving" | "construction" | "it-support";
export type Lang = "en" | "ne";
export type InputMode = "text" | "voice";
export type Bilingual = Record<Lang, string>;
export type Role = "candidate" | "employer";

export const CATEGORIES: Category[] = [
  "retail", "admin", "office", "hospitality",
  "teaching", "driving", "construction", "it-support",
];

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
  skills: string[];
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
  read: boolean;
  created_at: string;
};
