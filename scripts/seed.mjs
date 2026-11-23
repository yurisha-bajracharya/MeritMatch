/**
 * Seed script: creates demo data in the SQLite database.
 * Run with: node scripts/seed.mjs
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "meritmatch.db");

import fs from "fs";
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT '',
    role TEXT NOT NULL CHECK(role IN ('candidate', 'employer')),
    gender TEXT DEFAULT '',
    region TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    experience_text TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    employer_name TEXT NOT NULL,
    employer_id TEXT DEFAULT '',
    location TEXT DEFAULT '',
    category TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    custom_questions TEXT DEFAULT '',
    duration_min INTEGER DEFAULT 15,
    ai_scoring INTEGER DEFAULT 1,
    verified INTEGER DEFAULT 0,
    verified_at TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT DEFAULT '',
    region TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    language TEXT DEFAULT 'ne',
    input_mode TEXT DEFAULT 'text',
    answers TEXT NOT NULL DEFAULT '[]',
    criteria TEXT NOT NULL DEFAULT '[]',
    total INTEGER DEFAULT 0,
    reason TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    scored_by TEXT DEFAULT 'fallback',
    consent INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    category TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    job_id TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_job_candidate
    ON submissions(job_id, candidate_id);

  CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id, read);

  CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON subscriptions(user_id);

  CREATE INDEX IF NOT EXISTS idx_jobs_created
    ON jobs(created_at);
`);

// Same additive migrations the app runs (lib/db.ts), so the seed works on a
// fresh database and on one created by an older version.
function addColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
addColumn("submissions", "flags", "TEXT DEFAULT '[]'");
addColumn("submissions", "mcq", "TEXT DEFAULT ''");
addColumn("submissions", "mcq_score", "INTEGER");
addColumn("submissions", "written_score", "INTEGER");
addColumn("submissions", "access_token", "TEXT DEFAULT ''");
addColumn("jobs", "evidence", "TEXT DEFAULT 'none'");
addColumn("submissions", "shortlisted", "INTEGER DEFAULT 0");
addColumn("submissions", "shortlisted_at", "TEXT DEFAULT ''");
addColumn("submissions", "rejected", "INTEGER DEFAULT 0");
addColumn("submissions", "interview", "INTEGER DEFAULT 0");
addColumn("submissions", "interview_note", "TEXT DEFAULT ''");
db.exec("CREATE TABLE IF NOT EXISTS unlocks (submission_id TEXT PRIMARY KEY, employer_id TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)");
addColumn("notifications", "link", "TEXT DEFAULT ''");
addColumn("users", "preferred_cities", "TEXT DEFAULT '[]'");
// Verification and vacancy review (mirrors lib/db.ts)
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
if (!cols("jobs").includes("review_status")) {
  db.exec("ALTER TABLE jobs ADD COLUMN review_status TEXT DEFAULT 'pending'");
  db.exec("UPDATE jobs SET review_status = 'approved' WHERE verified = 1");
}
addColumn("jobs", "review_note", "TEXT DEFAULT ''");
addColumn("jobs", "reviewed_at", "TEXT DEFAULT ''");
addColumn("jobs", "responsibilities", "TEXT DEFAULT ''");
addColumn("jobs", "salary_min", "INTEGER");
addColumn("jobs", "salary_max", "INTEGER");
addColumn("jobs", "salary_period", "TEXT DEFAULT 'month'");
addColumn("jobs", "hours", "TEXT DEFAULT ''");
addColumn("jobs", "employment_type", "TEXT DEFAULT ''");
addColumn("jobs", "no_fee_confirmed", "INTEGER DEFAULT 0");
addColumn("users", "restricted", "INTEGER DEFAULT 0");
addColumn("users", "restricted_reason", "TEXT DEFAULT ''");
db.exec(`CREATE TABLE IF NOT EXISTS employer_verifications (
  employer_id TEXT PRIMARY KEY, business_name TEXT DEFAULT '', contact_name TEXT DEFAULT '',
  contact_position TEXT DEFAULT '', email TEXT DEFAULT '', authorized INTEGER DEFAULT 0,
  phone_verified_at TEXT DEFAULT '', otp_hash TEXT DEFAULT '', otp_expires TEXT DEFAULT '',
  otp_attempts INTEGER DEFAULT 0, business_status TEXT DEFAULT 'none', business_note TEXT DEFAULT '',
  presence_status TEXT DEFAULT 'none', presence_note TEXT DEFAULT '', manual_note TEXT DEFAULT '',
  updated_at TEXT NOT NULL)`);
db.exec(`CREATE TABLE IF NOT EXISTS verification_evidence (
  id TEXT PRIMARY KEY, employer_id TEXT NOT NULL, layer TEXT NOT NULL, kind TEXT NOT NULL,
  value TEXT DEFAULT '', file_path TEXT DEFAULT '', mime TEXT DEFAULT '', bytes INTEGER DEFAULT 0,
  created_at TEXT NOT NULL)`);
db.exec(`
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, kind TEXT NOT NULL,
    mime TEXT NOT NULL, bytes INTEGER NOT NULL, path TEXT NOT NULL,
    caption TEXT DEFAULT '', created_at TEXT NOT NULL, expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS evidence_reviews (
    submission_id TEXT NOT NULL, kind TEXT NOT NULL, scores TEXT NOT NULL DEFAULT '{}',
    note TEXT DEFAULT '', reviewed_at TEXT NOT NULL, PRIMARY KEY (submission_id, kind)
  );
  CREATE TABLE IF NOT EXISTS mapper_feedback (
    id TEXT PRIMARY KEY, suggested TEXT NOT NULL DEFAULT '[]',
    kept TEXT NOT NULL DEFAULT '[]', added TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL
  );
`);

const id = () => crypto.randomUUID().slice(0, 8);

// Seeding twice would create a second employer and a second set of jobs.
const already = db.prepare("SELECT id FROM users WHERE phone = ?").get("9800000001");
if (already) {
  console.log("Demo data already present (employer 9800000001). Nothing to do.");
  db.close();
  process.exit(0);
}

// --- Demo employer ---
const employerId = id();
db.prepare(
  `INSERT OR IGNORE INTO users (id, name, phone, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
).run(employerId, "Hari Sharma", "9800000001", "hari@himalmart.com", "employer", new Date().toISOString());

// The demo employer is fully verified so the demo has open jobs. Real
// employers start at "none" and go through review.
db.prepare(
  `INSERT OR IGNORE INTO employer_verifications (employer_id, business_name, contact_name, contact_position, email, authorized, phone_verified_at, business_status, presence_status, updated_at)
   VALUES (?, ?, ?, ?, ?, 1, ?, 'approved', 'approved', ?)`,
).run(employerId, "Himal Group (demo)", "Hari Sharma", "Owner", "hari@himalmart.com", new Date().toISOString(), new Date().toISOString());
db.prepare(
  `INSERT INTO verification_evidence (id, employer_id, layer, kind, value, created_at) VALUES (?, ?, 'business', 'pan', ?, ?), (?, ?, 'presence', 'maps', ?, ?)`,
).run(id(), employerId, "PAN 600000000 (demo)", new Date().toISOString(), id(), employerId, "https://maps.google.com/?q=Kathmandu", new Date().toISOString());

// --- Demo jobs ---
const jobs = [
  {
    id: id(),
    title: "Shop Assistant",
    employer_name: "Himal Mart",
    employer_id: employerId,
    location: "Pokhara",
    category: "retail",
    tags: JSON.stringify(["customer-service", "numeracy", "communication"]),
  },
  {
    id: id(),
    title: "Office Clerk",
    employer_name: "Nepal Trust Bank",
    employer_id: employerId,
    location: "Kathmandu",
    category: "admin",
    tags: JSON.stringify(["accuracy", "data-entry", "organization"]),
  },
  {
    id: id(),
    title: "Hotel Receptionist",
    employer_name: "Mountain View Resort",
    employer_id: employerId,
    location: "Pokhara",
    category: "hospitality",
    tags: JSON.stringify(["customer-service", "communication", "teamwork"]),
  },
  {
    id: id(),
    title: "Delivery Driver",
    employer_name: "FastSewa",
    employer_id: employerId,
    location: "Kathmandu",
    category: "driving",
    tags: JSON.stringify(["driving", "time-management", "communication"]),
  },
  {
    id: id(),
    title: "Primary Teacher",
    employer_name: "Bright Future School",
    employer_id: employerId,
    location: "Bharatpur",
    category: "teaching",
    tags: JSON.stringify(["communication", "organization", "teaching"]),
    evidence: "video",
  },
  {
    id: id(),
    title: "Tailor",
    employer_name: "Patan Boutique",
    employer_id: employerId,
    location: "Lalitpur",
    category: "tailoring",
    tags: JSON.stringify(["tailoring", "accuracy", "customer-service"]),
    evidence: "photos",
  },
];

const insertJob = db.prepare(
  `INSERT OR IGNORE INTO jobs (id, title, employer_name, employer_id, location, category, tags, duration_min, ai_scoring, evidence, created_at, review_status, verified, salary_min, salary_max, salary_period, hours, employment_type, no_fee_confirmed, responsibilities)
   VALUES (?, ?, ?, ?, ?, ?, ?, 15, 1, ?, ?, 'approved', 1, ?, ?, 'month', ?, ?, 1, ?)`,
);

const SALARY = {
  retail: [16000, 20000], admin: [22000, 28000], office: [20000, 25000], hospitality: [18000, 24000],
  teaching: [20000, 26000], driving: [18000, 25000], tailoring: [15000, 22000],
};
for (const j of jobs) {
  const [lo, hi] = SALARY[j.category] ?? [17000, 22000];
  insertJob.run(
    j.id, j.title, j.employer_name, j.employer_id, j.location, j.category, j.tags, j.evidence ?? "none",
    new Date().toISOString(), lo, hi, "Sunday to Friday, 10 am to 6 pm", "full-time",
    "Serve customers, keep records and work with the team. Full training given.",
  );
}

// --- Demo candidates & submissions for first job ---
const firstJobId = jobs[0].id;
const firstNames = ["Sita", "Ram", "Gita", "Krishna", "Mina", "Hari", "Anita", "Bikash", "Sunita", "Prakash"];
const lastNames = ["Gurung", "Tamang", "Thapa", "Rai", "Sherpa", "Magar", "Karki", "Adhikari", "Dahal", "Poudel"];

const insertCandidate = db.prepare(
  `INSERT OR IGNORE INTO candidates (id, name, phone, gender, region) VALUES (?, ?, ?, ?, ?)`,
);

const insertSubmission = db.prepare(
  `INSERT OR IGNORE INTO submissions (id, job_id, candidate_id, language, input_mode, answers, criteria, total, reason, tags, scored_by, mcq, mcq_score, written_score, access_token, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

for (let i = 0; i < 30; i++) {
  const candId = id();
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[Math.floor(i / 3) % lastNames.length];
  const gender = i % 3 === 0 ? "female" : i % 3 === 1 ? "male" : "female";
  const region = i % 4 === 0 ? "rural" : "urban";

  insertCandidate.run(candId, `${firstName} ${lastName}`, `98${String(i).padStart(8, "0")}`, gender, region);

  // Criteria use the real Retail rubric ids, so the employer page and the
  // outcome page show meaningful labels for demo data too.
  const pick = () => Math.floor(Math.random() * 8) + 2;
  const parts = [
    { id: "empathy", score: pick(), max: 10, reason: "Acknowledged the customer" },
    { id: "problem_solving", score: pick(), max: 10, reason: "Offered a workable next step" },
    { id: "numeracy", score: pick(), max: 10, reason: "Total mostly correct" },
    { id: "clarity", score: pick(), max: 10, reason: "Clear and specific" },
  ];
  const written = Math.round((parts.reduce((n, c) => n + c.score, 0) / 40) * 100);
  const correct = Math.floor(Math.random() * 4); // 0..3 of 3
  const mcqScore = Math.round((correct / 3) * 100);
  const total = Math.round(0.3 * mcqScore + 0.7 * written);

  insertSubmission.run(
    id(),
    firstJobId,
    candId,
    i % 2 === 0 ? "ne" : "en",
    "text",
    JSON.stringify([{ scenarioId: "r1", text: "Demo answer " + i }]),
    JSON.stringify(parts),
    total,
    "Demo scored submission",
    JSON.stringify(["customer-service", "numeracy"]),
    "demo",
    JSON.stringify({ answers: [], correct, total: 3 }),
    mcqScore,
    written,
    crypto.randomBytes(12).toString("hex"),
    new Date(Date.now() - i * 3600000).toISOString(),
  );
}

console.log(`Seeded database at ${DB_PATH}`);
console.log(`   - 1 employer (log in with phone 9800000001)`);
console.log(`   - ${jobs.length} jobs`);
console.log(`   - 30 candidates with submissions for "${jobs[0].title}"`);

db.close();
