// Writes a demo job with synthetic applicants to data/store.json. Run: npm run seed
import { mkdirSync, writeFileSync } from "node:fs";

const FILE = "data/store.json";

// Small seeded PRNG so the demo is the same every run.
let s = 20260502;
const rand = () => {
  s = (s * 1664525 + 1013904223) % 4294967296;
  return s / 4294967296;
};
const pick = (a) => a[Math.floor(rand() * a.length)];
const hex = () =>
  Math.floor(rand() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");

const female = [
  "Sita Gurung",
  "Anita Tamang",
  "Sunita Rai",
  "Mina Thapa",
  "Kamala Magar",
  "Rita Shrestha",
  "Laxmi Karki",
  "Gita Adhikari",
  "Binita Limbu",
  "Sarita Chaudhary",
  "Pooja Sherpa",
  "Radha Bhandari",
  "Anju Pun",
];
const male = [
  "Ram Thapa",
  "Hari KC",
  "Bikash Rana",
  "Suresh Poudel",
  "Dipak Oli",
  "Nabin Basnet",
  "Prakash Dahal",
  "Sanjay Yadav",
  "Kiran Tamang",
  "Anil Gurung",
  "Rajesh Karki",
];

const job = {
  id: "demo0001",
  title: "Shop assistant",
  employer: "Himal Mart",
  location: "Pokhara",
  category: "retail",
  tags: [
    "customer-service",
    "communication",
    "problem-solving",
    "time-management",
    "numeracy",
    "accuracy",
  ],
  verified: true,
  createdAt: new Date().toISOString(),
};

const criteria = [
  { id: "empathy", max: 10, tags: ["customer-service", "communication"] },
  {
    id: "problem_solving",
    max: 10,
    tags: ["problem-solving", "time-management"],
  },
  { id: "numeracy", max: 10, tags: ["numeracy", "accuracy"] },
  { id: "clarity", max: 10, tags: ["communication"] },
];

const reasonFor = {
  empathy: "Calm and apologetic with the upset customer",
  problem_solving: "Offers an exchange and calls the manager",
  numeracy: "Gets the Rs 3,000 total with clear working",
  clarity: "Short, clear and specific answers",
};

const candidates = [];
const submissions = [];

for (let i = 0; i < 60; i++) {
  const woman = rand() < 0.55;
  const rural = rand() < 0.45;
  const candidate = {
    id: `c${hex().slice(0, 6)}`,
    name: pick(woman ? female : male),
    phone: `98${Math.floor(10000000 + rand() * 89999999)}`,
    gender: woman ? "female" : "male",
    region: rural ? "rural" : "urban",
  };
  candidates.push(candidate);

  // Scores depend on the task answers only, never on gender or region.
  const ability = 3 + rand() * 6;
  const scored = criteria.map((c) => {
    const score = Math.max(
      0,
      Math.min(c.max, Math.round(ability + (rand() - 0.5) * 4)),
    );
    return { id: c.id, max: c.max, score, reason: reasonFor[c.id] };
  });
  const best = [...scored].sort((a, b) => b.score - a.score)[0];
  const total = Math.round(
    (scored.reduce((n, c) => n + c.score, 0) / 40) * 100,
  );
  const tags = [
    ...new Set(
      criteria
        .filter((c) => scored.find((x) => x.id === c.id).score >= 6)
        .flatMap((c) => c.tags),
    ),
  ];

  submissions.push({
    id: hex(),
    jobId: job.id,
    candidateId: candidate.id,
    language: rand() < 0.6 ? "ne" : "en",
    inputMode: rand() < 0.3 ? "voice" : "text",
    answers: [],
    criteria: scored,
    total,
    reason: reasonFor[best.id],
    tags,
    scoredBy: "demo",
    consent: rand() < 0.3,
    createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
  });
}

mkdirSync("data", { recursive: true });
writeFileSync(
  FILE,
  JSON.stringify({ jobs: [job], candidates, submissions }, null, 2),
);
console.log(
  `Seeded ${submissions.length} applicants. Open /employer/jobs/${job.id}`,
);
