import { getDb } from "./db";
import { findSimilar } from "./integrity";
import type {
  Candidate,
  CriterionScore,
  Evidence,
  IntegrityFlag,
  Job,
  McqResult,
  Submission,
} from "./types";
import { locationFit, type LocationFit } from "./places";

export type RankedEntry = {
  submissionId: string;
  label: string;
  rank: number;
  total: number;
  reason: string;
  tags: string[];
  criteria: CriterionScore[];
  /** Where `total` came from. Null on submissions made before choice questions. */
  mcqScore: number | null;
  mcqCorrect: number | null;
  mcqTotal: number | null;
  writtenScore: number | null;
  /** The employer's decision. Candidates see this; video is asked only from these. */
  shortlisted: boolean;
  rejected: boolean;
  /** The top-25% rule's suggestion. Only a hint; never shown to candidates. */
  suggested: boolean;
  consent: boolean;
  /** Review notes for the employer. Advisory only; never affects rank. */
  flags: IntegrityFlag[];
  /** Whether this job's city is one the applicant said they want. Advisory; never changes rank. */
  fit: LocationFit;
  /** Proof-of-work uploaded by the candidate. Files are served only to the job owner. */
  media: { id: string; kind: "photo" | "video"; caption: string }[];
  /** Human ratings (1-5) the employer gave. Never part of `total`. */
  reviews: Partial<Record<"photo" | "video", { scores: Record<string, number>; note: string }>>;
  /** What the candidate wrote, per question. Shown to the job owner only. */
  answers: { scenarioId: string; text: string }[];
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

/**
 * Highest combined score first. Ties are broken by the WRITTEN score (the part
 * that actually separates people; choice questions saturate), then by who
 * applied first.
 */
export function rankSubmissions(subs: Submission[]): Submission[] {
  return [...subs].sort(
    (a, b) =>
      b.total - a.total ||
      (b.written_score ?? b.total) - (a.written_score ?? a.total) ||
      a.created_at.localeCompare(b.created_at),
  );
}

function parseMcq(raw: unknown): McqResult | null {
  try {
    const v = JSON.parse(String(raw || "null"));
    return v && Array.isArray(v.answers) ? v : null;
  } catch {
    return null;
  }
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
    shortlisted: Boolean(row.shortlisted),
    rejected: Boolean(row.rejected),
    flags: parseFlags(row.flags),
    mcq_score: row.mcq_score ?? null,
    written_score: row.written_score ?? null,
    mcq: parseMcq(row.mcq),
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
    evidence: (["photos", "video"].includes(row.evidence) ? row.evidence : "none") as Evidence,
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

  // Location fit is shown per applicant. It reads only the city they chose,
  // never a name or contact detail, so it doesn't break anonymity. It does
  // NOT affect rank: the employer decides how much it matters.
  const cityByPhone = new Map<string, string[]>(
    (
      db
        .prepare("SELECT phone, preferred_cities FROM users WHERE role = 'candidate'")
        .all() as any[]
    ).map((u) => [u.phone, JSON.parse(u.preferred_cities || "[]")]),
  );

  const mediaBySub = new Map<string, RankedEntry["media"]>();
  for (const m of db
    .prepare(
      "SELECT id, submission_id, kind, caption FROM media WHERE submission_id IN (SELECT id FROM submissions WHERE job_id = ?) AND expires_at > ? ORDER BY created_at",
    )
    .all(jobId, new Date().toISOString()) as any[]) {
    const list = mediaBySub.get(m.submission_id) ?? [];
    list.push({ id: m.id, kind: m.kind, caption: m.caption || "" });
    mediaBySub.set(m.submission_id, list);
  }
  const reviewsBySub = new Map<string, RankedEntry["reviews"]>();
  for (const r of db
    .prepare(
      "SELECT * FROM evidence_reviews WHERE submission_id IN (SELECT id FROM submissions WHERE job_id = ?)",
    )
    .all(jobId) as any[]) {
    const cur = reviewsBySub.get(r.submission_id) ?? {};
    cur[r.kind as "photo" | "video"] = {
      scores: JSON.parse(r.scores || "{}"),
      note: r.note || "",
    };
    reviewsBySub.set(r.submission_id, cur);
  }

  const entries = ranked.map((s, i): RankedEntry => {
    const c = candidates.get(s.candidate_id);
    const cities = c ? (cityByPhone.get(c.phone) ?? []) : [];
    return {
      submissionId: s.id,
      answers: s.answers,
      label: `#${s.id.slice(0, 4).toUpperCase()}`,
      rank: i + 1,
      total: s.total,
      reason: s.reason,
      tags: s.tags,
      criteria: s.criteria,
      mcqScore: s.mcq_score ?? null,
      mcqCorrect: s.mcq?.correct ?? null,
      mcqTotal: s.mcq?.total ?? null,
      writtenScore: s.written_score ?? null,
      fit: locationFit(job.location, cities),
      media: mediaBySub.get(s.id) ?? [],
      reviews: reviewsBySub.get(s.id) ?? {},
      shortlisted: s.shortlisted === true,
      rejected: s.rejected === true,
      suggested: i < cut,
      consent: s.consent,
      flags: [...(s.flags ?? []), ...(similar.get(s.id) ?? [])],
      contact:
        s.consent && c ? { name: c.name, phone: c.phone } : undefined,
    };
  });

  return { job, entries };
}

export { rowToJob, rowToSubmission };
