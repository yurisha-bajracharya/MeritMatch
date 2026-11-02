import { timingSafeEqual } from "node:crypto";

/**
 * Admin actions need the ADMIN_KEY header. With no key configured they are
 * allowed only outside production, so a local demo works without setup.
 */
export function isAdmin(req: Request): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(req.headers.get("x-admin-key") ?? "");
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
