"use client";

import { Suspense } from "react";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import { useLang } from "@/lib/useLang";
import type { Job, Lang, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";
import Icon from "@/components/Icon";
import { CITIES, PROVINCES, locationFit, resolveCity, type LocationFit } from "@/lib/places";
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
  tailoring: { en: "Tailoring", ne: "सिलाइ" },
};

const FIT_ORDER: Record<LocationFit, number> = { preferred: 0, anywhere: 1, unknown: 2, elsewhere: 3 };

function JobsPageInner() {
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get("tags");
  const highlightParam = searchParams.get("highlight");

  const [lang] = useLang();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  // "" = all cities, "mine" = only my preferred cities, otherwise a city id
  const [cityFilter, setCityFilter] = useState("");
  const [myCities, setMyCities] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    })
      .then((r) => r.json())
      .then((d) => {
        const cities: string[] = d?.user?.preferred_cities ?? [];
        setMyCities(cities);
        if (cities.length > 0) setCityFilter("mine");
      })
      .catch(() => {});
  }, []);

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
    return matchJobs(filterTags, jobs, [], jobs.length, { cities: myCities }).map((m) => m.job);
  }, [filterTags, jobs, myCities]);

  const fitOf = (job: Job): LocationFit => locationFit(job.location, myCities);

  const filtered = base
    .filter((job) => {
    // Category filter
    if (category && job.category !== category) return false;

    // City filter
    if (cityFilter === "mine") {
      if (fitOf(job) === "elsewhere") return false;
    } else if (cityFilter && resolveCity(job.location) !== cityFilter) {
      return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matches =
        job.title.toLowerCase().includes(q) ||
        job.employer_name.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.category.includes(q) ||
        job.tags.some((tag) => tag.toLowerCase().includes(q));

      // Fuzzy tag matching, resolve the job's tags too, not just the query
      const resolved = resolveTag(q);
      const fuzzyMatch = resolved
        ? job.tags.some((tag) => (resolveTag(tag) ?? tag) === resolved)
        : false;

      if (!matches && !fuzzyMatch) return false;
    }

    return true;
    })
    // Stable sort: the viewer's own cities first, otherwise keep the existing order.
    .sort((a, b) => (myCities.length ? FIT_ORDER[fitOf(a)] - FIT_ORDER[fitOf(b)] : 0));

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

  const L = (en: string, ne: string) => (lang === "ne" ? ne : en);
  const showAlerts = Boolean(tagsParam || search || category);

  return (
    <>
      <Navbar />
      <main className="container-main py-10">
        <header>
          <h1 className="page-title">{t("jobs", lang)}</h1>
          <p className="section-sub">
            {L(
              "Every job starts with a short task instead of a CV. Pick one that fits you.",
              "हरेक काम CV होइन, छोटो कार्यबाट सुरु हुन्छ। आफूलाई मिल्ने काम छान्नुहोस्।",
            )}
          </p>
        </header>

        {/* Search and location: the two things people filter by most */}
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_16rem]">
          <div>
            <label htmlFor="job-search" className="label">
              {L("Search", "खोज्नुहोस्")}
            </label>
            <div className="relative">
              <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="job-search"
                type="search"
                className="input !pl-11"
                placeholder={L("Job title, employer or skill", "कामको नाम, रोजगारदाता वा सीप")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="job-city" className="label">
              {L("Location", "स्थान")}
            </label>
            <select id="job-city" className="input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">{L("All cities", "सबै शहर")}</option>
              {myCities.length > 0 && <option value="mine">{L("My cities", "मेरा शहरहरू")}</option>}
              {Object.entries(PROVINCES).map(([pid, label]) => (
                <optgroup key={pid} label={label[lang]}>
                  {CITIES.filter((c) => c.province === pid).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {myCities.length === 0 && (
              <a href="/dashboard" className="link mt-1.5 inline-block text-sm">
                {L("Set your preferred cities", "आफ्नो शहर राख्नुहोस्")}
              </a>
            )}
          </div>
        </div>

        {/* Category: one row, scrolls sideways on small screens */}
        <fieldset className="mt-5 min-w-0">
          <legend className="label">{L("Type of work", "कामको प्रकार")}</legend>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => setCategory("")}
              aria-pressed={!category}
              className={`chip shrink-0 ${!category ? "chip-on" : ""}`}
            >
              {t("allCategories", lang)}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat === category ? "" : cat)}
                aria-pressed={cat === category}
                className={`chip shrink-0 ${cat === category ? "chip-on" : ""}`}
              >
                {CATEGORY_LABELS[cat]?.[lang] ?? cat}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Result count + alerts */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
          <p className="text-base text-ink-light" aria-live="polite">
            {loading
              ? L("Loading jobs…", "कामहरू लोड हुँदैछ…")
              : lang === "ne"
                ? `${localizeDigits(filtered.length, lang)} वटा काम${myCities.length ? ", तपाईंका शहर पहिले" : ""}`
                : `${filtered.length} ${filtered.length === 1 ? "job" : "jobs"}${myCities.length ? ", your cities first" : ""}`}
          </p>
          {showAlerts && (
            <button
              type="button"
              onClick={subscribe}
              disabled={subbing || subbed}
              className="btn-ghost btn-sm !px-2 text-brand-ink"
            >
              <Icon name={subbed ? "check" : "plus"} size={16} />
              {subbed ? t("subscribed", lang) : t("subscribeTo", lang)}
            </button>
          )}
        </div>

        {/* Results */}
        <div className="mt-5">
          {loading ? (
            <div className="space-y-4" aria-hidden>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-36 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <p className="text-lg font-medium text-ink">{t("noJobs", lang)}</p>
              <p className="mt-1 text-base">
                {L("Try another word, or clear the filters.", "अर्को शब्द प्रयोग गर्नुहोस्, वा फिल्टर हटाउनुहोस्।")}
              </p>
              {(search || category || cityFilter) && (
                <button
                  type="button"
                  className="btn-secondary btn-sm mt-5"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setCityFilter("");
                  }}
                >
                  {L("Clear filters", "फिल्टर हटाउनुहोस्")}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  lang={lang}
                  highlight={job.id === highlightParam}
                  fit={myCities.length ? fitOf(job) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/** useSearchParams must sit inside a Suspense boundary for `next build`. */
export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageInner />
    </Suspense>
  );
}
