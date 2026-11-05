import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { getSession } from "@/lib/auth";
import { notifySubscribers } from "@/lib/notifications";
import { DEFAULT_EVIDENCE, templateTags } from "@/lib/templates";
import { CATEGORIES } from "@/lib/types";
import { resolveCity } from "@/lib/places";
import type { Category, Evidence } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all() as any[];
  const jobs = rows.map(rowToJob);
  return NextResponse.json(jobs);
}

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
      `INSERT INTO jobs (id, title, employer_name, employer_id, location, category, tags, custom_questions, duration_min, ai_scoring, evidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );

    const job = rowToJob(
      db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as any,
    );

    // Notify subscribers in background
    try {
      notifySubscribers(job);
    } catch (err) {
      console.error("Notify error:", err);
    }

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post job" },
      { status: 500 },
    );
  }
}
