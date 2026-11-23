import { localizeDigits } from "./i18n";
import type { Lang } from "./types";

const NE_MONTHS = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];

/**
 * "9 September 2026" / "९ सेप्टेम्बर २०२६". Browsers often lack a Nepali
 * date locale and silently fall back to English, so Nepali is built by hand.
 * With `short`, the month is abbreviated and today/yesterday read as words.
 */
export function formatDate(iso: string, lang: Lang, short = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (short) {
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return lang === "ne" ? "आज" : "Today";
    if (diffDays === 1) return lang === "ne" ? "हिजो" : "Yesterday";
  }
  if (lang === "ne") {
    return `${localizeDigits(d.getDate(), lang)} ${NE_MONTHS[d.getMonth()]} ${localizeDigits(d.getFullYear(), lang)}`;
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: short ? "short" : "long", year: "numeric" });
}
