/**
 * How accurate is the answer scorer? Measure it, don't guess.
 *
 * You need real answers that real people have marked. Then this compares the
 * app's score with the human score and reports how closely they agree.
 *
 *   1. Collect 40-60 answers (more is better) across a spread of quality.
 *   2. Have a person mark each one 0-100 using the same rubric. For the best
 *      result have TWO people mark them independently, so we also learn how
 *      much humans agree with each other (the realistic ceiling).
 *   3. Put them in a CSV with these columns, in this order:
 *        category, answers, human_score_1, human_score_2(optional)
 *      `answers` holds one answer per task scenario, separated by |||
 *   4. Start the app (npm run dev) and run:
 *        node scripts/calibrate.mjs marks.csv
 *      Add  --ai off  to test the keyword scorer instead of the AI one.
 *      Set ADMIN_KEY in the environment if the server has one.
 *
 * Output: Spearman rank correlation (does it order people like a human
 * would?), average error in points, and the share of answers within 10
 * points of the human mark.
 */
import fs from "fs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  console.log(
    "Usage: node scripts/calibrate.mjs marks.csv [--ai on|off] [--url http://localhost:3000]\n" +
      "CSV columns: category, answers (separated by |||), human_score_1, human_score_2 (optional)",
  );
  process.exit(0);
}

const file = args.find((a) => !a.startsWith("--") && a.endsWith(".csv")) ?? args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const baseUrl = opt("--url", "http://localhost:3000");
const useAI = opt("--ai", "on") !== "off";

/** Minimal CSV reader that handles quoted fields, commas and newlines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(values.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1; // average rank for ties
    for (let k = i; k <= j; k++) out[order[k][1]] = avg;
    i = j + 1;
  }
  return out;
}

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? NaN : num / Math.sqrt(da * db);
}
const spearman = (a, b) => pearson(ranks(a), ranks(b));
const mae = (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length;
const within = (a, b, pts) => a.filter((x, i) => Math.abs(x - b[i]) <= pts).length / a.length;
const pct = (x) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : "n/a");
const num = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");

if (!fs.existsSync(file)) {
  console.error(`Can't find ${file}. Run from the project folder and give the path to your CSV.`);
  process.exit(1);
}
const [header, ...data] = parseCsv(fs.readFileSync(file, "utf8"));
if (!header || data.length === 0) {
  console.error("The CSV has no data rows.");
  process.exit(1);
}

const human1 = [], human2 = [], app = [];
const headers = {};
if (process.env.ADMIN_KEY) headers["x-admin-key"] = process.env.ADMIN_KEY;
headers["Content-Type"] = "application/json";

let done = 0;
for (const r of data) {
  const [category, answersRaw, h1, h2] = r;
  const mark = Number(h1);
  if (!category || !Number.isFinite(mark)) { console.warn("Skipping a row with no category or score."); continue; }

  const res = await fetch(`${baseUrl}/api/admin/score-preview`, {
    method: "POST",
    headers,
    body: JSON.stringify({ category: category.trim(), answers: String(answersRaw ?? "").split("|||").map((x) => x.trim()), useAI }),
  });
  if (res.status === 401) {
    console.error("Unauthorized. Set the same ADMIN_KEY the server uses, e.g.  $env:ADMIN_KEY=\"yourkey\"; node scripts/calibrate.mjs marks.csv");
    process.exit(1);
  }
  if (!res.ok) { console.error(`Server said ${res.status}: ${(await res.text()).slice(0, 120)}`); process.exit(1); }
  const out = await res.json();

  human1.push(mark);
  human2.push(h2 !== undefined && h2.trim() !== "" ? Number(h2) : NaN);
  app.push(out.total);
  if (++done % 10 === 0) console.log(`  scored ${done}/${data.length}`);
}

const n = app.length;
console.log(`\nAnswers compared: ${n}   scorer: ${useAI ? "AI (if configured)" : "keyword rules"}`);
if (n < 30) console.log("Warning: under 30 answers. Treat these numbers as a rough hint only.");

console.log("\nApp vs human #1");
console.log(`  Rank agreement (Spearman): ${num(spearman(app, human1))}   (1.0 = identical order)`);
console.log(`  Average gap: ${num(mae(app, human1), 1)} points out of 100`);
console.log(`  Within 10 points: ${pct(within(app, human1, 10))}`);

const both = human2.map((x, i) => [human1[i], x]).filter(([, x]) => Number.isFinite(x));
if (both.length >= 10) {
  const a = both.map((p) => p[0]), b = both.map((p) => p[1]);
  console.log("\nHuman #1 vs human #2 (how much people agree with each other)");
  console.log(`  Rank agreement (Spearman): ${num(spearman(a, b))}`);
  console.log(`  Average gap: ${num(mae(a, b), 1)} points`);
  console.log(`  Within 10 points: ${pct(within(a, b, 10))}`);
  console.log("\nThe app cannot reasonably be expected to agree with a person more than people agree with each other.");
}
