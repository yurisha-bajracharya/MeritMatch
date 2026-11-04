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

const id = () => crypto.randomUUID().slice(0, 8);

// --- Demo employer ---
const employerId = id();
db.prepare(
  `INSERT OR IGNORE INTO users (id, name, phone, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
).run(employerId, "Hari Sharma", "9800000001", "hari@himalmart.com", "employer", new Date().toISOString());

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
    employer_id: "",
    location: "Kathmandu",
    category: "admin",
    tags: JSON.stringify(["accuracy", "data-entry", "organization"]),
  },
  {
    id: id(),
    title: "Hotel Receptionist",
    employer_name: "Mountain View Resort",
    employer_id: "",
    location: "Pokhara",
    category: "hospitality",
    tags: JSON.stringify(["customer-service", "communication", "teamwork"]),
  },
  {
    id: id(),
    title: "Delivery Driver",
    employer_name: "FastSewa",
    employer_id: "",
    location: "Kathmandu",
    category: "driving",
    tags: JSON.stringify(["driving", "time-management", "communication"]),
  },
  {
    id: id(),
    title: "Primary Teacher",
    employer_name: "Bright Future School",
    employer_id: "",
    location: "Bharatpur",
    category: "teaching",
    tags: JSON.stringify(["communication", "organization", "teaching"]),
  },
];

const insertJob = db.prepare(
  `INSERT OR IGNORE INTO jobs (id, title, employer_name, employer_id, location, category, tags, duration_min, ai_scoring, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, 15, 1, ?)`,
);

for (const j of jobs) {
  insertJob.run(j.id, j.title, j.employer_name, j.employer_id, j.location, j.category, j.tags, new Date().toISOString());
}

// --- Demo candidates & submissions for first job ---
const firstJobId = jobs[0].id;
const firstNames = ["Sita", "Ram", "Gita", "Krishna", "Mina", "Hari", "Anita", "Bikash", "Sunita", "Prakash"];
const lastNames = ["Gurung", "Tamang", "Thapa", "Rai", "Sherpa", "Magar", "Karki", "Adhikari", "Dahal", "Poudel"];

const insertCandidate = db.prepare(
  `INSERT OR IGNORE INTO candidates (id, name, phone, gender, region) VALUES (?, ?, ?, ?, ?)`,
);

const insertSubmission = db.prepare(
  `INSERT OR IGNORE INTO submissions (id, job_id, candidate_id, language, input_mode, answers, criteria, total, reason, tags, scored_by, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

for (let i = 0; i < 30; i++) {
  const candId = id();
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[Math.floor(i / 3) % lastNames.length];
  const gender = i % 3 === 0 ? "female" : i % 3 === 1 ? "male" : "female";
  const region = i % 4 === 0 ? "rural" : "urban";

  insertCandidate.run(candId, `${firstName} ${lastName}`, `98${String(i).padStart(8, "0")}`, gender, region);

  const total = Math.floor(Math.random() * 60) + 30;
  const criteria = JSON.stringify([
    { id: "greeting", score: Math.floor(Math.random() * 8) + 2, max: 10, reason: "Adequate greeting" },
    { id: "product", score: Math.floor(Math.random() * 8) + 2, max: 10, reason: "Covered main points" },
    { id: "close", score: Math.floor(Math.random() * 8) + 2, max: 10, reason: "Reasonable close" },
    { id: "tone", score: Math.floor(Math.random() * 8) + 2, max: 10, reason: "Appropriate tone" },
  ]);

  insertSubmission.run(
    id(),
    firstJobId,
    candId,
    i % 2 === 0 ? "ne" : "en",
    "text",
    JSON.stringify([{ scenarioId: "s1", text: "Demo answer " + i }]),
    criteria,
    total,
    "Demo scored submission",
    JSON.stringify(["customer-service", "numeracy"]),
    "demo",
    new Date(Date.now() - i * 3600000).toISOString(),
  );
}

console.log(`✅ Seeded database at ${DB_PATH}`);
console.log(`   - 1 employer`);
console.log(`   - ${jobs.length} jobs`);
console.log(`   - 30 candidates with submissions for "${jobs[0].title}"`);

db.close();
