"use client";

import { useState } from "react";
import Segmented from "./Segmented";
import type { Category, Lang, CustomQuestion } from "@/lib/types";
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
};

export default function PostJobForm() {
  const [lang, setLang] = useState<Lang>("en");
  const [title, setTitle] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [location, setLocation] = useState("");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      setResult({
        id: data.id,
        link: `${window.location.origin}/t/${data.id}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
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
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="section-title">{t("jobPosted", lang)}</h3>
        <p className="text-sm text-ink-light mt-2">
          Share this link with candidates:
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
            placeholder="e.g. Shop Assistant"
          />
        </div>

        <div>
          <label className="label">{t("companyName", lang)}</label>
          <input
            className="input"
            required
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            placeholder="e.g. Himal Mart"
          />
        </div>

        <div>
          <label className="label">{t("location", lang)}</label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("locationPlaceholder", lang)}
          />
        </div>

        <div>
          <label className="label">{t("category", lang)}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
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
            placeholder="e.g. customer-service, numeracy"
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
              <span className="text-xs font-medium text-ink-muted">Question {i + 1}</span>
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
