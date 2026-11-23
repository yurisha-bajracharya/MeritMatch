import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, newId } from "@/lib/db";
import { INVITES_PER_DAY, phonesForIds } from "@/lib/talent";
import { audit, isPublicJob, notifyUser } from "@/lib/verification";

/**
 * Invite selected people from the talent pool to a job's work test. Each gets
 * an in-app notification with the task link. Names and phones stay hidden.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "employer") return NextResponse.json({ error: "Log in as an employer" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 200) : [];
  const message = String(body.message ?? "").replace(/\s+/g, " ").trim().slice(0, 400);
  const db = getDb();
  const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND employer_id = ?").get(String(body.job_id ?? ""), s.userId) as any;
  if (!job || !isPublicJob(job)) return NextResponse.json({ error: "Pick one of your open jobs." }, { status: 400 });
  if (!ids.length) return NextResponse.json({ error: "Select at least one person." }, { status: 400 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const today = (db.prepare("SELECT COUNT(*) AS n FROM talent_invites WHERE employer_id = ? AND created_at > ?").get(s.userId, since) as any).n;
  const room = Math.max(0, INVITES_PER_DAY - today);
  if (room === 0) return NextResponse.json({ error: `Limit reached: ${INVITES_PER_DAY} invitations a day.`, code: "limit" }, { status: 429 });

  const phones = phonesForIds(ids);
  const employer =
    (db.prepare("SELECT business_name FROM employer_verifications WHERE employer_id = ?").get(s.userId) as any)?.business_name ||
    (db.prepare("SELECT name FROM users WHERE id = ?").get(s.userId) as any)?.name ||
    "An employer";
  let sent = 0, already = 0, unreachable = 0, skipped = 0;
  const now = new Date().toISOString();
  for (const id of ids) {
    const phone = phones.get(id);
    if (!phone) { skipped++; continue; }
    if (sent >= room) { skipped++; continue; }
    const applied = db
      .prepare("SELECT 1 FROM submissions s JOIN candidates c ON c.id = s.candidate_id WHERE s.job_id = ? AND c.phone = ?")
      .get(job.id, phone);
    if (applied || db.prepare("SELECT 1 FROM talent_invites WHERE job_id = ? AND phone = ?").get(job.id, phone)) { already++; continue; }
    const user = db.prepare("SELECT id FROM users WHERE phone = ? AND role = 'candidate'").get(phone) as { id: string } | undefined;
    if (!user) { unreachable++; continue; }
    const inviteId = newId() + newId();
    db.prepare("INSERT INTO talent_invites (id, employer_id, job_id, phone, message, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      inviteId, s.userId, job.id, phone, message, now,
    );
    notifyUser(user.id, "talent_invite", `${employer}|${job.title}`, message, `/t/${job.id}?invite=${inviteId}`, job.id);
    sent++;
  }
  audit("talent_invites_sent", "job", job.id, `sent ${sent}`, s.userId);
  return NextResponse.json({ sent, already, unreachable, skipped });
}
