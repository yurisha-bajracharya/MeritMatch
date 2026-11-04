"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import type { Job, Lang, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { t } from "@/lib/i18n";
import { matchJobs, resolveTag } from "@/lib/tags";

const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  retail: { en: "Retail", ne: "रिटेल" },
  admin: { en: "Admin", ne: "प्रशासन" },
  office: { en: "Data", ne: "डेटा" },
  hospitality: { en: "Hotel", ne: "होटल" },
  teaching: { en: "Teaching", ne: "शिक्षण" },
  driving: { en: "Driving", ne: "ड्राइभिङ" },
  construction: { en: "Construction", ne: "निर्माण" },
  "it-support": { en: "IT", ne: "आईटी" },
};

export default function JobsPage() {
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get("tags");
  const highlightParam = searchParams.get("highlight");

  const [lang, setLang] = useState<Lang>("en");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filterTags = useMemo(
    () =>
      (tagsParam ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    [tagsParam],
  );

  // When ?tags= is present, rank with the same fuzzy matcher the Experience
  // Mapper and the notifier use, so both sides of the comparison are resolved.
  const base = useMemo(() => {
    if (filterTags.length === 0) return jobs;
    return matchJobs(filterTags, jobs, [], jobs.length).map((m) => m.job);
  }, [filterTags, jobs]);

  const filtered = base.filter((job) => {
    // Category filter
    if (category && job.category !== category) return false;

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matches =
        job.title.toLowerCase().includes(q) ||
        job.employer_name.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.category.includes(q) ||
        job.tags.some((tag) => tag.toLowerCase().includes(q));

      // Fuzzy tag matching — resolve the job's tags too, not just the query
      const resolved = resolveTag(q);
      const fuzzyMatch = resolved
        ? job.tags.some((tag) => (resolveTag(tag) ?? tag) === resolved)
        : false;

      if (!matches && !fuzzyMatch) return false;
    }

    return true;
  });

  // Subscribe handler
  const [subbing, setSubbing] = useState(false);
  const [subbed, setSubbed] = useState(false);

  const subscribe = async () => {
    setSubbing(true);
    const searchTag = search.trim() ? resolveTag(search.trim()) : null;
    const tags = filterTags.length
      ? filterTags
      : searchTag
        ? [searchTag]
        : [];

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, category: category || "" }),
      });
      setSubbed(true);
    } catch {} finally {
      setSubbing(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-main py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="section-title">{t("jobs", lang)}</h1>
          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="input pl-10"
              placeholder={t("searchJobs", lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory("")}
              className={`badge whitespace-nowrap cursor-pointer ${!category ? "badge-brand" : "badge-muted"}`}
            >
              {t("allCategories", lang)}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`badge whitespace-nowrap cursor-pointer ${cat === category ? "badge-brand" : "badge-muted"}`}
              >
                {CATEGORY_LABELS[cat]?.[lang] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subscribe button */}
        {(tagsParam || search || category) && (
          <button
            onClick={subscribe}
            disabled={subbing || subbed}
            className={`btn-sm ${subbed ? "btn-secondary" : "btn-primary"}`}
          >
            {subbed ? t("subscribed", lang) : t("subscribeTo", lang)}
          </button>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-sm text-ink-muted py-12">
            {t("noJobs", lang)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 stagger-children">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                lang={lang}
                highlight={job.id === highlightParam}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
