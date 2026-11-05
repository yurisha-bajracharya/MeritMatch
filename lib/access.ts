import { timingSafeEqual } from "crypto";
import { getDb } from "./db";
import { getSession } from "./auth";

/** Constant-time string compare, so timing can't reveal how much matched. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** Does this token open this submission? Empty tokens never match. */
export function tokenOpens(submissionId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const row = getDb()
    .prepare("SELECT access_token FROM submissions WHERE id = ?")
    .get(submissionId) as { access_token?: string } | undefined;
  return Boolean(row?.access_token) && safeEqual(row!.access_token!, token);
}

/** Is the logged-in user the employer who posted the job this submission is for? */
export async function employerOwnsSubmission(submissionId: string): Promise<boolean> {
  const session = await getSession();
  if (!session || session.role !== "employer") return false;
  const row = getDb()
    .prepare(
      `SELECT j.employer_id FROM submissions s JOIN jobs j ON j.id = s.job_id WHERE s.id = ?`,
    )
    .get(submissionId) as { employer_id?: string } | undefined;
  return Boolean(row?.employer_id) && row!.employer_id === session.userId;
}
