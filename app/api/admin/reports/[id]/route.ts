import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { REPORT_STATUSES } from "@/lib/reports";
import { audit, notifyUser } from "@/lib/verification";

/**
 * Work on one report. Actions:
 *  status          { status }             New / Under review / ...
 *  request_info    { message }            shown to the reporter on their status page
 *  contact_employer{ message }            sent to the employer (reporter never named)
 *  escalate        { on }                 flag as serious
 *  resolve|dismiss { note }               internal explanation, required
 *  note            { note }               add to the internal notes
 * Suspending the job or restricting the employer uses the job/employer
 * endpoints, so those rules live in one place.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const r = db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const text = String(body.message ?? body.note ?? "").trim().slice(0, 2000);
  const now = new Date().toISOString();
  const addNote = (line: string) =>
    db.prepare("UPDATE reports SET internal_note = ?, updated_at = ? WHERE id = ?").run(
      `${r.internal_note ? `${r.internal_note}\n` : ""}[${now.slice(0, 16).replace("T", " ")}] ${line}`,
      now,
      id,
    );
  const statusLink = `/report/${r.ref}?k=${r.access_token}`;

  switch (body.action) {
    case "status": {
      if (!(REPORT_STATUSES as readonly string[]).includes(body.status)) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }
      if (["resolved", "dismissed"].includes(body.status) && !text) {
        return NextResponse.json({ error: "Write the reason. It stays internal." }, { status: 400 });
      }
      db.prepare("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?").run(body.status, now, id);
      if (text) addNote(`${body.status}: ${text}`);
      audit(`report_${body.status}`, "report", id, text);
      notifyUser(r.reporter_user_id, "report_update", `Update on your report ${r.ref}`, "", statusLink);
      break;
    }
    case "request_info": {
      if (!text) return NextResponse.json({ error: "Write what you need from the reporter." }, { status: 400 });
      db.prepare("UPDATE reports SET status = 'awaiting_info', reporter_message = ?, updated_at = ? WHERE id = ?").run(text, now, id);
      audit("report_info_requested", "report", id, text);
      notifyUser(r.reporter_user_id, "report_update", `We need more information about report ${r.ref}`, text, statusLink);
      break;
    }
    case "contact_employer": {
      if (!text) return NextResponse.json({ error: "Write your question for the employer." }, { status: 400 });
      if (!r.employer_id) return NextResponse.json({ error: "This report has no employer account." }, { status: 400 });
      notifyUser(r.employer_id, "admin_message", "Message from MeritMatch review team", text, "/employer/verify", r.job_id);
      addNote(`Asked employer: ${text}`);
      audit("report_employer_contacted", "report", id, text);
      break;
    }
    case "escalate": {
      const on = body.on !== false;
      db.prepare("UPDATE reports SET escalated = ?, updated_at = ? WHERE id = ?").run(on ? 1 : 0, now, id);
      audit(on ? "report_escalated" : "report_deescalated", "report", id, text);
      if (text) addNote(`${on ? "Escalated" : "De-escalated"}: ${text}`);
      break;
    }
    case "note": {
      if (!text) return NextResponse.json({ error: "Empty note" }, { status: 400 });
      addNote(text);
      audit("report_note", "report", id, text);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
