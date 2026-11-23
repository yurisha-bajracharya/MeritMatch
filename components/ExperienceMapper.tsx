"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLang } from "@/lib/useLang";
import type { Job, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS, matchJobs } from "@/lib/tags";
import JobCard from "@/components/JobCard";
import Icon from "@/components/Icon";
import VoiceRecorder from "@/components/VoiceRecorder";
import SkillEvidenceBlock, { type SkillPhoto } from "@/components/SkillEvidenceBlock";
import { EVIDENCE_DISCLAIMER } from "@/lib/evidence-labels";

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
    en: "Mapped by keywords. Add a GEMINI_API_KEY to .env.local for smarter mapping.",
    ne: "किवर्डबाट मिलाइएको। राम्रो नतिजाका लागि .env.local मा GEMINI_API_KEY थप्नुहोस्।",
  },
  aiFailed: {
    en: "The AI mapper could not be reached, so keywords were used. The terminal running the app shows the reason.",
    ne: "एआई म्यापरमा पुग्न सकिएन, त्यसैले किवर्ड प्रयोग गरियो। एप चलिरहेको टर्मिनलमा कारण देखिन्छ।",
  },
  claimNote: {
    en: "These are skills you described, not yet proven. They suggest jobs, and employers you apply to see them marked as described. Photos of your work and a job's short task are how you back them up.",
    ne: "यी तपाईंले वर्णन गरेका सीप हुन्, अझै प्रमाणित भएका छैनन्। यिनले काम सुझाउँछन्, र तपाईंले आवेदन दिएका रोजगारदाताले यिनलाई 'वर्णन गरेको' भनेर देख्छन्। कामका फोटो र कुनै कामको सानो कार्यले यिनलाई प्रमाणित गर्छन्।",
  },
  loginFirst: {
    en: "Please log in first so we can save this to your profile.",
    ne: "यो तपाईंको प्रोफाइलमा राख्न पहिले लगइन गर्नुहोस्।",
  },
} as const;

const s = (k: keyof typeof L, lang: Lang) => L[k][lang];

