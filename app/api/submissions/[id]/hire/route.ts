import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { employerOwnsSubmission } from "@/lib/access";
import { createCheckins } from "@/lib/hires";
import { minimumWage, MIN_WAGE_EFFECTIVE } from "@/lib/wage";
import { audit, notifyUser } from "@/lib/verification";
import { EMPLOYMENT_TYPES } from "@/lib/types";

/**
 * The employer marks a shortlisted, unlocked candidate as hired. This
 * creates the hire record, a draft appointment letter (see /hire/[id]) and
 * the 30/60/90-day check-ins. Salary must meet the legal minimum.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await employerOwnsSubmission(id))) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const db = getDb();
  const s = db
    .prepare(
      `SELECT s.id, s.job_id, s.shortlisted, s.consent, s.access_token, c.phone, j.title, j.employer_id, j.hours, j.employment_type, j.responsibilities, j.salary_period,
              (SELECT 1 FROM unlocks u WHERE u.submission_id = s.id) AS unlocked,
              (SELECT id FROM hires h WHERE h.submission_id = s.id) AS hire_id
         FROM submissions s JOIN candidates c ON c.id = s.candidate_id JOIN jobs j ON j.id = s.job_id WHERE s.id = ?`,
    )
    .get(id) as any;
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (s.hire_id) return NextResponse.json({ error: "Already hired", hire_id: s.hire_id }, { status: 409 });
  if (!s.shortlisted || !s.consent || !s.unlocked) {
    return NextResponse.json({ error: "Shortlist, get their consent and unlock their contact before hiring." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const start = String(body.start_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start))) {
    return NextResponse.json({ error: "Choose a start date." }, { status: 400 });
  }
  const period = ["month", "day", "hour"].includes(body.salary_period) ? body.salary_period : "month";
  const salary = Math.round(Number(String(body.salary ?? "").replace(/[, ]/g, "")));
  const type = (EMPLOYMENT_TYPES as readonly string[]).includes(body.employment_type) ? body.employment_type : s.employment_type || "full-time";
  const min = minimumWage(period, type === "part-time");
  if (!Number.isFinite(salary) || salary <= 0) return NextResponse.json({ error: "Enter the agreed salary." }, { status: 400 });
  if (salary < min) {
    return NextResponse.json(
      {
        error: `Rs ${salary.toLocaleString("en-IN")} a ${period} is below the legal minimum of Rs ${min.toLocaleString("en-IN")} (in force from ${MIN_WAGE_EFFECTIVE}).`,
        code: "below_minimum",
        minimum: min,
      },
      { status: 400 },
    );
  }
  const probation = Math.max(0, Math.min(12, Math.round(Number(body.probation_months ?? 0)) || 0));

  const hireId = newId() + newId();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO hires (id, submission_id, job_id, employer_id, worker_phone, position, start_date, salary, salary_period, employment_type, hours, probation_months, duties, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    hireId,
    id,
    s.job_id,
    s.employer_id,
    s.phone,
    String(body.position || s.title).slice(0, 120),
    new Date(start).toISOString(),
    salary,
    period,
    type,
    String(body.hours || s.hours || "").slice(0, 200),
    probation,
    String(body.duties || s.responsibilities || "").slice(0, 2000),
    now,
  );
  createCheckins(hireId, new Date(start).toISOString());
  audit("hired", "hire", hireId, `${s.title} from ${start}`, "employer");

  const user = db.prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'").get(s.phone) as { id: string } | undefined;
  if (user) notifyUser(user.id, "hired", `You are hired: ${s.title}`, "Your appointment letter is ready to read.", `/hire/${hireId}`, s.job_id);
  return NextResponse.json({ ok: true, hire_id: hireId, worker_link: `/hire/${hireId}?k=${s.access_token}` }, { status: 201 });
}
