import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getTemplate } from "@/lib/templates";
import { scoreAnswers } from "@/lib/scoring";
import { rowToJob } from "@/lib/shortlist";
import type { Answer, Lang, InputMode, Gender, Region } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      job_id,
      language = "ne",
      input_mode = "text",
      answers = [],
      candidate_name = "",
      candidate_phone = "",
      candidate_gender = "",
      candidate_region = "",
    } = body;

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const db = getDb();
    const jobRow = db.prepare("SELECT * FROM jobs WHERE id = ?").get(job_id) as any;
    if (!jobRow) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = rowToJob(jobRow);
    const template = getTemplate(job.category);

    // Upsert candidate
    let candidateId: string;
    if (candidate_phone) {
      const existing = db
        .prepare("SELECT id FROM candidates WHERE phone = ?")
        .get(candidate_phone) as any;
      if (existing) {
        candidateId = existing.id;
        db.prepare("UPDATE candidates SET name = ?, gender = ?, region = ? WHERE id = ?")
          .run(candidate_name, candidate_gender, candidate_region, candidateId);
      } else {
        candidateId = newId();
        db.prepare(
          "INSERT INTO candidates (id, name, phone, gender, region) VALUES (?, ?, ?, ?, ?)",
        ).run(candidateId, candidate_name, candidate_phone, candidate_gender, candidate_region);
      }
    } else {
      candidateId = newId();
      db.prepare(
        "INSERT INTO candidates (id, name, phone, gender, region) VALUES (?, ?, ?, ?, ?)",
      ).run(candidateId, candidate_name, `anon-${candidateId}`, candidate_gender, candidate_region);
    }

    // Check for duplicate submission
    const existing = db
      .prepare("SELECT id FROM submissions WHERE job_id = ? AND candidate_id = ?")
      .get(job_id, candidateId) as any;
    if (existing) {
      return NextResponse.json(
        { error: "Already submitted", submissionId: existing.id },
        { status: 409 },
      );
    }

    // Score answers
    const useAI = job.ai_scoring;
    const result = await scoreAnswers(template, answers as Answer[], useAI);

    const subId = newId();
    db.prepare(
      `INSERT INTO submissions (id, job_id, candidate_id, language, input_mode, answers, criteria, total, reason, tags, scored_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      subId,
      job_id,
      candidateId,
      language,
      input_mode,
      JSON.stringify(answers),
      JSON.stringify(result.criteria),
      result.total,
      result.reason,
      JSON.stringify(result.tags),
      result.scoredBy,
      new Date().toISOString(),
    );

    return NextResponse.json(
      {
        submissionId: subId,
        total: result.total,
        reason: result.reason,
        scoredBy: result.scoredBy,
        criteria: result.criteria,
        tags: result.tags,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/submissions error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 },
    );
  }
}
