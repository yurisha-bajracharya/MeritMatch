"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS, matchJobs } from "@/lib/tags";
import JobCard from "@/components/JobCard";
import Icon from "@/components/Icon";

type TranslatedSkill = {
  tag: string;
  evidence: string;
  /** named: the person wrote it. inferred: we guessed it. added: they picked it by hand. */
  source: "named" | "inferred" | "added";
};

/** Starter sentences so nobody faces a blank box. Tapping one fills it in. */
const STARTERS: Record<Lang, string[]> = {
  en: [
    "I ran my family's grocery shop and kept the accounts",
    "I looked after my grandmother and handled her medicines and doctor visits",
    "I did sewing and tailoring for neighbours and customers",
    "I managed a team of 5 and did software engineering",
  ],
  ne: [
    "मैले परिवारको किराना पसल चलाएँ र हिसाबकिताब राखेँ",
    "मैले हजुरआमाको हेरचाह गरेँ, औषधि र डाक्टर भेट्ने काम सम्हालेँ",
    "मैले छिमेकी र ग्राहकहरूका लागि सिलाइ र टेलरिङ गरेँ",
    "मैले ५ जनाको टोली सम्हालेँ र सफ्टवेयर इन्जिनियरिङ गरेँ",
  ],
};

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
  notified: { en: "You'll be notified", ne: "खबर गरिनेछ" },
  saved: { en: "Saved", ne: "सुरक्षित भयो" },
  youSaid: { en: "Skills you named", ne: "तपाईंले आफैं भनेका सीप" },
  inferred: { en: "Skills we inferred from what you did", ne: "तपाईंले गरेको कामबाट हामीले अनुमान गरेका सीप" },
  addedByYou: { en: "Skills you added", ne: "तपाईंले थपेका सीप" },
  tapHint: {
    en: "Tap a skill to remove it, or add one we missed. Only the skills you keep are used.",
    ne: "हटाउन सीपमा थिच्नुहोस्, वा हामीले छुटाएको सीप थप्नुहोस्। तपाईंले राखेका सीप मात्र प्रयोग हुन्छन्।",
  },
  addSkill: { en: "Add a skill we missed", ne: "छुटेको सीप थप्नुहोस्" },
  tryOne: { en: "Not sure what to write? Tap an example:", ne: "के लेख्ने थाहा छैन? एउटा उदाहरण थिच्नुहोस्:" },
  nothingKept: {
    en: "No skills selected. Tap a skill above to bring it back, or add one.",
    ne: "कुनै सीप छानिएको छैन। माथिको सीपमा थिचेर फर्काउनुहोस्, वा थप्नुहोस्।",
  },
  inCity: { en: "Showing your cities first", ne: "तपाईंका शहर पहिले देखाइँदैछ" },
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
  // Tags the person has switched OFF. Everything else counts as kept.
  const [off, setOff] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [by, setBy] = useState<string>("");
  const [mapped, setMapped] = useState(false);

  // --- jobs, fetched once, re-ranked locally as skills change ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [myCities, setMyCities] = useState<string[]>([]);
  const [subbing, setSubbing] = useState(false);
  const [subbed, setSubbed] = useState(false);

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    })
      .then((r) => r.json())
      .then((d) => setMyCities(d?.user?.preferred_cities ?? []))
      .catch(() => {});
  }, []);

  const kept = useMemo(() => skills.filter((x) => !off.has(x.tag)), [skills, off]);
  const keptTags = useMemo(() => kept.map((x) => x.tag), [kept]);

  // Recomputed instantly whenever a skill is switched on or off.
  const matches = useMemo(
    () => matchJobs(keptTags, jobs, [], 12, { cities: myCities }),
    [keptTags, jobs, myCities],
  );

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleMap = async () => {
    setLoading(true);
    setError("");
    setSkills([]);
    setOff(new Set());
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

      setSkills(data.skills || []);
      setBy(data.by || "");
      setMapped(true);
      if ((data.skills || []).length > 0) await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (tag: string) => {
    setSaved(false);
    setSubbed(false);
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const addSkill = (tag: string) => {
    if (!tag || skills.some((x) => x.tag === tag)) return;
    setSaved(false);
    setSubbed(false);
    setSkills((prev) => [...prev, { tag, evidence: "", source: "added" }]);
    if (jobs.length === 0) loadJobs();
  };

  const saveToProfile = async () => {
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

      const save = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: [...new Set([...(session.user.skills ?? []), ...keptTags])],
          experience_text: text,
        }),
      });
      if (!save.ok) throw new Error("save");

      // Anonymous accuracy signal: which suggestions people actually keep.
      // Skill tags only, never the text they wrote.
      const suggested = skills.filter((x) => x.source !== "added").map((x) => x.tag);
      fetch("/api/mapper-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggested,
          kept: keptTags.filter((tg) => suggested.includes(tg)),
          added: skills.filter((x) => x.source === "added" && !off.has(x.tag)).map((x) => x.tag),
        }),
      }).catch(() => {});

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
        body: JSON.stringify({ tags: keptTags, category: "" }),
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

  const allTags = keptTags.join(",");
  const groups: { key: TranslatedSkill["source"]; title: keyof typeof L }[] = [
    { key: "named", title: "youSaid" },
    { key: "inferred", title: "inferred" },
    { key: "added", title: "addedByYou" },
  ];
  const addable = Object.keys(TAG_LABELS).filter((tg) => !skills.some((x) => x.tag === tg));

  const doneLabel = (done: boolean, label: string, doneText: string) =>
    done ? (
      <span className="inline-flex items-center justify-center gap-1.5">
        <Icon name="check" size={14} strokeWidth={2.5} />
        {doneText}
      </span>
    ) : (
      label
    );

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

        {text.trim().length === 0 && (
          <div className="mt-3">
            <p className="text-xs text-ink-muted mb-2">{s("tryOne", lang)}</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS[lang].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  className="rounded-full border border-rule px-3 py-1.5 text-left text-xs text-ink-light transition-colors hover:border-brand/60 hover:text-ink"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

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

      {/* ---------- skills found: editable ---------- */}
      {mapped && skills.length > 0 && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold">{t("skillsFound", lang)}</h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{s("tapHint", lang)}</p>

          <div className="mt-4 space-y-4">
            {groups.map(({ key, title }) => {
              const group = skills.filter((x) => x.source === key);
              if (group.length === 0) return null;
              return (
                <div key={key} className="p-4 rounded-lg bg-paper-dark">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
                    {s(title, lang)}
                  </p>
                  <ul className="space-y-2">
                    {group.map((x) => {
                      const on = !off.has(x.tag);
                      return (
                        <li key={x.tag}>
                          <button
                            type="button"
                            onClick={() => toggle(x.tag)}
                            aria-pressed={on}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              on
                                ? "border-brand bg-brand-light text-brand"
                                : "border-rule text-ink-muted line-through"
                            }`}
                          >
                            <Icon name={on ? "check" : "plus"} size={13} strokeWidth={2.5} />
                            {TAG_LABELS[x.tag]?.[lang] ?? x.tag}
                          </button>
                          {x.evidence && (
                            <p className="mt-1 pl-1 text-xs italic text-ink-muted">{x.evidence}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="add-skill">
              {s("addSkill", lang)}
            </label>
            <select
              id="add-skill"
              className="input"
              value=""
              onChange={(e) => addSkill(e.target.value)}
            >
              <option value="">{lang === "ne" ? "सीप छान्नुहोस्" : "Choose a skill"}</option>
              {addable.map((tg) => (
                <option key={tg} value={tg}>
                  {TAG_LABELS[tg][lang]}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-ink-muted mt-4 leading-relaxed">{s("claimNote", lang)}</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={saveToProfile}
              disabled={saved || keptTags.length === 0}
              className="btn-primary flex-1"
            >
              {doneLabel(saved, t("saveToProfile", lang), s("saved", lang))}
            </button>
          </div>
        </div>
      )}

      {/* ---------- recommended jobs: follows the skills you keep ---------- */}
      {mapped && skills.length > 0 && (
        <div className="card animate-fade-in">
          <div className="mb-4">
            <h3 className="font-semibold">{s("recommended", lang)}</h3>
            <p className="section-sub text-sm">{s("recommendedSub", lang)}</p>
            {myCities.length > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-moss">
                <Icon name="pin" size={12} />
                {s("inCity", lang)}
              </p>
            )}
          </div>

          {jobsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-40 rounded-xl" />
              ))}
            </div>
          ) : keptTags.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">{s("nothingKept", lang)}</p>
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
                {doneLabel(subbed, s("notifyMe", lang), s("notified", lang))}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 stagger-children">
                {matches.map((m) => (
                  <div key={m.job.id} className="space-y-1.5">
                    <JobCard job={m.job} lang={lang} fit={myCities.length ? m.fit : undefined} />
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
                  {doneLabel(subbed, s("notifyMe", lang), s("notified", lang))}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
