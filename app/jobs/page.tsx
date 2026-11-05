"use client";

import { Suspense } from "react";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import type { Job, Lang, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { t } from "@/lib/i18n";
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

  const [lang, setLang] = useState<Lang>("en");
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

      // Fuzzy tag matching — resolve the job's tags too, not just the query
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

        {/* City filter */}
        <div className="flex items-center gap-2">
          <Icon name="pin" size={16} className="text-ink-muted" />
          <select
            className="input !w-auto"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label={lang === "ne" ? "शहर" : "City"}
          >
            <option value="">{lang === "ne" ? "सबै शहर" : "All cities"}</option>
            {myCities.length > 0 && (
              <option value="mine">{lang === "ne" ? "मेरा शहरहरू" : "My cities"}</option>
            )}
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
            <a href="/dashboard" className="text-xs text-brand hover:underline">
              {lang === "ne" ? "आफ्नो शहर राख्नुहोस्" : "Set your cities"}
            </a>
          )}
        </div>

        {/* Subscribe button */}
        {(tagsParam || search || category) && (
          <button
            onClick={subscribe}
            disabled={subbing || subbed}
            className={`btn-sm ${subbed ? "btn-secondary" : "btn-primary"}`}
          >
            {subbed ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("subscribed", lang)}
              </span>
            ) : (
              t("subscribeTo", lang)
            )}
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
                fit={myCities.length ? fitOf(job) : undefined}
              />
            ))}
          </div>
        )}
      </div>
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
