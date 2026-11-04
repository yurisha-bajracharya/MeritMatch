import { getDb, newId } from "./db";
import { matchJobs } from "./tags";
import type { Job, Notification } from "./types";
import { rowToJob } from "./shortlist";

/** When a new job is posted, notify subscribers whose tags overlap */
export function notifySubscribers(job: Job) {
  const db = getDb();
  const subs = db.prepare("SELECT * FROM subscriptions").all() as any[];

  for (const sub of subs) {
    const userTags: string[] = JSON.parse(sub.tags || "[]");
    const matches = matchJobs(userTags, [job]);
    if (matches.length === 0) continue;

    // Check if notification already exists for this user+job
    const existing = db
      .prepare(
        "SELECT id FROM notifications WHERE user_id = ? AND job_id = ? AND type = 'new_job'",
      )
      .get(sub.user_id, job.id);
    if (existing) continue;

    db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, message, job_id, read, created_at)
       VALUES (?, ?, 'new_job', ?, ?, ?, 0, ?)`,
    ).run(
      newId(),
      sub.user_id,
      `New job: ${job.title}`,
      `${job.employer_name}${job.location ? `, ${job.location}` : ""} — matches your skills`,
      job.id,
      new Date().toISOString(),
    );
  }
}

/** Get unread notification count for a user */
export function getUnreadCount(userId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0",
    )
    .get(userId) as any;
  return row?.count ?? 0;
}

/** Get notifications for a user */
export function getNotifications(
  userId: string,
  limit = 20,
): Notification[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    job_id: r.job_id || "",
    read: Boolean(r.read),
    created_at: r.created_at,
  }));
}

/** Mark a notification as read */
export function markRead(notificationId: string, userId: string) {
  const db = getDb();
  db.prepare(
    "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
  ).run(notificationId, userId);
}

/** Mark all notifications as read */
export function markAllRead(userId: string) {
  const db = getDb();
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(
    userId,
  );
}

/** Get matching jobs for a user based on their skills/subscriptions */
export function getMatchingJobs(userId: string, limit = 20): Job[] {
  const db = getDb();

  // Get user skills
  const user = db.prepare("SELECT skills FROM users WHERE id = ?").get(userId) as any;
  const userSkills: string[] = user ? JSON.parse(user.skills || "[]") : [];

  // Also get subscription tags
  const subRows = db
    .prepare("SELECT tags FROM subscriptions WHERE user_id = ?")
    .all(userId) as any[];
  const subTags = subRows.flatMap((s) => JSON.parse(s.tags || "[]"));

  const allTags = [...new Set([...userSkills, ...subTags])];
  if (allTags.length === 0) {
    // Return recent jobs if no tags
    const rows = db
      .prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?")
      .all(limit) as any[];
    return rows.map(rowToJob);
  }

  const allJobs = (db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all() as any[]).map(rowToJob);
  const matches = matchJobs(allTags, allJobs, [], limit);
  return matches.map((m) => m.job);
}
