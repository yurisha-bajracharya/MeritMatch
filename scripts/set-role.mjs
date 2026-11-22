// Repair an account whose role was changed by the old login bug.
// Usage (from the project folder):  node scripts/set-role.mjs 98XXXXXXXX employer
import Database from "better-sqlite3";
import path from "path";

const [phone, role] = process.argv.slice(2);
if (!phone || !["employer", "candidate"].includes(role)) {
  console.log("Usage: node scripts/set-role.mjs <phone> <employer|candidate>");
  process.exit(1);
}
const db = new Database(path.join(process.cwd(), "data", "meritmatch.db"));
const r = db.prepare("UPDATE users SET role = ? WHERE phone = ?").run(role, phone);
console.log(r.changes ? `Done: ${phone} is now ${role}. Log out and log in again.` : `No account with phone ${phone}.`);
