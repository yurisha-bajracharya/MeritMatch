import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { audit, getVerification, notifyUser } from "@/lib/verification";

/**
 * Admin decisions on an employer:
 *  approve | request_info | reject   (layer: business | presence, message)
 *  restrict | restore                (reason)  - hides all their jobs while restricted
 *  message                           (message) - ask the employer for clarification
 * Every decision is written to the audit log.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employer'").get(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? body.reason ?? "").trim().slice(0, 1000);
  const now = new Date().toISOString();
  getVerification(id);
  const LINK = "/employer/verify";

  switch (body.action) {
    case "approve":
    case "request_info":
    case "reject": {
      const layer = body.layer === "presence" ? "presence" : "business";
      if (body.action !== "approve" && !message) {
        return NextResponse.json({ error: "Write what the employer should do or why." }, { status: 400 });
      }
      const status = { approve: "approved", request_info: "needs_info", reject: "rejected" }[body.action as string];
      db.prepare(`UPDATE employer_verifications SET ${layer}_status = ?, ${layer}_note = ?, updated_at = ? WHERE employer_id = ?`).run(
        status,
        body.action === "approve" ? "" : message,
        now,
        id,
      );
      audit(`${layer}_${status}`, "employer", id, message);
      const label = layer === "business" ? "Business identity" : "Business presence";
      notifyUser(
        id,
        "verification",
        body.action === "approve"
          ? `${label} approved`
          : body.action === "request_info"
            ? `More information needed: ${label.toLowerCase()}`
            : `${label} not accepted`,
        message,
        LINK,
      );
      break;
    }
    case "restrict":
    case "restore": {
      if (!message) return NextResponse.json({ error: "Give a reason. It is kept in the audit log." }, { status: 400 });
      const on = body.action === "restrict";
      db.prepare("UPDATE users SET restricted = ?, restricted_reason = ? WHERE id = ?").run(on ? 1 : 0, on ? message : "", id);
      audit(on ? "employer_restricted" : "employer_restored", "employer", id, message);
      notifyUser(
        id,
        "admin_message",
        on ? "Your account is temporarily restricted" : "Your account has been restored",
        on ? `Your jobs are hidden while we review a concern. ${message}` : message,
        LINK,
      );
      break;
    }
    case "message": {
      if (!message) return NextResponse.json({ error: "Write a message." }, { status: 400 });
      audit("employer_contacted", "employer", id, message);
      notifyUser(id, "admin_message", "Message from MeritMatch review team", message, LINK);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
