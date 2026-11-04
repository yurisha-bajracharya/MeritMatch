"use client";

import { useState } from "react";
import type { Job, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS, matchJobs, type JobMatch } from "@/lib/tags";
import JobCard from "@/components/JobCard";

type TranslatedSkill = { tag: string; evidence: string };

/** Strings used only here, kept local so lib/i18n.ts does not need editing. */
const L = {
  recommended: { en: "Jobs matching your skills", ne: "तपाईंको सीपसँग मिल्ने कामहरू" },
  recommendedSub: {
    en: "Ranked by how well your skills line up with what each job needs.",
    ne: "प्रत्येक कामलाई चाहिने सीपसँग कति मिल्छ, सोही अनुसार क्रम मिलाइएको।",
  },
  findingJobs: { en: "Finding matching jobs…", ne: "मिल्ने कामहरू खोज्दै…" },
  noMatches: {
    en: "No open jobs match these skills right now. Get notified when one is posted.",
    ne: "अहिले यी सीपसँग मिल्ने काम छैन। नयाँ काम आएपछि खबर पाउनुहोस्।",
  },
  matchesOn: { en: "Matches on", ne: "मिल्ने सीप" },
  seeAll: { en: "See all matching jobs", ne: "सबै मिल्ने कामहरू हेर्नुहोस्" },
  notifyMe: { en: "Notify me about jobs like these", ne: "यस्ता काम आए खबर गर्नुहोस्" },
  notified: { en: "✓ You'll be notified", ne: "✓ खबर गरिनेछ" },
  nothingFound: {
    en: "We couldn't find a skill in that. Try saying what you actually did, for example: “I managed a team of 5 at a call centre” or “I built websites for small businesses”.",
    ne: "त्यसमा कुनै सीप भेटिएन। आफूले के गर्नुभयो भन्ने लेख्नुहोस्, जस्तै: “मैले कल सेन्टरमा ५ जनाको टोली सम्हालेँ” वा “मैले साना व्यवसायका लागि वेबसाइट बनाएँ”।",
  },
  keywordMode: {
    en: "Mapped by keywords. Add a GEMINI_API_KEY to .env for smarter mapping.",
    ne: "किवर्डबाट मिलाइएको। राम्रो नतिजाका लागि .env मा GEMINI_API_KEY थप्नुहोस्।",
  },
  claimNote: {
    en: "These are skills you described, not yet proven. They're used only to suggest jobs. You prove them by doing a job's short task, and employers only ever see those results.",
    ne: "यी तपाईंले वर्णन गरेका सीप हुन्, अझै प्रमाणित भएका छैनन्। यी कामहरू सुझाउन मात्र प्रयोग हुन्छन्। कुनै कामको सानो कार्य गरेर तपाईं प्रमाणित गर्नुहुन्छ, र रोजगारदाताले ती नतिजा मात्र देख्छन्।",
  },
  loginFirst: {
    en: "Please log in first so we can save this to your profile.",
    ne: "यो तपाईंको प्रोफाइलमा राख्न पहिले लगइन गर्नुहोस्।",
  },
} as const;

const s = (k: keyof typeof L, lang: Lang) => L[k][lang];

