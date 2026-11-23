import type { SalaryPeriod } from "./types";

/**
 * Nepal's minimum remuneration (basic + dearness allowance), in force from
 * 17 July 2025 (2082 B.S.), outside tea estates:
 *   month Rs 19,550 · day Rs 754 · hour Rs 101 (part-time hour Rs 107)
 * Source: Minimum Remuneration Notice 2082. The government revises this
 * every few years: override with MIN_WAGE_MONTH / _DAY / _HOUR in .env.local.
 */
export const MIN_WAGE_EFFECTIVE = "17 July 2025";

export function minimumWage(period: SalaryPeriod, partTime = false): number {
  const env = (k: string, d: number) => {
    const v = Number(process.env[k]);
    return Number.isFinite(v) && v > 0 ? v : d;
  };
  if (period === "day") return env("MIN_WAGE_DAY", 754);
  if (period === "hour") return env(partTime ? "MIN_WAGE_HOUR_PART_TIME" : "MIN_WAGE_HOUR", partTime ? 107 : 101);
  return env("MIN_WAGE_MONTH", 19550);
}
