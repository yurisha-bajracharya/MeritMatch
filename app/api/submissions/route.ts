import { NextResponse } from "next/server";
import { readDb, updateDb, newId } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import { scoreAnswers } from "@/lib/scoring";
import type {
  Answer,
  Candidate,
  Gender,
  InputMode,
  Lang,
  Region,
  Submission,
} from "@/lib/types";

const str = (v: unknown, max: number) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const GENDERS: Gender[] = ["female", "male", "other"];
const REGIONS: Region[] = ["urban", "rural"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const jobId = str(body.jobId, 20);
  const name = str(body.candidate?.name, 80);
  const phone = str(body.candidate?.phone, 20).replace(/[^\d+]/g, "");
  const gender = body.candidate?.gender as Gender;
  const region = body.candidate?.region as Region;
  const language: Lang = body.language === "ne" ? "ne" : "en";
  const inputMode: InputMode = body.inputMode === "voice" ? "voice" : "text";

  if (
    !name ||
    phone.length < 7 ||
    !GENDERS.includes(gender) ||
    !REGIONS.includes(region)
  ) {
    return NextResponse.json(
      { error: "Candidate name, phone, gender and region are required" },
      { status: 400 },
    );
  }

  const job = (await readDb()).jobs.find((j) => j.id === jobId);
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const template = getTemplate(job.category);

  const answers: Answer[] = template.scenarios.map((s) => ({
    scenarioId: s.id,
    text: str(
      body.answers?.find?.(
        (a: { scenarioId?: string }) => a?.scenarioId === s.id,
      )?.text,
      4000,
    ),
  }));
  if (answers.every((a) => !a.text)) {
    return NextResponse.json(
      { error: "At least one answer is required" },
      { status: 400 },
    );
  }

  // Scoring sees only the answers; identity stays in the candidate record.
  const result = await scoreAnswers(template, answers);

  const outcome = await updateDb((db) => {
    let candidate = db.candidates.find((c) => c.phone === phone);
    if (!candidate) {
      candidate = {
        id: newId(),
        name,
        phone,
        gender,
        region,
      } satisfies Candidate;
      db.candidates.push(candidate);
    }
    if (
      db.submissions.some(
        (s) => s.jobId === jobId && s.candidateId === candidate!.id,
      )
    ) {
      return null;
    }
    const submission: Submission = {
      id: newId(),
      jobId,
      candidateId: candidate.id,
      language,
      inputMode,
      answers,
      ...result,
      consent: false,
      createdAt: new Date().toISOString(),
    };
    db.submissions.push(submission);
    return submission.id;
  });

  if (!outcome) {
    return NextResponse.json(
      { error: "You have already submitted for this job" },
      { status: 409 },
    );
  }
  // Scores are not returned: candidates are reviewed blindly and see outcomes later.
  return NextResponse.json({ id: outcome }, { status: 201 });
}