export default function ExperienceMapper({
  lang: initialLang = "en",
}: {
  lang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<TranslatedSkill[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  // Which engine produced the result, and whether a mapping has run at all,
  // so an empty result can say so instead of showing nothing.
  const [by, setBy] = useState<string>("");
  const [mapped, setMapped] = useState(false);

  // --- job recommendations ---
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [subbing, setSubbing] = useState(false);
  const [subbed, setSubbed] = useState(false);

  /** Pull every open job and rank it against the mapped skill tags. */
  const loadMatches = async (tags: string[]) => {
    if (tags.length === 0) {
      setMatches([]);
      return;
    }
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      const jobs: Job[] = Array.isArray(data) ? data : [];
      setMatches(matchJobs(tags, jobs, [], 12));
    } catch {
      setMatches([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleMap = async () => {
    setLoading(true);
    setError("");
    setSkills([]);
    setMatches([]);
    setSaved(false);
    setSubbed(false);
    setMapped(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const found: TranslatedSkill[] = data.skills || [];
      setSkills(found);
      setBy(data.by || "");
      setMapped(true);
      await loadMatches(found.map((x) => x.tag));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    const tags = skills.map((x) => x.tag);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "session" }),
      });
      const session = await res.json();
      if (!session.user) {
        setError(s("loginFirst", lang));
        return;
      }

      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.user.name,
          phone: session.user.phone,
          role: session.user.role,
          skills: [...new Set([...(session.user.skills ?? []), ...tags])],
          experience_text: text,
        }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save");
    }
  };

  const subscribe = async () => {
    setSubbing(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: skills.map((x) => x.tag),
          category: "",
        }),
      });
      if (res.status === 401) {
        setError(s("loginFirst", lang));
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setSubbed(true);
    } catch {
      setError("Failed to subscribe");
    } finally {
      setSubbing(false);
    }
  };

  // Group skills by the evidence sentence they came from
  const grouped = skills.reduce<Record<string, TranslatedSkill[]>>(
    (acc, skill) => {
      const key = skill.evidence.slice(0, 40);
      (acc[key] ??= []).push(skill);
      return acc;
    },
    {},
  );

  const allTags = skills.map((x) => x.tag).join(",");

  return (
    <div className="space-y-6">
      {/* ---------- input ---------- */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">{t("experienceMapperTitle", lang)}</h2>
            <p className="section-sub text-sm">
              {t("experienceMapperDesc", lang)}
            </p>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>

        <textarea
          className="input min-h-[120px] resize-y"
          placeholder={t("describeExperience", lang)}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleMap}
          disabled={loading || text.trim().length < 5}
          className="btn-primary mt-4 w-full"
        >
          {loading ? t("mapping", lang) : t("mapSkills", lang)}
        </button>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-danger-light text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      {/* ---------- nothing found: say so instead of showing nothing ---------- */}
      {mapped && skills.length === 0 && !error && (
        <div className="card animate-fade-in border-ochre/30">
          <p className="text-sm text-ink-light leading-relaxed">
            {s("nothingFound", lang)}
          </p>
          {by === "fallback" && (
            <p className="text-xs text-ink-muted mt-3">{s("keywordMode", lang)}</p>
          )}
        </div>
      )}

      {/* ---------- skills found ---------- */}
      {skills.length > 0 && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold">{t("skillsFound", lang)}</h3>
          <p className="text-xs text-ink-muted mt-1 mb-4 leading-relaxed">
            {s("claimNote", lang)}
          </p>

          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="p-4 rounded-lg bg-paper-dark">
                <p className="text-sm text-ink-light italic mb-2">
                  {t("evidence", lang)}: {group[0].evidence}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.map((x) => (
                    <span key={x.tag} className="badge-brand">
                      {TAG_LABELS[x.tag]?.[lang] ?? x.tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={saveToProfile}
              disabled={saved}
              className="btn-primary flex-1"
            >
              {saved ? "✓ Saved" : t("saveToProfile", lang)}
            </button>
          </div>
        </div>
      )}

      {/* ---------- recommended jobs ---------- */}
      {skills.length > 0 && (
        <div className="card animate-fade-in">
          <div className="mb-4">
            <h3 className="font-semibold">{s("recommended", lang)}</h3>
            <p className="section-sub text-sm">{s("recommendedSub", lang)}</p>
          </div>

          {jobsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-40 rounded-xl" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-ink-muted mb-4">
                {s("noMatches", lang)}
              </p>
              <button
                onClick={subscribe}
                disabled={subbing || subbed}
                className={subbed ? "btn-secondary" : "btn-primary"}
              >
                {subbed ? s("notified", lang) : s("notifyMe", lang)}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 stagger-children">
                {matches.map((m) => (
                  <div key={m.job.id} className="space-y-1.5">
                    <JobCard job={m.job} lang={lang} />
                    <p className="text-xs text-ink-muted px-1">
                      {s("matchesOn", lang)}:{" "}
                      {m.shared
                        .map((tg) => TAG_LABELS[tg]?.[lang] ?? tg)
                        .join(", ")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <a
                  href={`/jobs?tags=${encodeURIComponent(allTags)}`}
                  className="btn-secondary flex-1 text-center"
                >
                  {s("seeAll", lang)}
                </a>
                <button
                  onClick={subscribe}
                  disabled={subbing || subbed}
                  className={`flex-1 ${subbed ? "btn-secondary" : "btn-primary"}`}
                >
                  {subbed ? s("notified", lang) : s("notifyMe", lang)}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
