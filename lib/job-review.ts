import { getDb } from "./db";
import { rowToJob } from "./shortlist";
import { notifySubscribers } from "./notifications";
import { audit, notifyUser } from "./verification";

export type ReviewAction = "approve" | "request_info" | "reject" | "suspend" | "restore";

/**
 * One place for every vacancy decision, so the status, the old `verified`
 * flag, the audit log and the employer's notification never disagree.
 */
export function reviewJob(jobId: string, action: ReviewAction, note: string): { ok: true } | { error: string; status: number } {
  const db = getDb();
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  if (!row) return { error: "Not found", status: 404 };
  if (action !== "approve" && action !== "restore" && !note) {
    return { error: "Write a note: the employer sees it (except for suspensions, which are logged).", status: 400 };
  }
  const status = {
    approve: "approved",
    restore: "approved",
    request_info: "needs_info",
    reject: "rejected",
    suspend: "suspended",
  }[action];
  const now = new Date().toISOString();
  const wasEverApproved =
    row.review_status === "approved" ||
    Boolean(
      db.prepare("SELECT 1 FROM audit_log WHERE target_type = 'job' AND target_id = ? AND action IN ('job_approve', 'job_restore')").get(jobId),
    );
  db.prepare("UPDATE jobs SET review_status = ?, review_note = ?, verified = ?, verified_at = ?, reviewed_at = ? WHERE id = ?").run(
    status,
    status === "approved" ? "" : note,
    status === "approved" ? 1 : 0,
    status === "approved" ? now : "",
    now,
    jobId,
  );
  audit(`job_${action}`, "job", jobId, note);

  const titles: Record<ReviewAction, string> = {
    approve: `Job approved: ${row.title}`,
    restore: `Job restored: ${row.title}`,
    request_info: `More information needed: ${row.title}`,
    reject: `Job not approved: ${row.title}`,
    suspend: `Job temporarily hidden: ${row.title}`,
  };
  notifyUser(row.employer_id, "job_review", titles[action], note, "/employer/dashboard", jobId);

  // Tell job seekers only when a vacancy first goes live.
  if (action === "approve" && !wasEverApproved) {
    try {
      notifySubscribers(rowToJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any));
    } catch (err) {
      console.error("Notify error:", err);
    }
  }
  return { ok: true };
}
