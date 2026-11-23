import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CHECKIN_DAYS, checkinsFor, demoTools, getHire, summarize, type HireRow } from "@/lib/hires";
import { minimumWage, MIN_WAGE_EFFECTIVE } from "@/lib/wage";
import { audit, notifyUser } from "@/lib/verification";

type Viewer = "employer" | "worker";

/** Who is asking: the hiring employer, or the worker (account or secret link). */
async function viewerFor(req: Request, h: HireRow): Promise<Viewer | null> {
  const session = await getSession();
  if (session?.role === "employer" && session.userId === h.employer_id) return "employer";
  const db = getDb();
  if (session?.role === "candidate") {
    const u = db.prepare("SELECT phone FROM users WHERE id = ?").get(session.userId) as { phone: string } | undefined;
    if (u?.phone === h.worker_phone) return "worker";
  }
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const tok = (db.prepare("SELECT access_token FROM submissions WHERE id = ?").get(h.submission_id) as { access_token: string } | undefined)?.access_token ?? "";
  if (k && tok && k.length === tok.length && timingSafeEqual(Buffer.from(k), Buffer.from(tok))) return "worker";
  return null;
}

function view(h: HireRow, who: Viewer) {
  const db = getDb();
  const extra = db
    .prepare(
      `SELECT j.title AS job_title, j.location, COALESCE(v.business_name, j.employer_name) AS business_name,
              COALESCE(v.contact_name, '') AS contact_name, COALESCE(v.contact_position, '') AS contact_position,
              c.name AS worker_name
         FROM hires h JOIN jobs j ON j.id = h.job_id
         JOIN submissions s ON s.id = h.submission_id JOIN candidates c ON c.id = s.candidate_id
         LEFT JOIN employer_verifications v ON v.employer_id = h.employer_id WHERE h.id = ?`,
    )
    .get(h.id) as any;
  const cks = checkinsFor(h.id);
  const now = Date.now();
  const summary: Partial<ReturnType<typeof summarize>> = summarize(h, cks);
  if (who === "employer") {
    // Pay and the worker's own rating are for MeritMatch and the worker only.
    delete summary.paid_on_time;
    delete summary.worker_rating;
  } else {
    delete summary.employer_rating;
  }
  return {
    viewer: who,
    hire: h,
    ...extra,
    summary,
    minimum_wage: minimumWage(h.salary_period, h.employment_type === "part-time"),
    minimum_wage_effective: MIN_WAGE_EFFECTIVE,
    demo_tools: demoTools(),
    // Each side sees its own check-ins. The worker's answers about pay and
    // how the job is going are NEVER shown to the employer (to protect them);
    // only the letter and SSF confirmations are, in the summary.
    checkins: cks
      .filter((c) => c.respondent === who)
      .map((c) => ({ ...c, due: new Date(c.due_at).getTime() <= now })),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = getHire(id);
  if (!h) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const who = await viewerFor(req, h);
  if (!who) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(view(h, who));
}

const yn = (v: unknown) => (v === true || v === 1 || v === "yes" ? 1 : v === false || v === 0 || v === "no" ? 0 : null);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = getHire(id);
  if (!h) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const who = await viewerFor(req, h);
  if (!who) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const db = getDb();
  const now = new Date().toISOString();
  const workerUser = db.prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'").get(h.worker_phone) as { id: string } | undefined;

  switch (body.action) {
    case "issue_letter":
      if (who !== "employer") return NextResponse.json({ error: "Only the employer can issue the letter" }, { status: 403 });
      db.prepare("UPDATE hires SET letter_issued_at = ? WHERE id = ?").run(now, id);
      audit("letter_issued", "hire", id, "", "employer");
      if (workerUser) notifyUser(workerUser.id, "hired", `Appointment letter issued: ${h.position}`, "Please read it and confirm you received it.", `/hire/${id}`, h.job_id);
      break;
    case "confirm_letter":
      if (who !== "worker") return NextResponse.json({ error: "Only the worker can confirm" }, { status: 403 });
      if (!h.letter_issued_at) return NextResponse.json({ error: "The employer has not issued the letter yet." }, { status: 400 });
      db.prepare("UPDATE hires SET letter_confirmed_at = ? WHERE id = ?").run(now, id);
      audit("letter_confirmed", "hire", id, "", "worker");
      break;
    case "ssf_enrolled":
      if (who !== "employer") return NextResponse.json({ error: "Only the employer can report this" }, { status: 403 });
      db.prepare("UPDATE hires SET ssf_reported_at = ? WHERE id = ?").run(body.on === false ? "" : now, id);
      audit(body.on === false ? "ssf_unreported" : "ssf_reported", "hire", id, "", "employer");
      break;
    case "checkin": {
      const day = Number(body.day);
      if (!(CHECKIN_DAYS as readonly number[]).includes(day)) return NextResponse.json({ error: "Unknown check-in" }, { status: 400 });
      const c = db.prepare("SELECT * FROM checkins WHERE hire_id = ? AND day = ? AND respondent = ?").get(id, day, who) as any;
      if (!c) return NextResponse.json({ error: "Unknown check-in" }, { status: 400 });
      if (new Date(c.due_at).getTime() > Date.now()) return NextResponse.json({ error: "This check-in is not due yet." }, { status: 400 });
      const still = yn(body.still_employed);
      if (still === null) return NextResponse.json({ error: "Please answer whether the job continues." }, { status: 400 });
      const rating = Number(body.rating);
      db.prepare(
        "UPDATE checkins SET answered_at = ?, still_employed = ?, has_letter = ?, ssf = ?, paid_on_time = ?, rating = ?, note = ? WHERE id = ?",
      ).run(
        now,
        still,
        who === "worker" ? yn(body.has_letter) : null,
        who === "worker" ? yn(body.ssf) : null,
        who === "worker" ? yn(body.paid_on_time) : null,
        rating >= 1 && rating <= 5 ? Math.round(rating) : null,
        String(body.note ?? "").trim().slice(0, 500),
        c.id,
      );
      if (!still) {
        db.prepare("UPDATE hires SET status = 'ended', ended_at = ?, end_reason = ? WHERE id = ? AND status = 'active'").run(
          now,
          `${who} said the job ended (${day}-day check-in)`,
          id,
        );
      }
      audit(`checkin_${day}_${who}`, "hire", id, still ? "still employed" : "not employed", who);
      break;
    }
    case "demo_advance": {
      // Demo only: move the start date 30 days earlier so the next check-in is due.
      if (!demoTools()) return NextResponse.json({ error: "Not available" }, { status: 403 });
      const back = (iso: string) => new Date(new Date(iso).getTime() - 30 * 86_400_000).toISOString();
      db.prepare("UPDATE hires SET start_date = ? WHERE id = ?").run(back(h.start_date), id);
      for (const c of checkinsFor(id)) db.prepare("UPDATE checkins SET due_at = ? WHERE id = ?").run(back(c.due_at), c.id);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json(view(getHire(id)!, who));
}
