import { readDb } from "./store";
import type { Candidate, CriterionScore, Job, Submission } from "./types";

export type RankedEntry = {
  submissionId: string;
  /** Short anonymous label, stable for a submission. */
  label: string;
  rank: number;
  total: number;
  reason: string;
  tags: string[];
  criteria: CriterionScore[];
  shortlisted: boolean;
  consent: boolean;
  /** Present only after the candidate has agreed to share. */
  contact?: { name: string; phone: string };
};

export function shortlistSize(applicants: number): number {
  return Math.min(applicants, Math.max(3, Math.ceil(applicants * 0.25)));
}

export function rankSubmissions(subs: Submission[]): Submission[] {
  return [...subs].sort(
    (a, b) => b.total - a.total || a.createdAt.localeCompare(b.createdAt),
  );
}

export async function getRanking(
  jobId: string,
): Promise<{
  job: Job;
  entries: RankedEntry[];
  candidates: Map<string, Candidate>;
} | null> {
  const db = await readDb();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  const candidates = new Map(db.candidates.map((c) => [c.id, c]));
  const ranked = rankSubmissions(
    db.submissions.filter((s) => s.jobId === jobId),
  );
  const cut = shortlistSize(ranked.length);

  const entries = ranked.map((s, i): RankedEntry => {
    const c = candidates.get(s.candidateId);
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
      contact: s.consent && c ? { name: c.name, phone: c.phone } : undefined,
    };
  });
  return { job, entries, candidates };
}
