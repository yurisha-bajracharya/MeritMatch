"use client";

import { useState } from "react";
import Segmented from "./Segmented";
import Icon from "./Icon";
import { CitySelect } from "./CityPicker";
import ScoringExplainer from "./ScoringExplainer";
import { cityName } from "@/lib/places";
import { DEFAULT_EVIDENCE } from "@/lib/templates";
import { useLang } from "@/lib/useLang";
import { x } from "@/lib/i18n-extra";

import type { Category, Evidence, Lang, CustomQuestion } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { t } from "@/lib/i18n";

const CATEGORY_LABELS: Record<Category, Record<Lang, string>> = {
  retail: { en: "Retail / Shop", ne: "पसल / रिटेल" },
  admin: { en: "Office / Admin", ne: "कार्यालय / प्रशासन" },
  office: { en: "Data / Clerical", ne: "डेटा / क्लेरिकल" },
  hospitality: { en: "Hotel / Restaurant", ne: "होटल / रेस्टुरेन्ट" },
  teaching: { en: "Teaching / Tutoring", ne: "शिक्षण / ट्युसन" },
  driving: { en: "Driving / Delivery", ne: "ड्राइभिङ / डेलिभरी" },
  construction: { en: "Construction / Labour", ne: "निर्माण / श्रम" },
  "it-support": { en: "IT / Tech Support", ne: "आईटी / टेक सपोर्ट" },
  tailoring: { en: "Tailoring / Crafts", ne: "सिलाइ / हस्तकला" },
};

