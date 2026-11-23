// Demo data for a capacity-building nonprofit and its trainees' job outcomes.
// Run after the main seed:   node scripts/seed.mjs   then   node scripts/seed-org.mjs
// Safe to run twice (it does nothing if the demo organisation already exists).
//
// Everything here is MADE UP for the demo: "Sabal Women's Skills Centre" is a
// fictional organisation and all trainees are fictional people.
import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

const db = new Database(path.join(process.cwd(), "data", "meritmatch.db"));
db.pragma("foreign_keys = ON");
const id = () => randomBytes(8).toString("hex");
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
const addColumn = (t, c, def) => {
  if (!cols(t).includes(c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`);
};

// Tables this script needs (the app creates the same ones on start).
addColumn("users", "org_id", "TEXT DEFAULT ''");
addColumn("users", "org_consent_at", "TEXT DEFAULT ''");
addColumn("submissions", "shortlisted", "INTEGER DEFAULT 0");
addColumn("submissions", "interview", "INTEGER DEFAULT 0");
addColumn("submissions", "access_token", "TEXT DEFAULT ''");
db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'nonprofit',
    code TEXT UNIQUE NOT NULL, access_key TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS unlocks (submission_id TEXT PRIMARY KEY, employer_id TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS hires (id TEXT PRIMARY KEY, submission_id TEXT UNIQUE NOT NULL, job_id TEXT NOT NULL, employer_id TEXT NOT NULL,
    worker_phone TEXT NOT NULL, position TEXT NOT NULL, start_date TEXT NOT NULL, salary INTEGER NOT NULL, salary_period TEXT NOT NULL DEFAULT 'month',
    employment_type TEXT DEFAULT '', hours TEXT DEFAULT '', probation_months INTEGER DEFAULT 0, duties TEXT DEFAULT '',
    letter_issued_at TEXT DEFAULT '', letter_confirmed_at TEXT DEFAULT '', ssf_reported_at TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active', ended_at TEXT DEFAULT '', end_reason TEXT DEFAULT '', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS checkins (id TEXT PRIMARY KEY, hire_id TEXT NOT NULL, day INTEGER NOT NULL, respondent TEXT NOT NULL,
    due_at TEXT NOT NULL, notified_at TEXT DEFAULT '', answered_at TEXT DEFAULT '', still_employed INTEGER, has_letter INTEGER,
    ssf INTEGER, paid_on_time INTEGER, rating INTEGER, note TEXT DEFAULT '', UNIQUE(hire_id, day, respondent));
`);

const CODE = "SABAL";
const KEY = "sabal-demo-key";
if (db.prepare("SELECT 1 FROM organizations WHERE code = ?").get(CODE)) {
  console.log(`Demo organisation already present. Open: http://localhost:3000/org/${CODE}?k=${KEY}`);
  process.exit(0);
}

const employer = db.prepare("SELECT id FROM users WHERE phone = '9800000001'").get();
if (!employer) {
  console.error("Run node scripts/seed.mjs first (the demo employer 9800000001 is missing).");
  process.exit(1);
}
const jobs = db.prepare("SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at").all(employer.id);
if (!jobs.length) {
  console.error("No demo jobs found. Run node scripts/seed.mjs first.");
  process.exit(1);
}

const now = Date.now();
const DAY = 86_400_000;
const iso = (msAgo) => new Date(now - msAgo).toISOString();
const orgId = id();
db.prepare("INSERT INTO organizations (id, name, kind, code, access_key, created_at) VALUES (?, ?, 'nonprofit', ?, ?, ?)").run(
  orgId,
  "Sabal Women's Skills Centre (demo)",
  CODE,
  KEY,
  iso(200 * DAY),
);

// 14 fictional trainees. outcome: what happened after their task.
const TRAINEES = [
  { name: "Sunita Maharjan", score: 86, tags: ["communication", "digital-literacy", "customer-service"], outcome: { hiredDaysAgo: 120, ssfFrom: 30, letter: true } },
  { name: "Kamala Tamang", score: 81, tags: ["customer-service", "numeracy"], outcome: { hiredDaysAgo: 100, ssfFrom: 60, letter: true } },
  { name: "Rita Chaudhary", score: 77, tags: ["organization", "data-entry", "accuracy"], outcome: { hiredDaysAgo: 75, ssfFrom: null, letter: true } },
  { name: "Mina Gurung", score: 74, tags: ["tailoring", "accuracy"], outcome: { hiredDaysAgo: 40, ssfFrom: null, letter: false } },
  { name: "Puja Sah", score: 72, tags: ["customer-service", "teamwork"], outcome: { hiredDaysAgo: 100, leftAt: 60, ssfFrom: null, letter: true } },
  { name: "Asha Rai", score: 79, tags: ["communication", "teamwork"], outcome: { hiredDaysAgo: 130, ssfFrom: 30, letter: true } },
  { name: "Gita Magar", score: 69, tags: ["numeracy"], outcome: "interview" },
  { name: "Laxmi Thapa", score: 66, tags: ["customer-service"], outcome: "shortlisted" },
  { name: "Sarita BK", score: 71, tags: ["organization", "communication"], outcome: "shortlisted" },
  { name: "Bina Shrestha", score: 58, tags: ["communication"], outcome: "applied" },
  { name: "Durga KC", score: 54, tags: [], outcome: "applied" },
  { name: "Nirmala Yadav", score: 62, tags: ["numeracy"], outcome: "applied" },
  { name: "Sabina Lama", score: null, tags: [], outcome: "none" },
  { name: "Anjali Karki", score: null, tags: [], outcome: "none" },
];

const insUser = db.prepare(
  "INSERT INTO users (id, name, phone, role, gender, region, skills, created_at, org_id, org_consent_at) VALUES (?, ?, ?, 'candidate', 'female', ?, ?, ?, ?, ?)",
);
const insCand = db.prepare("INSERT INTO candidates (id, name, phone, gender, region) VALUES (?, ?, ?, 'female', ?)");
const insSub = db.prepare(
  `INSERT INTO submissions (id, job_id, candidate_id, language, input_mode, answers, criteria, total, reason, tags, scored_by, consent, shortlisted, interview, access_token, created_at)
   VALUES (?, ?, ?, 'ne', 'text', '[]', '[]', ?, ?, ?, 'demo', ?, ?, ?, ?, ?)`,
);
const insHire = db.prepare(
  `INSERT INTO hires (id, submission_id, job_id, employer_id, worker_phone, position, start_date, salary, salary_period, employment_type, hours, probation_months, duties,
     letter_issued_at, letter_confirmed_at, ssf_reported_at, status, ended_at, end_reason, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'month', 'full-time', ?, 3, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insCheck = db.prepare(
  `INSERT INTO checkins (id, hire_id, day, respondent, due_at, answered_at, still_employed, has_letter, ssf, paid_on_time, rating)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

let hires = 0;
TRAINEES.forEach((t, i) => {
  const phone = `98199${String(100000 + i).slice(1)}`;
  const userId = id();
  insUser.run(userId, t.name, phone, i % 3 === 0 ? "rural" : "urban", JSON.stringify(t.tags), iso(190 * DAY), orgId, iso(180 * DAY));
  if (t.score === null) return;

  const job = jobs[i % jobs.length];
  const candId = id();
  insCand.run(candId, t.name, phone, i % 3 === 0 ? "rural" : "urban");
  const o = t.outcome;
  const hired = typeof o === "object";
  const shortlisted = hired || o === "interview" || o === "shortlisted";
  const subId = id();
  const appliedAgo = hired ? o.hiredDaysAgo + 15 : 20;
  insSub.run(
    subId, job.id, candId, t.score, "Demo submission", JSON.stringify(t.tags),
    shortlisted ? 1 : 0, shortlisted ? 1 : 0, hired || o === "interview" ? 1 : 0, randomBytes(12).toString("hex"), iso(appliedAgo * DAY),
  );
  if (!hired) return;

  db.prepare("INSERT OR IGNORE INTO unlocks (submission_id, employer_id, amount, created_at) VALUES (?, ?, 0, ?)").run(subId, employer.id, iso((o.hiredDaysAgo + 5) * DAY));
  const start = now - o.hiredDaysAgo * DAY;
  const left = o.leftAt ?? null;
  const hireId = id();
  insHire.run(
    hireId, subId, job.id, employer.id, phone, job.title, new Date(start).toISOString(),
    Math.max(job.salary_max ?? 20000, 19550), job.hours || "Sunday to Friday, 10 am to 6 pm", job.responsibilities || "",
    o.letter ? new Date(start).toISOString() : "", o.letter ? new Date(start + 2 * DAY).toISOString() : "",
    o.ssfFrom ? new Date(start + (o.ssfFrom - 5) * DAY).toISOString() : "",
    left ? "ended" : "active", left ? new Date(start + left * DAY).toISOString() : "", left ? "Worker left (demo)" : "", new Date(start).toISOString(),
  );
  hires++;
  for (const day of [30, 60, 90]) {
    const due = start + day * DAY;
    for (const who of ["worker", "employer"]) {
      const answered = due <= now && (!left || day <= left);
      const employed = left && day >= left ? 0 : 1;
      insCheck.run(
        id(), hireId, day, who, new Date(due).toISOString(), answered ? new Date(due + DAY).toISOString() : "",
        answered ? employed : null,
        answered && who === "worker" ? (o.letter ? 1 : 0) : null,
        answered && who === "worker" ? (o.ssfFrom && day >= o.ssfFrom ? 1 : 0) : null,
        answered && who === "worker" ? (i === 2 ? 0 : 1) : null,
        answered ? 4 : null,
      );
    }
  }
});

console.log(`Seeded demo nonprofit "Sabal Women's Skills Centre (demo)" with ${TRAINEES.length} trainees and ${hires} hires.`);
console.log(`  Organisation report:   http://localhost:3000/org/${CODE}?k=${KEY}`);
console.log(`  Trainee sign-up link:  http://localhost:3000/signup?org=${CODE}`);
console.log(`  Employer report:       log in as 9800000001, then My jobs -> Formalisation report`);
