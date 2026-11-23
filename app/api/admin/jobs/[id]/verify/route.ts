import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { reviewJob } from "@/lib/job-review";

/** Older endpoint, kept working: verified=true approves, false suspends. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const verified = Boolean(body.verified);
  const r = reviewJob(id, verified ? "approve" : "suspend", verified ? "" : "Verification revoked by admin");
  return "error" in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true, verified });
}
