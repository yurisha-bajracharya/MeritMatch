import { getDb, newId } from "./db";
import { locationFit } from "./places";
import { matchJobs, resolveTags } from "./tags";
import type { Job, Notification } from "./types";
import { rowToJob } from "./shortlist";

/** When a new job is posted, notify subscribers whose tags overlap */
export function notifySubscribers(job: Job) {
  const db = getDb();
  const subs = db.prepare("SELECT * FROM subscriptions").all() as any[];
  const cityCache = new Map<string, string[]>();
  const citiesOf = (userId: string): string[] => {
    if (!cityCache.has(userId)) {
      const u = db
        .prepare("SELECT preferred_cities FROM users WHERE id = ?")
        .get(userId) as any;
      cityCache.set(userId, JSON.parse(u?.preferred_cities || "[]"));
    }
    return cityCache.get(userId)!;
  };

  for (const sub of subs) {
    const userTags: string[] = JSON.parse(sub.tags || "[]");

    // A subscription can be to skills, to a whole category, or both.
    const byCategory = Boolean(sub.category) && sub.category === job.category;
    const bySkill =
      resolveTags(userTags).length > 0 && matchJobs(userTags, [job]).length > 0;
    if (!byCategory && !bySkill) continue;

    // Respect the cities they chose. Unknown / no preference still notifies.
    if (locationFit(job.location, citiesOf(sub.user_id)) === "elsewhere") continue;

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
      `${job.employer_name}${job.location ? `, ${job.location}` : ""}, matches your skills`,
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
  // Join the job so the screen can write the text in the reader's language
  // instead of showing the English sentence that was stored.
  const rows = db
    .prepare(
      `SELECT n.*, j.title AS job_title, j.employer_name AS job_employer, j.location AS job_location
         FROM notifications n LEFT JOIN jobs j ON j.id = n.job_id
        WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT ?`,
    )
    .all(userId, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    job_id: r.job_id || "",
    link: r.link || "",
    job_title: r.job_title || "",
    job_employer: r.job_employer || "",
    job_location: r.job_location || "",
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
  const user = db
    .prepare("SELECT skills, preferred_cities FROM users WHERE id = ?")
    .get(userId) as any;
  const userSkills: string[] = user ? JSON.parse(user.skills || "[]") : [];
  const cities: string[] = user ? JSON.parse(user.preferred_cities || "[]") : [];

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
  const matches = matchJobs(allTags, allJobs, [], limit, { cities });
  return matches.map((m) => m.job);
}