export default function PostJobForm() {
  const [lang, setLang] = useLang();
  const [title, setTitle] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [evidence, setEvidence] = useState<Evidence>("none");
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const [category, setCategory] = useState<Category>("retail");
  const [tags, setTags] = useState("");
  const [durationMin, setDurationMin] = useState(15);
  const [aiScoring, setAiScoring] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<
    { id: string; en: string; ne: string }[]
  >([]);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    setCustomQuestions((prev) => [
      ...prev,
      { id: `cq-${Date.now()}`, en: "", ne: "" },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: "en" | "ne", value: string) => {
    setCustomQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setError("");

    const cq: CustomQuestion[] = customQuestions
      .filter((q) => q.en.trim() || q.ne.trim())
      .map((q) => ({
        id: q.id,
        prompt: { en: q.en.trim(), ne: q.ne.trim() || q.en.trim() },
      }));

    // "Thamel, Kathmandu": the area is for humans, the city is what we match on.
    const location = city
      ? [area.trim(), cityName(city, "en")].filter(Boolean).join(", ")
      : "";

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          employer_name: employerName,
          location,
          category,
          tags: parsedTags,
          custom_questions: cq,
          duration_min: durationMin,
          ai_scoring: aiScoring,
          evidence,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      setResult({
        id: data.id,
        link: `${window.location.origin}/t/${data.id}`,
      });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to post";
      setError(/log in as an employer/i.test(m) ? x("errLoginEmployer", lang) : /choose a city/i.test(m) ? x("errChooseCity", lang) : m);
    } finally {
      setPosting(false);
    }
  };

  const copyLink = () => {
    if (result) {
      navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (result) {
    return (
      <div className="card text-center animate-fade-in">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-moss-light text-moss">
          <Icon name="check-circle" size={30} label={x("posted", lang)} />
        </div>
        <h3 className="section-title">{t("jobPosted", lang)}</h3>
        <p className="text-sm text-ink-light mt-2">
          {x("shareLink", lang)}
        </p>
        <div className="mt-4 flex items-center gap-2 max-w-md mx-auto">
          <input className="input flex-1 text-xs" value={result.link} readOnly />
          <button onClick={copyLink} className="btn-primary btn-sm whitespace-nowrap">
            {copied ? t("copied", lang) : t("copyLink", lang)}
          </button>
        </div>
        <a
          href={`/employer/jobs/${result.id}`}
          className="btn-secondary mt-4 inline-flex"
        >
          {t("viewResults", lang)}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="section-title">{t("postJob", lang)}</h2>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>

        <div>
          <label className="label">{t("jobTitle", lang)}</label>
          <input
            className="input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={x("phShopAssistant", lang)}
          />
        </div>

        <div>
          <label className="label">{t("companyName", lang)}</label>
          <input
            className="input"
            required
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            placeholder={x("phCompany", lang)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="job-city">
              {lang === "ne" ? "शहर" : "City"}
            </label>
            <CitySelect id="job-city" value={city} onChange={setCity} lang={lang} required />
          </div>
          <div>
            <label className="label" htmlFor="job-area">
              {lang === "ne" ? "क्षेत्र (वैकल्पिक)" : "Area (optional)"}
            </label>
            <input
              id="job-area"
              className="input"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={lang === "ne" ? "जस्तै ठमेल" : "e.g. Thamel"}
            />
          </div>
          <p className="text-xs text-ink-muted sm:col-span-2">
            {lang === "ne"
              ? "शहर छान्दा यो काम त्यही शहरमा काम खोज्ने मानिसलाई पहिले देखिन्छ।"
              : "Choosing a city puts this job first in front of people who want to work there."}
          </p>
        </div>

        <div>
          <label className="label">{t("category", lang)}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  // Trades that are judged by the finished thing get a sensible default.
                  if (!evidenceTouched) setEvidence(DEFAULT_EVIDENCE[cat] ?? "none");
                }}
                className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                  category === cat
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-rule hover:bg-paper-dark"
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("tagsHint", lang)}</label>
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={x("phTags", lang)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t("durationMin", lang)}</label>
            <input
              type="number"
              min={5}
              max={60}
              className="input"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">{t("aiScoringToggle", lang)}</label>
            <button
              type="button"
              onClick={() => setAiScoring(!aiScoring)}
              className={`toggle ${aiScoring ? "toggle-on" : "toggle-off"}`}
              role="switch"
              aria-checked={aiScoring}
            >
              <span className={`toggle-dot ${aiScoring ? "toggle-dot-on" : "toggle-dot-off"}`} />
            </button>
            <p className="text-xs text-ink-muted mt-1">
              {aiScoring ? t("aiScoringOn", lang) : t("aiScoringOff", lang)}
            </p>
          </div>
        </div>
      </div>

      {/* Choice questions + proof of work */}
      <div className="card space-y-4">
        <div className="flex gap-3">
          <Icon name="list-check" size={18} className="mt-0.5 text-brand" />
          <p className="text-sm text-ink-light">
            {lang === "ne"
              ? "हरेक कार्यमा ३ छनोट प्रश्न (उत्तरपुस्तिकाले जाँचिने, AI होइन) र लिखित उत्तर स्वतः समावेश हुन्छ। छनोटले ३०% र लिखितले ७०% अंक बनाउँछ।"
              : "Every task automatically includes 3 choice questions (marked against an answer key, no AI) plus written answers. Choice is 30% of the score, written is 70%."}
          </p>
        </div>
        <div>
          <label className="label">
            {lang === "ne" ? "कामको प्रमाण (वैकल्पिक)" : "Proof of work (optional)"}
          </label>
          <Segmented
            name="evidence"
            value={evidence}
            onChange={(v) => {
              setEvidence(v);
              setEvidenceTouched(true);
            }}
            options={[
              { value: "none", label: lang === "ne" ? "आवश्यक छैन" : "None" },
              { value: "photos", label: lang === "ne" ? "कामका फोटो" : "Photos of work" },
              { value: "video", label: lang === "ne" ? "छोटो भिडियो" : "Short video" },
            ]}
          />
          <p className="mt-2 text-xs text-ink-muted">
            {evidence === "photos"
              ? lang === "ne"
                ? "सिलाइ, खाना, काठको काम जस्ता कामका लागि। उम्मेदवारले ४ वटासम्म फोटो थप्छन्; तपाईं आफैं हेरेर अंक दिनुहुन्छ।"
                : "For trades like sewing, cooking or carpentry. Candidates add up to 4 photos; you rate them yourself. Photos are private to you."
              : evidence === "video"
                ? lang === "ne"
                  ? "छनौट भएका उम्मेदवारसँग मात्र ९० सेकेन्डसम्मको भिडियो माग्छौं, ताकि अनुहारले पहिलो चरण प्रभावित नगरोस्। तपाईं आफैं हेरेर अंक दिनुहुन्छ; AI प्रयोग हुँदैन।"
                  : "Asked only from shortlisted candidates (up to 90 seconds), so faces never affect the first round. You rate it yourself; no AI is used on video."
                : lang === "ne"
                  ? "लिखित र छनोट प्रश्न मात्र।"
                  : "Written and choice questions only."}
          </p>
          {evidence !== "none" && (
            <p className="mt-1 text-xs text-ochre">
              {lang === "ne"
                ? "फोटो/भिडियो हेर्न तपाईंले रोजगारदाताको रूपमा लगइन गरेको हुनुपर्छ।"
                : "You need to be logged in as an employer to view photos or video."}
            </p>
          )}
        </div>
      </div>

      {/* Custom Questions */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{t("customQuestions", lang)}</h3>
            <p className="text-xs text-ink-muted">{t("customQuestionsHint", lang)}</p>
          </div>
          <button type="button" onClick={addQuestion} className="btn-secondary btn-sm">
            {t("addQuestion", lang)}
          </button>
        </div>

        {customQuestions.map((q, i) => (
          <div key={q.id} className="p-4 rounded-lg bg-paper-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">{x("questionN", lang, { n: i + 1 })}</span>
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-xs text-danger hover:underline"
              >
                {t("removeQuestion", lang)}
              </button>
            </div>
            <input
              className="input"
              placeholder="English"
              value={q.en}
              onChange={(e) => updateQuestion(i, "en", e.target.value)}
            />
            <input
              className="input"
              placeholder="नेपाली"
              value={q.ne}
              onChange={(e) => updateQuestion(i, "ne", e.target.value)}
            />
          </div>
        ))}
      </div>

      <ScoringExplainer
        lang={lang}
        audience="employer"
        aiScoring={aiScoring}
        evidence={evidence}
        title={lang === "ne" ? "उम्मेदवारले के देख्छन् र कसरी अंक दिइन्छ" : "What candidates are told, and how scoring works"}
      />

      {error && (
        <div className="p-3 rounded-lg bg-danger-light text-sm text-danger">
          {error}
        </div>
      )}

      <button type="submit" disabled={posting} className="btn-primary w-full">
        {posting ? t("posting", lang) : t("postJobBtn", lang)}
      </button>
    </form>
  );
}
