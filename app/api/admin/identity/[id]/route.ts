import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { deleteIdFiles, getIdentity } from "@/lib/identity";
import { audit, notifyUser } from "@/lib/verification";

/**
 * approve | reject | request_info. Approve and reject delete the ID images
 * straight away; only the result is kept. Asking for more keeps them so the
 * candidate can see what to fix, until they upload again.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = getIdentity(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 600);
  const status = { approve: "approved", reject: "rejected", request_info: "needs_info" }[body.action as string];
  if (!status) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (status !== "approved" && !message) {
    return NextResponse.json({ error: "Tell the person what is wrong or what to send." }, { status: 400 });
  }

  const final = status === "approved" || status === "rejected";
  if (final) deleteIdFiles(row);
  getDb()
    .prepare(
      `UPDATE identity_verifications SET status = ?, note = ?, reviewed_at = ?,
         front_path = CASE WHEN ? THEN '' ELSE front_path END,
         back_path = CASE WHEN ? THEN '' ELSE back_path END,
         name_on_doc = CASE WHEN ? THEN '' ELSE name_on_doc END
       WHERE user_id = ?`,
    )
    .run(status, message, new Date().toISOString(), final ? 1 : 0, final ? 1 : 0, final ? 1 : 0, id);
  audit(`id_${status}`, "candidate", id, message);
  notifyUser(
    id,
    "verification",
    status === "approved" ? "Your ID is verified" : status === "rejected" ? "Your ID could not be verified" : "We need a clearer photo of your ID",
    message,
    "/dashboard#identity",
  );
  return NextResponse.json({ ok: true, status, files_deleted: final });
}