export default function ExperienceMapper() {
  const [lang] = useLang();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<TranslatedSkill[]>([]);
  // Tags the person has switched OFF. Everything else counts as kept.
  const [off, setOff] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [by, setBy] = useState<string>("");
  const [aiError, setAiError] = useState<string>("");
  const [mapped, setMapped] = useState(false);
  // Voice: which language the person will speak (can differ from the screen).
  const [speech, setSpeech] = useState<Lang | null>(null);
  const [english, setEnglish] = useState("");
  const [englishMissing, setEnglishMissing] = useState(false);
  const [photos, setPhotos] = useState<SkillPhoto[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

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
      .then((d) => {
        setMyCities(d?.user?.preferred_cities ?? []);
        if (d?.user?.role === "candidate") {
          setLoggedIn(true);
          loadPhotos();
        }
      })
      .catch(() => {});
  }, []);

  const loadPhotos = () =>
    fetch("/api/skill-evidence")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => {});

  // Spoken words are added to the end of what is already written.
  const onSpoken = useCallback((said: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${said.trim()}` : said.trim()));
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
    setEnglish("");
    setEnglishMissing(false);

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
      setAiError(data.aiError || "");
      setEnglish(typeof data.english === "string" ? data.english : "");
      setEnglishMissing(Boolean(data.english_unavailable));
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
          ...(english ? { experience_en: english } : {}),
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
      setLoggedIn(true);
      loadPhotos();
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

  const ne = lang === "ne";
  const SOURCE_TAG: Record<TranslatedSkill["source"], string> = {
    named: ne ? "तपाईंले भन्नुभयो" : "You said this",
    inferred: ne ? "तपाईंको कामबाट" : "From what you did",
    added: ne ? "तपाईंले थप्नुभयो" : "Added by you",
  };

  return (
    <div>
      {/* ---------- header ---------- */}
      <header className="max-w-2xl">
        <p className="eyebrow">{t("experienceMapperTitle", lang)}</p>
        <h1 className="page-title mt-2">
          {ne ? "तपाईंले गरेको कामको मूल्य छ, जागिर नभए पनि।" : "What you have done counts, even if it was never a job."}
        </h1>
        <p className="section-sub">
          {ne
            ? "परिवारको हेरचाह, खेती, पसल, सिलाइ, स्वयंसेवा, जे गर्नुभयो आफ्नै शब्दमा लेख्नुहोस्। हामी त्यसलाई रोजगारदाताले खोज्ने सीपमा बदल्छौं र मिल्ने काम देखाउँछौं।"
            : "Caring for family, farming, a shop, sewing, volunteering: write what you did in your own words. We turn it into skills employers look for, and show jobs that fit."}
        </p>
      </header>

      {/* ---------- input ---------- */}
      <section className="mt-8 max-w-2xl">
        <label htmlFor="experience" className="label text-base">
          {ne ? "आफ्नै शब्दमा लेख्नुहोस्" : "Tell us in your own words"}
        </label>
        <textarea
          id="experience"
          className="input min-h-[170px] resize-y !text-lg"
          placeholder={
            ne
              ? "जस्तै: मैले तीन वर्ष हजुरआमाको हेरचाह गरेँ र शनिबार काकाको पसलमा सघाएँ।"
              : "For example: I looked after my grandmother for three years and helped in my uncle's shop on weekends."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby="experience-hint"
        />
        <p id="experience-hint" className="hint">
          {ne
            ? "नेपाली वा अंग्रेजीमा लेख्नुहोस् वा बोल्नुहोस्। एक दुई वाक्य पुग्छ।"
            : "Write or speak, in Nepali or English. A sentence or two is enough."}
        </p>

        {/* voice input */}
        <div className="mt-4 rounded-lg border border-rule p-4">
          <p className="text-sm font-semibold text-ink">{ne ? "लेख्नुको सट्टा बोल्नुहोस्" : "Speak instead of typing"}</p>
          <p className="mt-0.5 text-sm text-ink-light">{ne ? "कुन भाषामा बोल्नुहुन्छ?" : "Which language will you speak?"}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="tab-list self-start" role="radiogroup" aria-label={ne ? "बोल्ने भाषा" : "Speaking language"}>
              {(["ne", "en"] as Lang[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={(speech ?? lang) === v}
                  className={`tab ${(speech ?? lang) === v ? "tab-active" : ""}`}
                  onClick={() => setSpeech(v)}
                >
                  {v === "ne" ? "नेपाली" : "English"}
                </button>
              ))}
            </div>
            <VoiceRecorder lang={lang} speechLang={speech ?? lang} onResult={onSpoken} />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {ne
              ? "बोलेका कुरा माथिको बाकसमा लेखिन्छन्, मिलाउन सक्नुहुन्छ। Chrome वा Edge मा इन्टरनेटसहित चल्छ।"
              : "What you say appears in the box above, and you can fix it. Works in Chrome or Edge with internet."}
          </p>
        </div>

        {text.trim().length === 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">{ne ? "वा एउटा उदाहरणबाट सुरु गर्नुहोस्" : "Or start from an example"}</p>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {STARTERS[lang].map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => setText(ex)}
                    className="group flex w-full items-center justify-between gap-4 py-3 text-left text-base text-ink-light hover:text-ink"
                  >
                    <span>{ex}</span>
                    <span className="shrink-0 text-sm font-medium text-brand-ink opacity-70 group-hover:opacity-100">
                      {ne ? "यो प्रयोग गर्नुहोस्" : "Use this"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleMap}
          disabled={loading || text.trim().length < 5}
          className="btn-primary btn-lg mt-6 w-full sm:w-auto"
        >
          {loading ? t("mapping", lang) : t("mapSkills", lang)}
          {!loading && <Icon name="arrow-right" size={18} />}
        </button>

        {error && <div className="alert-error mt-4" role="alert">{error}</div>}
      </section>

      {/* ---------- nothing found ---------- */}
      {mapped && skills.length === 0 && !error && (
        <div className="alert-note mt-8 max-w-2xl" role="status">
          <p className="text-base">{s("nothingFound", lang)}</p>
          {aiError === "no_key" && <p className="mt-2 text-sm text-ink-muted">{s("keywordMode", lang)}</p>}
          {aiError === "failed" && <p className="mt-2 text-sm text-ink-muted">{s("aiFailed", lang)}</p>}
        </div>
      )}

      {/* ---------- results ---------- */}
      {mapped && skills.length > 0 && (
        <div className="mt-12 border-t border-rule pt-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
            {/* 1 + 2: what you said, and the skills in it */}
            <section aria-labelledby="skills-found">
              <p className="eyebrow">{ne ? "तपाईंले लेख्नुभयो" : "You wrote"}</p>
              <blockquote className="mt-2 border-l-2 border-rule pl-4 font-display text-lg leading-relaxed text-ink">
                {text}
              </blockquote>
              {english && (
                <div className="mt-4">
                  <p className="eyebrow">{ne ? "अंग्रेजीमा (रोजगारदाताका लागि)" : "In English (for employers)"}</p>
                  <p className="mt-2 border-l-2 border-rule pl-4 text-base leading-relaxed text-ink-light" lang="en">
                    {english}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {ne ? "AI ले अनुवाद गरेको। गलत भए माथि मिलाएर फेरि थिच्नुहोस्।" : "Translated by AI. If it is wrong, edit your words and map again."}
                  </p>
                </div>
              )}
              {englishMissing && (
                <p className="mt-3 text-sm text-ink-muted">
                  {ne
                    ? "अहिले अंग्रेजी अनुवाद हुन सकेन। तपाईंका नेपाली शब्द नै सुरक्षित हुन्छन्।"
                    : "An English translation was not available right now. Your Nepali words are saved as they are."}
                </p>
              )}

              <h2 id="skills-found" className="section-title mt-8">
                {t("skillsFound", lang)}
              </h2>
              <p className="mt-1 text-sm text-ink-light">{s("tapHint", lang)}</p>

              <ul className="mt-5 divide-y divide-rule border-y border-rule">
                {groups.flatMap(({ key }) =>
                  skills
                    .filter((sk) => sk.source === key)
                    .map((sk) => {
                      const on = !off.has(sk.tag);
                      const id = `skill-${sk.tag}`;
                      return (
                        <li key={sk.tag} className="py-3.5">
                          <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
                            <input
                              id={id}
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(sk.tag)}
                              className="mt-1 h-5 w-5 shrink-0 accent-[#d92f49]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                                <span className={`text-base font-semibold ${on ? "text-ink" : "text-ink-muted line-through"}`}>
                                  {TAG_LABELS[sk.tag]?.[lang] ?? sk.tag}
                                </span>
                                <span className="text-xs text-ink-muted">{SOURCE_TAG[sk.source]}</span>
                              </span>
                              {sk.evidence && <span className="mt-0.5 block text-sm text-ink-light">{sk.evidence}</span>}
                            </span>
                          </label>
                        </li>
                      );
                    }),
                )}
              </ul>

              <div className="mt-5">
                <label className="label" htmlFor="add-skill">
                  {s("addSkill", lang)}
                </label>
                <select id="add-skill" className="input" value="" onChange={(e) => addSkill(e.target.value)}>
                  <option value="">{ne ? "सीप छान्नुहोस्" : "Choose a skill"}</option>
                  {addable.map((tg) => (
                    <option key={tg} value={tg}>
                      {TAG_LABELS[tg][lang]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-5 text-sm text-ink-muted">{s("claimNote", lang)}</p>
              <button
                type="button"
                onClick={saveToProfile}
                disabled={saved || keptTags.length === 0}
                className="btn-primary mt-4 w-full sm:w-auto"
              >
                {doneLabel(saved, t("saveToProfile", lang), s("saved", lang))}
              </button>
              {saved && (
                <a href="#show-work" className="link mt-3 flex items-center gap-1.5 text-base">
                  {ne ? "अब: आफ्नो कामका फोटो थप्नुहोस्" : "Next: add photos of your work"}
                  <Icon name="arrow-right" size={16} />
                </a>
              )}
            </section>

            {/* 3: where those skills transfer */}
            <section aria-labelledby="where-fit">
              <h2 id="where-fit" className="section-title">
                {ne ? "यी सीप कहाँ काम लाग्छन्" : "Where these skills fit"}
              </h2>
              <p className="mt-1 text-sm text-ink-light">
                {s("recommendedSub", lang)}
                {myCities.length > 0 && ` ${s("inCity", lang)}.`}
              </p>

              <div className="mt-5">
                {jobsLoading ? (
                  <div className="space-y-4" aria-hidden>
                    {[1, 2].map((i) => (
                      <div key={i} className="skeleton h-36 rounded-lg" />
                    ))}
                  </div>
                ) : keptTags.length === 0 ? (
                  <div className="empty">{s("nothingKept", lang)}</div>
                ) : matches.length === 0 ? (
                  <div className="empty">
                    <p>{s("noMatches", lang)}</p>
                    <button type="button" onClick={subscribe} disabled={subbing || subbed} className="btn-secondary btn-sm mt-4">
                      {doneLabel(subbed, s("notifyMe", lang), s("notified", lang))}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-5">
                      {matches.map((m) => (
                        <div key={m.job.id}>
                          <JobCard job={m.job} lang={lang} fit={myCities.length ? m.fit : undefined} />
                          <p className="mt-1.5 px-1 text-sm text-ink-light">
                            <span className="text-ink-muted">{s("matchesOn", lang)}: </span>
                            {m.shared.map((tg) => TAG_LABELS[tg]?.[lang] ?? tg).join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href={`/jobs?tags=${encodeURIComponent(allTags)}`} className="btn-secondary">
                        {s("seeAll", lang)}
                      </a>
                      <button type="button" onClick={subscribe} disabled={subbing || subbed} className="btn-ghost text-brand-ink">
                        {doneLabel(subbed, s("notifyMe", lang), s("notified", lang))}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* 4: back the skills up with photos of real work */}
          {keptTags.length > 0 && (
            <section aria-labelledby="show-work" className="mt-12 border-t border-rule pt-10">
              <h2 id="show-work" className="section-title">
                {ne ? "आफ्नो काम देखाउनुहोस्" : "Show your work"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-light">
                {ne
                  ? "हरेक सीपका लागि कामको फोटो थप्न सक्नुहुन्छ (ऐच्छिक)। AI ले फोटो सीपसँग मिल्छ कि जाँच्छ। निश्चित नभए मेरिटम्याचको मानिसले हेर्छ। फोटो तपाईंको प्रोफाइलमा र तपाईंले आवेदन दिएका रोजगारदाताले मात्र देख्छन्।"
                  : "Add photos of your work for each skill (optional). AI checks whether the photo fits the skill. If it is not sure, a person at MeritMatch reviews it. Photos show on your profile and only to employers you apply to."}
              </p>
              <p className="mt-1 max-w-2xl text-xs text-ink-muted">{EVIDENCE_DISCLAIMER[lang]}</p>
              {!loggedIn ? (
                <div className="alert-note mt-5 max-w-2xl">
                  {ne ? "फोटो थप्न पहिले सीप प्रोफाइलमा सुरक्षित गर्नुहोस् (लगइन चाहिन्छ)।" : "Save these skills to your profile first (you need to be logged in) to add photos."}
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {keptTags.map((tg) => (
                    <SkillEvidenceBlock key={tg} tag={tg} lang={lang} photos={photos.filter((p) => p.tag === tg)} onChange={loadPhotos} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
