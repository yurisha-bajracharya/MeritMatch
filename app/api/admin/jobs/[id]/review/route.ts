import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { reviewJob, type ReviewAction } from "@/lib/job-review";

const ACTIONS: ReviewAction[] = ["approve", "request_info", "reject", "suspend", "restore"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!ACTIONS.includes(body.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const r = reviewJob(id, body.action, String(body.note ?? "").trim().slice(0, 1000));
  return "error" in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
}
