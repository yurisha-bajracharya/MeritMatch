import { getDb } from "./db";
import { rankSubmissions, shortlistSize, rowToSubmission } from "./shortlist";
import type { Candidate, Submission } from "./types";

export const RESUME_ODDS = { women: 0.7, rural: 0.5 } as const;

export type Split = { women: number; rural: number };

export type BiasStats = {
  applicants: number;
  shortlisted: number;
  pool: Split;
  merit: Split;
  resume: Split;
};

const pct = (n: number, d: number) =>
  d === 0 ? 0 : Math.round((n / d) * 100);

function weightedShare(share: number, odds: number) {
  const g = share * odds;
  const rest = 1 - share;
  return g + rest === 0 ? 0 : Math.round((g / (g + rest)) * 100);
}

export function computeBias(jobId: string): BiasStats {
  const db = getDb();

  const subRows = db
    .prepare("SELECT * FROM submissions WHERE job_id = ?")
    .all(jobId) as any[];
  const subs = subRows.map(rowToSubmission);

  const candidateRows = db.prepare("SELECT * FROM candidates").all() as any[];
  const candidates = new Map(
    candidateRows.map((c: any) => [c.id, c as Candidate]),
  );

  const known = subs.filter((s) => candidates.has(s.candidate_id));
  const ranked = rankSubmissions(known);
  // Use the employer's real shortlist once they have made one; until then,
  // fall back to the rule-based suggestion so the dashboard is never empty.
  const chosen = ranked.filter((s) => s.shortlisted);
  const top = chosen.length > 0 ? chosen : ranked.slice(0, shortlistSize(ranked.length));

  const share = (list: Submission[], test: (c: Candidate) => boolean) =>
    pct(
      list.filter((s) => test(candidates.get(s.candidate_id)!)).length,
      list.length,
    );

  const isWoman = (c: Candidate) => c.gender === "female";
  const isRural = (c: Candidate) => c.region === "rural";

  const pool: Split = {
    women: share(ranked, isWoman),
    rural: share(ranked, isRural),
  };

  return {
    applicants: ranked.length,
    shortlisted: top.length,
    pool,
    merit: { women: share(top, isWoman), rural: share(top, isRural) },
    resume: {
      women: weightedShare(pool.women / 100, RESUME_ODDS.women),
      rural: weightedShare(pool.rural / 100, RESUME_ODDS.rural),
    },
  };
}
