import { localizeDigits } from "./i18n";
import type { EmploymentType, Job, Lang, SalaryPeriod } from "./types";

export const EMPLOYMENT_LABEL: Record<EmploymentType, Record<Lang, string>> = {
  "full-time": { en: "Full-time", ne: "पूर्णकालीन" },
  "part-time": { en: "Part-time", ne: "आंशिक समय" },
  contract: { en: "Contract", ne: "करार" },
  "daily-wage": { en: "Daily wage", ne: "दैनिक ज्याला" },
  internship: { en: "Internship", ne: "इन्टर्नसिप" },
};

export const PERIOD_LABEL: Record<SalaryPeriod, Record<Lang, string>> = {
  month: { en: "a month", ne: "प्रति महिना" },
  day: { en: "a day", ne: "प्रति दिन" },
  hour: { en: "an hour", ne: "प्रति घण्टा" },
};

const num = (n: number, lang: Lang) => localizeDigits(n.toLocaleString("en-IN"), lang);

/** "Rs 16,000 to 20,000 a month", or null when the job has no salary yet. */
export function formatSalary(job: Pick<Job, "salary_min" | "salary_max" | "salary_period">, lang: Lang): string | null {
  const lo = job.salary_min;
  const hi = job.salary_max ?? lo;
  if (!lo || !hi) return null;
  const range = lo === hi ? num(lo, lang) : lang === "ne" ? `${num(lo, lang)} देखि ${num(hi, lang)}` : `${num(lo, lang)} to ${num(hi, lang)}`;
  return lang === "ne" ? `रु ${range} ${PERIOD_LABEL[job.salary_period][lang]}` : `Rs ${range} ${PERIOD_LABEL[job.salary_period][lang]}`;
}
