import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { TAG_LABELS } from "@/lib/tags";
import { audit, notifyUser } from "@/lib/verification";

/** accept | reject a skill photo (a person's decision; overrides the AI). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = getDb().prepare("SELECT user_id, tag FROM skill_evidence WHERE id = ?").get(id) as { user_id: string; tag: string } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 500);
  if (body.action !== "accept" && body.action !== "reject") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (body.action === "reject" && !message) return NextResponse.json({ error: "Tell the person why, so they can try again." }, { status: 400 });
  const status = body.action === "accept" ? "reviewed" : "rejected";
  getDb().prepare("UPDATE skill_evidence SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?").run(status, message, new Date().toISOString(), id);
  audit(`skill_photo_${status}`, "candidate", row.user_id, `${row.tag}${message ? `: ${message}` : ""}`);
  const label = TAG_LABELS[row.tag]?.en ?? row.tag;
  notifyUser(
    row.user_id,
    status === "reviewed" ? "skill_photo_ok" : "skill_photo_no",
    status === "reviewed" ? `Your ${label} photo was accepted` : `Your ${label} photo was not accepted`,
    message,
    "/dashboard#skills",
  );
  return NextResponse.json({ ok: true, status });
}
