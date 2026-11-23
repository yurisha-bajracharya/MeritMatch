# MeritMatch

**Fair hiring through anonymous work-sample tasks. No résumé, no network, just your skills.**

MeritMatch is a skills-first hiring platform for Nepal. Instead of sending a CV, candidates complete a short, job-specific task (about 15 minutes, on a phone). Employers see anonymous candidates ranked by the quality of their work, and a candidate's identity is only revealed after the employer shortlists them, the candidate agrees, and the employer unlocks the contact.

The whole app works in **English and Nepali**.

---

## Contents

- [Why MeritMatch](#why-meritmatch)
- [Features](#features)
- [How scoring works](#how-scoring-works)
- [Employer verification and reporting](#employer-verification-and-reporting)
- [Privacy and safety](#privacy-and-safety)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Demo accounts and data](#demo-accounts-and-data)
- [Useful scripts](#useful-scripts)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Why MeritMatch

In Nepal, many jobs are filled through relatives, referrals and CVs. That shuts out capable people who have no network, no formal job history, or whose experience came from caregiving, farming, a family shop or volunteering. Job boards rank people by CV and degree.

MeritMatch ranks people by what they can actually do:

- Everyone applying to a job does the **same short task**.
- Employers see a **code like #A4F2 and a score**, not a name, gender, region or college.
- The **Experience Mapper** turns everyday experience into workplace skills.

---

## Features

### For job seekers
- **Apply with work, not a CV.** Three choice questions plus a few written answers about real situations in the job. Answers can be typed in Nepali or English, or spoken.
- **Experience Mapper.** Describe what you did in your own words ("I looked after my grandmother and helped in my uncle's shop") and get matching skills plus jobs that fit. Each skill is marked as something you said, something inferred from what you did, or something you added. You can remove or add skills before saving.
- **Transparent results.** A score with a reason for every mark, and a clear explanation of what AI did and did not do.
- **Dashboard.** Skills you described versus skills you **proved** on tasks, matching jobs, preferred cities and job alerts.
- **Notifications** when shortlisted or invited to interview.
- **Consent first.** Your name and phone are only shared when you agree.
- **Report a problem** on any job or employer, free and private.

### For employers
- **Post a job** with salary range, working hours, employment type and responsibilities. You can add your own questions on top of the task template.
- **Ranked, anonymous applicants** with score breakdown, reasons, full answers and an anonymous track record (tasks done on other jobs, average score, proven skills).
- **Honesty notes:** pasted text, unusually fast answers, near-identical answers, and an optional AI-writing check. These are prompts to ask questions, never proof, and they never change the score.
- **Proof of work** (optional): photos of finished work, or a short video from shortlisted people. The employer rates these, and the ratings are kept separate from the score.
- **Shortlist, reject, invite to interview**, with the candidate notified.
- **Unlock contact** after shortlist and candidate consent (mock payment; free for the demo account).
- **Fairness dashboard** comparing women and rural applicants in the pool versus the shortlist.
- **Location matching** across 22 cities.

### For administrators
- Review employer verification evidence and approve, request more information or decline each step.
- Review every new vacancy before it goes live.
- Manage applicant reports: filter, investigate, hide a job, restrict an employer, resolve, restore.
- Full **audit log** of every decision.

---

## How scoring works

The final score is out of 100.

| Part | Weight | Who marks it |
|---|---|---|
| Choice questions | 30% | **No AI.** Fixed answer key; the same answers always get the same mark. |
| Written answers | 70% | **AI-assisted** (Gemini or OpenAI), or keyword rules if no AI is available. |
| Photos / video | 0% | **A person** (the employer). Shown separately, never added to the score. |

**Written answers** are marked against a 4-criterion rubric for each job type (0 to 10 each). For example, Shop Assistant: customer empathy, problem solving, accuracy with numbers, clear communication.

What the AI receives: only the rubric and the answers, with phone numbers, emails and links removed. It never sees name, phone, gender, region or education. It is told to judge substance rather than language or grammar, to ignore instructions hidden inside answers, and to give a reason for every mark. It runs at temperature 0. Invalid output is rejected and the fallback is used.

**Fallback (no AI key or AI unavailable):** a keyword scorer on your own server, based on answer length plus job-specific keywords in English and Nepali. It is a safety net for demos, not a substitute for AI marking.

**Proven skills:** any criterion scored 6/10 or higher earns its skill tags. These appear as "proven on tasks" on the candidate dashboard and in the employer's track-record view.

**Measuring accuracy:** `scripts/calibrate.mjs` compares the app's scores with human marks (rank agreement, average gap, share within 10 points). Accuracy has not been measured on real data yet.

---

## Employer verification and reporting

Verification is in layers. For each step, **one suitable item is enough**, so a small tailoring shop and a large company can both complete it.

| Layer | What the employer gives | How it is checked |
|---|---|---|
| 1. Contact | Mobile number (OTP), contact name and position, "I am authorised" confirmation. Email optional. | Automatic once the OTP is confirmed |
| 2. Business identity | One of: PAN, registration certificate, ward/municipality registration, industry licence, other. Or a request for manual review. | A person reviews it |
| 3. Business presence | One of: photo of shop or signboard, map link, social media page, website, other. | A person reviews it |
| 4. Each job | Title, responsibilities, salary range, location, hours, employment type, no-fee promise | Every new job is reviewed, even from a verified employer |

Uploaded documents are never approved automatically. PAN numbers are not checked against the IRD, and "presence" is never described as a physical inspection.

**Badges** (each explains itself when tapped): Contact Verified, Business Documents Reviewed, Employer Verified, Job Verified. None of them is a guarantee.

**Reporting:** a "Report a problem" button is on every job, every employer page, the task page and the result page, whatever the verification status. Reports are free, never shown publicly, and the employer is never told who reported. The reporter gets a reference number (e.g. `MM-7K4Q2P`) and a private link to check the status.

---

## Privacy and safety

- Candidates are anonymous to employers until **shortlisted + consented + unlocked**.
- No personal details are sent to AI services.
- The session cookie is signed (HMAC).
- Photo metadata (GPS, camera) is removed. Photos are deleted after 180 days and videos after 30 days, or any time on request.
- Verification documents and report attachments are stored outside the public folder and can only be opened by admins.
- Applicants never pay to apply or to complete a task. Every job post must confirm this.

---

## Tech stack

- **Next.js 15** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4**
- **SQLite** via `better-sqlite3`. A single file at `data/meritmatch.db`, created and migrated automatically on start.
- **Gemini** or **OpenAI** for written-answer scoring and the Experience Mapper (optional)
- **Sapling** AI detector for the optional AI-writing check
- Fonts: DM Sans, Lora, Noto Sans Devanagari (Google Fonts)

---

## Getting started

### Requirements
- Node.js 20 or newer
- npm

### Install and run (Windows PowerShell)

```powershell
cd Desktop\MeritMatch
npm install
Copy-Item .env.example .env.local
# open .env.local and add your keys (see below)
node scripts/seed.mjs
npm run dev
```

Open http://localhost:3000

### Install and run (macOS / Linux)

```bash
npm install
cp .env.example .env.local
node scripts/seed.mjs
npm run dev
```

### Production build

```bash
npm run build
npm start
```

With `npm start`, set `OTP_DEMO=1` if you want the on-screen OTP demo mode (see below).

---

## Environment variables

Put these in `.env.local`. All are optional for a local demo.

| Variable | What it does |
|---|---|
| `GEMINI_API_KEY` | Enables AI scoring and AI skill mapping (used first if set) |
| `GEMINI_MODEL` | Gemini model, default `gemini-3.6-flash` |
| `OPENAI_API_KEY` | Alternative AI provider, used if no Gemini key |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `SAPLING_API_KEY` | Turns on the AI-writing check (English answers only, advisory) |
| `AI_DETECT_THRESHOLD` | How sure the detector must be before a note shows (0 to 1, default 0.9) |
| `ADMIN_KEY` | Protects the admin console. **Without it, admin is open in development.** |
| `SESSION_SECRET` | Secret for signing login cookies. Use a long random value in production. |
| `OTP_DEMO` | Set to `1` to show OTP codes on screen when running `npm start` |
| `SMS_PROVIDER_URL` | For a real SMS gateway (not wired yet; see limitations) |
| `FREE_UNLOCK_PHONES` | Comma-separated employer phones that unlock contacts for free. Default `9800000001` |

Never commit `.env.local` or share your keys.

---

## Demo accounts and data

After `node scripts/seed.mjs`:

- **Employer:** log in with phone **9800000001** (fully verified, unlocks contacts for free)
- **6 open jobs** across retail, office, hospitality, teaching, driving and tailoring
- **30 anonymous candidates** who applied to "Shop Assistant"

**Admin console:** http://localhost:3000/admin/verify (enter your `ADMIN_KEY`)

**One phone number = one role.** Use different numbers for the employer and candidate accounts in a demo.

To start again from a clean database:

```powershell
Remove-Item -Recurse -Force data
node scripts/seed.mjs
```

---

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `node scripts/seed.mjs` | Create demo data (safe to run twice) |
| `node scripts/set-role.mjs <phone> <employer\|candidate>` | Fix an account's role |
| `node scripts/calibrate.mjs marks.csv [--ai off]` | Measure scoring accuracy against human marks |

**Checking the database:** open `data/meritmatch.db` with any SQLite viewer (e.g. DB Browser for SQLite or the SQLite extension for VS Code).

---

## Project structure

```
app/
  page.tsx                  Landing page
  jobs/                     Job listing and search
  t/[id]/                   The task (apply) flow
  outcome/[id]/             Candidate result, consent, evidence upload
  dashboard/                Candidate dashboard
  experience-mapper/        Experience Mapper
  signup/                   Sign up and log in
  employer/
    dashboard/              Employer's jobs
    post/                   Post a job
    verify/                 Employer verification
    jobs/[id]/              Ranked applicants (+ /bias fairness page)
  employers/[id]/           Public employer page
  report/[ref]/             Report status page
  admin/verify/             Admin console
  api/                      API routes
components/                 UI components
lib/
  scoring.ts                AI and fallback scoring
  mcq.ts, mcq-bank.ts       Choice questions (30%)
  templates.ts              Task templates and rubrics per job type
  translator.ts             Experience Mapper logic
  tags.ts                   Skill list and aliases
  integrity.ts, aidetect.ts Honesty notes and AI-writing check
  shortlist.ts              Ranking, track record, reveal rules
  verification.ts           Employer verification, OTP, private files
  job-review.ts, reports.ts Vacancy review and reporting
  db.ts                     Database setup and migrations
scripts/                    seed, set-role, calibrate
data/                       SQLite database and private uploads (not committed)
```

---

## Known limitations

- **SMS is not connected.** OTP codes are generated and checked properly but are shown on screen (demo mode) instead of being texted.
- **Payment is a mock.** "Unlock contact" records an amount but charges nothing.
- **Scoring accuracy is unmeasured.** Use `scripts/calibrate.mjs` with human-marked answers before relying on scores.
- **The keyword fallback is weak.** It rewards length and keywords, not understanding. Use an AI key for real use.
- **AI-writing detection is unreliable** for people writing in a second language. It is advisory only and skipped for Nepali.
- **Reporters can't upload more information** to an existing report yet; they send a new report with the reference.
- **Interview and hire outcomes are not tracked yet**, so the fairness dashboard stops at the shortlist.
- **SQLite on one server.** Fine for a prototype; move to PostgreSQL and object storage for production. Do not deploy on hosts that wipe the disk on redeploy.
- **Fonts load from Google Fonts.** Offline, the app falls back to system fonts.

---

## Roadmap

- Real SMS gateway for OTP and notifications
- Payment integration for contact unlocks (e.g. eSewa / Khalti)
- Show which scorer marked each applicant, and allow re-scoring with AI
- Interview scorecards and hire follow-ups at 30/60/90 days
- Calibration study with Nepali employers
- Partnerships with Employment Service Centres and NGOs for distribution

---

## License

Prototype built for a hackathon. All rights reserved by the MeritMatch team unless stated otherwise.