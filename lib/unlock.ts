import { getDb } from "./db";

/** Price to see one shortlisted candidate's contact details (mock payment). */
export const UNLOCK_PRICE_NPR = 200;

/**
 * Accounts that unlock for free: the demo / admin recruiter. Defaults to the
 * seeded demo employer; set FREE_UNLOCK_PHONES="98...,98..." to change it.
 */
export function isFreeEmployer(userId: string): boolean {
  const phones = (process.env.FREE_UNLOCK_PHONES || "9800000001")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const row = getDb().prepare("SELECT phone FROM users WHERE id = ?").get(userId) as
    | { phone: string }
    | undefined;
  return Boolean(row && phones.includes(row.phone));
}
