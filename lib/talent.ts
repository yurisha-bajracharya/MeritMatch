import { getDb, newId } from "./db";
import { talentId } from "./auth";
import { TAG_LABELS } from "./tags";
import type { Category } from "./types";

/**
 * Talent pool and "Top talent" tags.
 *
 * - People join the pool only by ticking the box (application form or
 *   dashboard). Leaving removes them from search at once.
 * - "Top talent in <skill>" is given by an employer while the person is still
 *   anonymous to them (contact not unlocked), and only after a task scoring at
 *   least TOP_TALENT_MIN. It records who gave it, when, the score, and expires
 *   after 12 months. The person can hide it.
 * - Search never shows names, phones, gender, caste, age or home district.
 */

export const TALENT_TERMS_VERSION = "v1";
export const TOP_TALENT_MIN = 70;
export const TOP_TALENT_MONTHS = 12;
export const INVITES_PER_DAY = 50;

/** The skill each job category mainly tests. */
export const CATEGORY_SKILL: Record<Category, string> = {
  retail: "customer-service",
  admin: "organization",
  office: "data-entry",
  hospitality: "cooking",
  teaching: "teaching",
  driving: "driving",
  construction: "physical-fitness",
  "it-support": "digital-literacy",
  tailoring: "tailoring",
};

export function inPool(phone: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM talent_pool WHERE phone = ?").get(phone));
}

export function joinPool(phone: string, source: "application" | "dashboard" | "org") {
  if (!phone || phone.startsWith("anon-")) return;
  getDb()
    .prepare("INSERT OR IGNORE INTO talent_pool (phone, joined_at, terms_version, source) VALUES (?, ?, ?, ?)")
    .run(phone, new Date().toISOString(), TALENT_TERMS_VERSION, source);
}

export function leavePool(phone: string) {
  getDb().prepare("DELETE FROM talent_pool WHERE phone = ?").run(phone);
}

export type TopTag = { id: string; tag: string; employer: string; job: string; score: number; at: string; expires: string; hidden: boolean };

/** Current (not expired) Top talent tags for one person. */
export function topTagsFor(phone: string, includeHidden = false): TopTag[] {
  const now = new Date().toISOString();
  return (
    getDb()
      .prepare(
        `SELECT t.id, t.tag, t.score, t.created_at AS at, t.expires_at AS expires, t.hidden,
                COALESCE(NULLIF(v.business_name, ''), u.name, '') AS employer, j.title AS job
           FROM talent_tags t
           LEFT JOIN employer_verifications v ON v.employer_id = t.employer_id
           LEFT JOIN users u ON u.id = t.employer_id
           LEFT JOIN jobs j ON j.id = t.job_id
          WHERE t.phone = ? AND t.expires_at > ? ${includeHidden ? "" : "AND t.hidden = 0"}
          ORDER BY t.created_at DESC`,
      )
      .all(phone, now) as any[]
  ).map((r) => ({ ...r, hidden: r.hidden === 1, job: r.job ?? "" }));
}

/** Skills an employer may mark as Top talent for one submission. */
export function topTalentOptions(tags: string[], category: string): string[] {
  const main = CATEGORY_SKILL[category as Category];
  return [...new Set([...(main ? [main] : []), ...tags])].filter((t) => TAG_LABELS[t]);
}

export function giveTopTalent(opts: { phone: string; tag: string; employerId: string; jobId: string; submissionId: string; score: number }) {
  const now = new Date();
  const exp = new Date(now);
  exp.setMonth(exp.getMonth() + TOP_TALENT_MONTHS);
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO talent_tags (id, phone, tag, employer_id, job_id, submission_id, score, given_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'human', ?, ?)`,
    )
    .run(newId() + newId(), opts.phone, opts.tag, opts.employerId, opts.jobId, opts.submissionId, opts.score, now.toISOString(), exp.toISOString());
}

export type PoolPerson = {
  id: string;
  skills: string[];
  topTalent: { tag: string; employer: string; at: string; score: number }[];
  bestScore: number | null;
  tasks: number;
  cities: string[];
  invited: { job_id: string; applied: boolean }[];
};

/** Everyone in the pool, as an employer sees them. Optional skill filter. */
export function searchPool(employerId: string, skill = ""): PoolPerson[] {
  const db = getDb();
  const now = new Date().toISOString();
  const pool = db.prepare("SELECT phone FROM talent_pool").all() as { phone: string }[];
  if (!pool.length) return [];
  const users = new Map<string, any>(
    (db.prepare("SELECT phone, skills, preferred_cities FROM users WHERE role = 'candidate'").all() as any[]).map((u) => [u.phone, u]),
  );
  const subs = db
    .prepare(`SELECT c.phone, s.total, s.tags FROM submissions s JOIN candidates c ON c.id = s.candidate_id`)
    .all() as { phone: string; total: number; tags: string }[];
  const tags = db
    .prepare(
      `SELECT t.phone, t.tag, t.score, t.created_at AS at, COALESCE(NULLIF(v.business_name, ''), u.name, '') AS employer
         FROM talent_tags t LEFT JOIN employer_verifications v ON v.employer_id = t.employer_id LEFT JOIN users u ON u.id = t.employer_id
        WHERE t.hidden = 0 AND t.expires_at > ?`,
    )
    .all(now) as any[];
  const invites = db
    .prepare("SELECT phone, job_id, submission_id FROM talent_invites WHERE employer_id = ?")
    .all(employerId) as { phone: string; job_id: string; submission_id: string }[];

  const out: PoolPerson[] = [];
  for (const { phone } of pool) {
    const u = users.get(phone);
    const mine = subs.filter((s) => s.phone === phone);
    const top = tags.filter((t) => t.phone === phone).map((t) => ({ tag: t.tag, employer: t.employer, at: t.at, score: t.score }));
    const skills = [
      ...new Set([
        ...top.map((t) => t.tag),
        ...mine.flatMap((s) => JSON.parse(s.tags || "[]") as string[]),
        ...(JSON.parse(u?.skills || "[]") as string[]),
      ]),
    ].filter((t) => TAG_LABELS[t]);
    if (skill && !skills.includes(skill)) continue;
    out.push({
      id: talentId(phone),
      skills,
      topTalent: top,
      bestScore: mine.length ? Math.max(...mine.map((s) => s.total)) : null,
      tasks: mine.length,
      cities: JSON.parse(u?.preferred_cities || "[]"),
      invited: invites.filter((i) => i.phone === phone).map((i) => ({ job_id: i.job_id, applied: Boolean(i.submission_id) })),
    });
  }
  // Top talent in the searched skill first, then best task score.
  const topIn = (p: PoolPerson) => p.topTalent.filter((t) => !skill || t.tag === skill).length;
  return out.sort((a, b) => topIn(b) - topIn(a) || (b.bestScore ?? -1) - (a.bestScore ?? -1));
}

/** Map anonymous IDs back to phones (only for people still in the pool). */
export function phonesForIds(ids: string[]): Map<string, string> {
  const want = new Set(ids);
  const out = new Map<string, string>();
  for (const { phone } of getDb().prepare("SELECT phone FROM talent_pool").all() as { phone: string }[]) {
    const id = talentId(phone);
    if (want.has(id)) out.set(id, phone);
  }
  return out;
}
