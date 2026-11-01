import { NextResponse } from "next/server";
import { readDb, updateDb, newId } from "@/lib/store";
import { templateTags } from "@/lib/templates";
import { CATEGORIES, type Category, type Job } from "@/lib/types";

const str = (v: unknown, max: number) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ jobs: db.jobs });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const title = str(body?.title, 80);
  const employer = str(body?.employer, 80);
  const location = str(body?.location, 80);
  const category = body?.category as Category;

  if (!title || !employer || !CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "title, employer and a valid category are required" },
      { status: 400 },
    );
  }

  const job: Job = {
    id: newId(),
    title,
    employer,
    location,
    category,
    tags: templateTags(category),
    verified: false,
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    db.jobs.push(job);
  });
  return NextResponse.json({ job }, { status: 201 });
}
