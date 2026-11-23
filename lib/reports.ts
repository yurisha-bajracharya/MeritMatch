/** Report reasons, statuses and their wording. Shared by the form, the status page and admin. */
import type { Lang } from "./types";

export const REPORT_CATEGORIES = [
  "scam",
  "fake_job",
  "asked_money",
  "misleading",
  "personal_info",
  "harassment",
  "suspicious_messages",
  "false_business",
  "other",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = ["new", "under_review", "awaiting_info", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const L = (en: string, ne: string): Record<Lang, string> => ({ en, ne });

export const CATEGORY_LABEL: Record<ReportCategory, Record<Lang, string>> = {
  scam: L("Suspected scam or fraudulent business", "ठगी वा जालसाजी गर्ने व्यवसाय जस्तो लाग्यो"),
  fake_job: L("Fake or non-existent job", "नक्कली वा अस्तित्वमा नभएको काम"),
  asked_money: L("Employer asked me for money or fees", "रोजगारदाताले मसँग पैसा वा शुल्क माग्यो"),
  misleading: L("Salary or job details are misleading", "तलब वा कामको विवरण भ्रामक छ"),
  personal_info: L("Asked for unnecessary or suspicious personal information", "अनावश्यक वा शंकास्पद व्यक्तिगत जानकारी माग्यो"),
  harassment: L("Behaved inappropriately or harassed me", "अनुचित व्यवहार वा दुर्व्यवहार गर्‍यो"),
  suspicious_messages: L("Contacted me with suspicious messages", "शंकास्पद सन्देशहरू पठायो"),
  false_business: L("Business information appears false", "व्यवसायको जानकारी झूटो देखिन्छ"),
  other: L("Other problem", "अन्य समस्या"),
};

export const STATUS_LABEL: Record<ReportStatus, Record<Lang, string>> = {
  new: L("Received", "प्राप्त भयो"),
  under_review: L("Under review", "समीक्षा हुँदैछ"),
  awaiting_info: L("We need more information", "थप जानकारी चाहिन्छ"),
  resolved: L("Resolved", "समाधान भयो"),
  dismissed: L("Closed", "बन्द गरियो"),
};

/** Short, easy-to-read reference such as MM-7K4Q2P. No 0/O or 1/I. */
export function newRef(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return `MM-${s}`;
}
