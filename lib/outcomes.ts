import { getDb } from "./db";
import { checkinsFor, summarize, totals, type HireRow } from "./hires";
import { badgesFor } from "./verification";

/** Employer formalisation report data. */
export function employerReport(employerId: string) {
  const db = getDb();
  const v = db.prepare("SELECT * FROM employer_verifications WHERE employer_id = ?").get(employerId) as any;
  const hires = db.prepare("SELECT * FROM hires WHERE employer_id = ? ORDER BY start_date DESC").all(employerId) as HireRow[];
  const names = db.prepare(
    "SELECT c.name FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE s.id = ?",
  );
  const rows = hires.map((h) => ({
    id: h.id,
    worker_name: (names.get(h.submission_id) as { name: string } | undefined)?.name ?? "",
    position: h.position,
    start_date: h.start_date,
    salary: h.salary,
    salary_period: h.salary_period,
    employment_type: h.employment_type,
    status: h.status,
    summary: summarize(h, checkinsFor(h.id)),
  }));
  // Pay and how the worker rates the job stay private to MeritMatch.
  for (const r of rows) {
    (r.summary as any).paid_on_time = undefined;
    (r.summary as any).worker_rating = undefined;
  }
  return {
    business: {
      name: v?.business_name ?? "",
      contact_verified: badgesFor(v).contact,
      business_status: v?.business_status ?? "none",
      presence_status: v?.presence_status ?? "none",
      employer_verified: badgesFor(v).employer,
    },
    totals: totals(rows),
    hires: rows,
    generated_at: new Date().toISOString(),
  };
}

/** Training-organisation impact report. Only trainees who consented are counted. */
export function orgReport(orgId: string) {
  const db = getDb();
  const trainees = db
    .prepare("SELECT id, name, phone, skills, org_consent_at FROM users WHERE org_id = ? AND org_consent_at != '' AND role = 'candidate'")
    .all(orgId) as { id: string; name: string; phone: string; skills: string; org_consent_at: string }[];
  const subsByPhone = db.prepare(
    `SELECT s.id, s.total, s.tags, s.shortlisted, s.interview FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE c.phone = ?`,
  );
  const hiresByPhone = db.prepare("SELECT * FROM hires WHERE worker_phone = ? ORDER BY start_date DESC");
  const skillCount = new Map<string, number>();
  const people = trainees.map((t) => {
    const subs = subsByPhone.all(t.phone) as { id: string; total: number; tags: string; shortlisted: number; interview: number }[];
    for (const s of subs) for (const tag of JSON.parse(s.tags || "[]") as string[]) skillCount.set(tag, (skillCount.get(tag) ?? 0) + 1);
    const hires = (hiresByPhone.all(t.phone) as HireRow[]).map((h) => ({ h, summary: summarize(h, checkinsFor(h.id)) }));
    const best = hires[0];
    return {
      name: t.name.split(" ")[0] || "Trainee",
      tasks: subs.length,
      average_score: subs.length ? Math.round(subs.reduce((a, s) => a + s.total, 0) / subs.length) : null,
      shortlisted: subs.some((s) => s.shortlisted),
      interviewed: subs.some((s) => s.interview),
      hired: hires.length > 0,
      position: best?.h.position ?? "",
      start_date: best?.h.start_date ?? "",
      summary: best?.summary ?? null,
    };
  });
  const hireRows = people.filter((p) => p.summary).map((p) => ({ summary: p.summary! }));
  const scored = people.filter((p) => p.average_score !== null);
  return {
    trainees: people.length,
    funnel: {
      took_a_task: people.filter((p) => p.tasks > 0).length,
      shortlisted: people.filter((p) => p.shortlisted).length,
      interviewed: people.filter((p) => p.interviewed).length,
      hired: people.filter((p) => p.hired).length,
    },
    average_task_score: scored.length ? Math.round(scored.reduce((a, p) => a + (p.average_score ?? 0), 0) / scored.length) : null,
    top_skills: [...skillCount].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count })),
    outcomes: totals(hireRows),
    people,
    generated_at: new Date().toISOString(),
  };
}
