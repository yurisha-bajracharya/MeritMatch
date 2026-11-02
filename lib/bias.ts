import { rankSubmissions, shortlistSize } from "./shortlist";
import type { Candidate, Submission } from "./types";

/**
 * Placeholder assumptions for the "resume-based" what-if. A resume screen is assumed to pass
 * a woman at 70% and a rural applicant at 50% of the rate of an otherwise equal applicant.
 * Replace with real figures from a source you can cite before presenting as fact.
 */
export const RESUME_ODDS = { women: 0.7, rural: 0.5 } as const;

export type Split = { women: number; rural: number };

export type BiasStats = {
  applicants: number;
  shortlisted: number;
  /** Whole-number percentages */
  pool: Split;
  merit: Split;
  resume: Split;
};

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

/** Share of a group after applying a relative pass rate to that group. */
function weightedShare(share: number, odds: number) {
  const g = share * odds;
  const rest = 1 - share;
  return g + rest === 0 ? 0 : Math.round((g / (g + rest)) * 100);
}

export function computeBias(
  subs: Submission[],
  candidates: Map<string, Candidate>,
): BiasStats {
  const known = subs.filter((s) => candidates.has(s.candidateId));
  const ranked = rankSubmissions(known);
  const top = ranked.slice(0, shortlistSize(ranked.length));

  const share = (list: Submission[], test: (c: Candidate) => boolean) =>
    pct(
      list.filter((s) => test(candidates.get(s.candidateId)!)).length,
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
