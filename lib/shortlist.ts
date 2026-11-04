import { getDb } from "./db";
import { findSimilar } from "./integrity";
import type {
  Candidate,
  CriterionScore,
  IntegrityFlag,
  Job,
  Submission,
} from "./types";

export type RankedEntry = {
  submissionId: string;
  label: string;
  rank: number;
  total: number;
  reason: string;
  tags: string[];
  criteria: CriterionScore[];
  shortlisted: boolean;
  consent: boolean;
  /** Review notes for the employer. Advisory only; never affects rank. */
  flags: IntegrityFlag[];
  contact?: { name: string; phone: string };
};

function parseFlags(raw: unknown): IntegrityFlag[] {
  try {
    const v = JSON.parse(String(raw || "[]"));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function shortlistSize(applicants: number): number {
  return Math.min(applicants, Math.max(3, Math.ceil(applicants * 0.25)));
}

export function rankSubmissions(subs: Submission[]): Submission[] {
  return [...subs].sort(
    (a, b) => b.total - a.total || a.created_at.localeCompare(b.created_at),
  );
}

function rowToSubmission(row: any): Submission {
  return {
    id: row.id,
    job_id: row.job_id,
    candidate_id: row.candidate_id,
    language: row.language,
    input_mode: row.input_mode,
    answers: JSON.parse(row.answers || "[]"),
    criteria: JSON.parse(row.criteria || "[]"),
    total: row.total,
    reason: row.reason || "",
    tags: JSON.parse(row.tags || "[]"),
    scored_by: row.scored_by,
    consent: Boolean(row.consent),
    flags: parseFlags(row.flags),
    created_at: row.created_at,
  };
}

function rowToJob(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    employer_name: row.employer_name,
    employer_id: row.employer_id || "",
    location: row.location || "",
    category: row.category,
    tags: JSON.parse(row.tags || "[]"),
    custom_questions: JSON.parse(row.custom_questions || "[]"),
    duration_min: row.duration_min,
    ai_scoring: Boolean(row.ai_scoring),
    verified: Boolean(row.verified),
    verified_at: row.verified_at || "",
    created_at: row.created_at,
  };
}

export function getRanking(jobId: string): {
  job: Job;
  entries: RankedEntry[];
} | null {
  const db = getDb();
  const jobRow = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  if (!jobRow) return null;
  const job = rowToJob(jobRow);

  const subRows = db
    .prepare("SELECT * FROM submissions WHERE job_id = ?")
    .all(jobId) as any[];
  const subs = subRows.map(rowToSubmission);

  const candidateRows = db.prepare("SELECT * FROM candidates").all() as any[];
  const candidates = new Map(
    candidateRows.map((c: any) => [c.id, c as Candidate]),
  );

  const ranked = rankSubmissions(subs);
  const cut = shortlistSize(ranked.length);

  // Similarity is computed here, at read time, so it is symmetric: when two
  // applicants have near-identical answers BOTH are flagged and each note
  // names the other.
  const similar = findSimilar(
    subs.map((s) => ({ id: s.id, answers: s.answers })),
  );

  const entries = ranked.map((s, i): RankedEntry => {
    const c = candidates.get(s.candidate_id);
    return {
      submissionId: s.id,
      label: `#${s.id.slice(0, 4).toUpperCase()}`,
      rank: i + 1,
      total: s.total,
      reason: s.reason,
      tags: s.tags,
      criteria: s.criteria,
      shortlisted: i < cut,
      consent: s.consent,
      flags: [...(s.flags ?? []), ...(similar.get(s.id) ?? [])],
      contact:
        s.consent && c ? { name: c.name, phone: c.phone } : undefined,
    };
  });

  return { job, entries };
}

export { rowToJob, rowToSubmission };
