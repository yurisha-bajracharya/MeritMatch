import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { getSession } from "@/lib/auth";
import { DEFAULT_EVIDENCE, templateTags } from "@/lib/templates";
import { CATEGORIES } from "@/lib/types";
import { resolveCity } from "@/lib/places";
import type { Category, Evidence } from "@/lib/types";
import { EMPLOYMENT_TYPES } from "@/lib/types";
import { PUBLIC_JOBS_SQL, badgesMap, contactVerified, getVerification } from "@/lib/verification";

/** Open vacancies only: reviewed and approved, from employers not restricted. */
export async function GET() {
  const db = getDb();
  const rows = db.prepare(`${PUBLIC_JOBS_SQL} ORDER BY j.created_at DESC`).all() as any[];
  const jobs = rows.map(rowToJob);
  const badges = badgesMap(jobs.map((j) => j.employer_id));
  return NextResponse.json(
    jobs.map((j) => ({
      ...j,
      review_note: undefined,
      employer_badges: badges.get(j.employer_id) ?? { contact: false, documents: false, employer: false },
    })),
  );
}

const PERIODS = ["month", "day", "hour"];
const toInt = (v: unknown) => {
  const n = Math.round(Number(String(v ?? "").replace(/[, ]/g, "")));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, employer_name, location, category, tags, custom_questions, duration_min, ai_scoring, evidence } = body;

    if (!title || !employer_name || !category) {
      return NextResponse.json(
        { error: "title, employer_name and category are required" },
        { status: 400 },
      );
    }

    // Only a logged-in employer whose contact is verified can post, and every
    // vacancy then waits for review, even from a fully verified employer.
    const session0 = await getSession();
    if (session0?.role !== "employer") {
      return NextResponse.json({ error: "Log in as an employer to post a job.", code: "login" }, { status: 401 });
    }
    const owner = getDb().prepare("SELECT restricted FROM users WHERE id = ?").get(session0.userId) as
      | { restricted: number }
      | undefined;
    if (owner?.restricted) {
      return NextResponse.json(
        { error: "Your account is restricted while a review is in progress.", code: "restricted" },
        { status: 403 },
      );
    }
    if (!contactVerified(getVerification(session0.userId))) {
      return NextResponse.json(
        { error: "Verify your phone number and contact details first.", code: "verify_contact" },
        { status: 403 },
      );
    }

    const salaryMin = toInt(body.salary_min);
    const salaryMax = toInt(body.salary_max) ?? salaryMin;
    const responsibilities = String(body.responsibilities ?? "").trim().slice(0, 2000);
    const hours = String(body.hours ?? "").trim().slice(0, 200);
    const employmentType = (EMPLOYMENT_TYPES as readonly string[]).includes(body.employment_type) ? body.employment_type : "";
    const missing: string[] = [];
    if (!salaryMin || !salaryMax) missing.push("salary range");
    if (salaryMin && salaryMax && salaryMax < salaryMin) missing.push("salary range (maximum below minimum)");
    if (!responsibilities) missing.push("responsibilities");
    if (!hours) missing.push("working hours");
    if (!employmentType) missing.push("employment type");
    if (!location) missing.push("work location");
    if (body.no_fee_confirmed !== true) missing.push("no-fee confirmation");
    if (missing.length) {
      return NextResponse.json(
        { error: `Please fill in: ${missing.join(", ")}.`, code: "missing", missing },
        { status: 400 },
      );
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }

    const session = await getSession();
    const employerId = session?.role === "employer" ? session.userId : "";

    // Photos and video are stored against the job owner. With no logged-in
    // owner nobody could ever view them, so require an account for these.
    const wanted: Evidence =
      evidence === "photos" || evidence === "video"
        ? evidence
        : evidence === "none"
          ? "none"
          : (DEFAULT_EVIDENCE[category as Category] ?? "none");
    if (wanted !== "none" && !employerId) {
      return NextResponse.json(
        { error: "Log in as an employer to ask for photos or video." },
        { status: 401 },
      );
    }

    // Keep the typed text, but make sure the city is one we can match on.
    const city = resolveCity(String(location ?? ""));
    if (location && !city) {
      return NextResponse.json(
        { error: "Choose a city from the list so candidates can be matched by place." },
        { status: 400 },
      );
    }

    const db = getDb();
    const id = newId();

    const jobTags = tags?.length
      ? tags
      : templateTags(category as Category);

    db.prepare(
      `INSERT INTO jobs (id, title, employer_name, employer_id, location, category, tags, custom_questions, duration_min, ai_scoring, evidence, created_at,
         review_status, responsibilities, salary_min, salary_max, salary_period, hours, employment_type, no_fee_confirmed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 1)`,
    ).run(
      id,
      title,
      employer_name,
      employerId,
      location || "",
      category,
      JSON.stringify(jobTags),
      JSON.stringify(custom_questions || []),
      duration_min || 15,
      ai_scoring !== false ? 1 : 0,
      wanted,
      new Date().toISOString(),
      responsibilities,
      salaryMin,
      salaryMax,
      PERIODS.includes(body.salary_period) ? body.salary_period : "month",
      hours,
      employmentType,
    );

    const job = rowToJob(
      db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as any,
    );

    // Subscribers are told only once the vacancy is approved (admin review).

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post job" },
      { status: 500 },
    );
  }
}
