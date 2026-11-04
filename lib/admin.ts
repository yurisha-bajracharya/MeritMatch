import { timingSafeEqual } from "node:crypto";

export function isAdmin(req: Request): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(req.headers.get("x-admin-key") ?? "");
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
