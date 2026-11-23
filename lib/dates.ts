import type { Lang } from "./types";

export function formatDate(value: string, lang: Lang, relative = false): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (relative) {
    const diffDays = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 86_400_000),
    );
    if (diffDays === 0) return lang === "ne" ? "आज" : "Today";
    if (diffDays === 1) return lang === "ne" ? "हिजो" : "Yesterday";
  }

  return new Intl.DateTimeFormat(lang === "ne" ? "ne-NP" : "en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
