import { getDb, newId } from "./db";
import { notifyUser } from "./verification";
import type { SalaryPeriod } from "./types";

/**
 * Hire records and the 30/60/90-day check-ins.
 *
 * A job counts as FORMAL here when, by its 90-day check-in, the WORKER has
 * confirmed both that they received an appointment letter and that they were
 * enrolled in the Social Security Fund. Employer answers are shown too, but
 * the worker's confirmation is what the "Formal Job Rate" uses.
 *
 * This is evidence to help employers prepare SSF records and their labour
 * audit, and to help nonprofits report outcomes. It is not a labour audit.
 */

export const CHECKIN_DAYS = [30, 60, 90] as const;
/** SSF: employees must be enrolled within 3 months of appointment. */
export const SSF_DEADLINE_DAYS = 90;

export type HireRow = {
  id: string;
  submission_id: string;
  job_id: string;
  employer_id: string;
  worker_phone: string;
  position: string;
  start_date: string;
  salary: number;
  salary_period: SalaryPeriod;
  employment_type: string;
  hours: string;
  probation_months: number;
  duties: string;
  letter_issued_at: string;
  letter_confirmed_at: string;
  ssf_reported_at: string;
  status: "active" | "ended";
  ended_at: string;
  end_reason: string;
  created_at: string;
};

export type CheckinRow = {
  id: string;
  hire_id: string;
  day: number;
  respondent: "worker" | "employer";
  due_at: string;
  notified_at: string;
  answered_at: string;
  still_employed: number | null;
  has_letter: number | null;
  ssf: number | null;
  paid_on_time: number | null;
  rating: number | null;
  note: string;
};

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
};

export function createCheckins(hireId: string, startDate: string) {
  const ins = getDb().prepare(
    "INSERT OR IGNORE INTO checkins (id, hire_id, day, respondent, due_at) VALUES (?, ?, ?, ?, ?)",
  );
  for (const day of CHECKIN_DAYS)
    for (const who of ["worker", "employer"] as const) ins.run(newId() + newId(), hireId, day, who, addDays(startDate, day));
}

export function getHire(id: string): HireRow | undefined {
  return getDb().prepare("SELECT * FROM hires WHERE id = ?").get(id) as HireRow | undefined;
}

export function checkinsFor(hireId: string): CheckinRow[] {
  return getDb().prepare("SELECT * FROM checkins WHERE hire_id = ? ORDER BY day, respondent").all(hireId) as CheckinRow[];
}

/** Everything a report needs about one hire, computed the same way everywhere. */
export function summarize(h: HireRow, cks: CheckinRow[], now = Date.now()) {
  const worker = cks.filter((c) => c.respondent === "worker" && c.answered_at);
  const employer = cks.filter((c) => c.respondent === "employer" && c.answered_at);
  const latestWorker = worker.sort((a, b) => b.day - a.day)[0];
  const latestEmployer = employer.sort((a, b) => b.day - a.day)[0];
  const workerSaysLetter = Boolean(h.letter_confirmed_at) || worker.some((c) => c.has_letter === 1);
  const workerSaysSsf = worker.some((c) => c.ssf === 1);
  const days = Math.floor((now - new Date(h.start_date).getTime()) / 86_400_000);
  const ssfDeadline = addDays(h.start_date, SSF_DEADLINE_DAYS);
  const employed = (day: number) => {
    const w = worker.find((c) => c.day === day);
    const e = employer.find((c) => c.day === day);
    const v = w?.still_employed ?? e?.still_employed;
    if (v !== null && v !== undefined) return v === 1;
    // A job that ended earlier counts as "not employed" once that day passes.
    if (h.status === "ended" && days >= day) return false;
    return null;
  };
  return {
    days_since_start: days,
    letter_issued: Boolean(h.letter_issued_at),
    letter_confirmed_by_worker: workerSaysLetter,
    ssf_reported_by_employer: Boolean(h.ssf_reported_at),
    ssf_confirmed_by_worker: workerSaysSsf,
    ssf_deadline: ssfDeadline,
    ssf_overdue: h.status === "active" && !workerSaysSsf && !h.ssf_reported_at && Date.now() > new Date(ssfDeadline).getTime(),
    employed_30: employed(30),
    employed_60: employed(60),
    employed_90: employed(90),
    /** Contract + SSF, both confirmed by the worker. */
    formal: workerSaysLetter && workerSaysSsf,
    paid_on_time: latestWorker?.paid_on_time ?? null,
    worker_rating: latestWorker?.rating ?? null,
    employer_rating: latestEmployer?.rating ?? null,
    active: h.status === "active",
  };
}

export type HireSummary = ReturnType<typeof summarize>;

/** Totals used by both the employer report and the nonprofit report. */
export function totals(rows: { summary: HireSummary }[]) {
  const n = rows.length;
  const reached90 = rows.filter((r) => r.summary.employed_90 !== null);
  const retained90 = reached90.filter((r) => r.summary.employed_90).length;
  const formal = rows.filter((r) => r.summary.formal).length;
  const letters = rows.filter((r) => r.summary.letter_confirmed_by_worker).length;
  const ssf = rows.filter((r) => r.summary.ssf_confirmed_by_worker).length;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);
  return {
    hires: n,
    with_90_day_answer: reached90.length,
    retained_90: retained90,
    retention_90_pct: pct(retained90, reached90.length),
    letter_confirmed: letters,
    ssf_confirmed: ssf,
    formal,
    formal_job_rate_pct: pct(formal, n),
  };
}

/**
 * Due check-ins become in-app notifications when someone opens the app. No
 * background job is needed, and nothing is sent by SMS (not connected).
 */
export function notifyDueCheckins(userId: string, role: "candidate" | "employer", phone: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const due = (
    role === "employer"
      ? db
          .prepare(
            `SELECT c.id, c.day, h.id AS hire_id, h.position, h.job_id FROM checkins c JOIN hires h ON h.id = c.hire_id
              WHERE h.employer_id = ? AND c.respondent = 'employer' AND c.answered_at = '' AND c.notified_at = '' AND c.due_at <= ? AND h.status = 'active'`,
          )
          .all(userId, now)
      : db
          .prepare(
            `SELECT c.id, c.day, h.id AS hire_id, h.position, h.job_id FROM checkins c JOIN hires h ON h.id = c.hire_id
              WHERE h.worker_phone = ? AND c.respondent = 'worker' AND c.answered_at = '' AND c.notified_at = '' AND c.due_at <= ? AND h.status = 'active'`,
          )
          .all(phone, now)
  ) as { id: string; day: number; hire_id: string; position: string; job_id: string }[];
  for (const c of due) {
    notifyUser(
      userId,
      "checkin",
      `${c.day}-day check-in: ${c.position}`,
      role === "employer" ? "Is this person still working with you? It takes a minute." : "Are you still working there? It takes a minute.",
      `/hire/${c.hire_id}`,
      c.job_id,
    );
    db.prepare("UPDATE checkins SET notified_at = ? WHERE id = ?").run(now, c.id);
  }
  return due.length;
}

/** Demo tools (time travel) are on in development, or with DEMO_TOOLS=1. */
export function demoTools() {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_TOOLS === "1";
}
