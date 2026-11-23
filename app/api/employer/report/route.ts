import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { employerReport } from "@/lib/outcomes";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "employer") return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  return NextResponse.json(employerReport(s.userId));
}
