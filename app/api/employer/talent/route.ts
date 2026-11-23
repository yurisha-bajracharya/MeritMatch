import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchPool } from "@/lib/talent";
import { isPublicJob } from "@/lib/verification";

/** Talent search for employers: anonymous people who joined the pool. */
export async function GET(req: Request) {
  const s = await getSession();
  if (s?.role !== "employer") return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  const skill = new URL(req.url).searchParams.get("skill") ?? "";
  const jobs = (getDb().prepare("SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC").all(s.userId) as any[])
    .filter(isPublicJob)
    .map((j) => ({ id: j.id, title: j.title, category: j.category }));
  return NextResponse.json({ people: searchPool(s.userId, skill), jobs });
}
