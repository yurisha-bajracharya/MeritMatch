"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Segmented from "./Segmented";
import Icon from "./Icon";
import { CitySelect } from "./CityPicker";
import ScoringExplainer from "./ScoringExplainer";
import { cityName } from "@/lib/places";
import { DEFAULT_EVIDENCE } from "@/lib/templates";
import { useLang } from "@/lib/useLang";
import { x } from "@/lib/i18n-extra";

import type { Category, Evidence, Lang, CustomQuestion } from "@/lib/types";
import { CATEGORIES, EMPLOYMENT_TYPES, type EmploymentType, type SalaryPeriod } from "@/lib/types";
import { EMPLOYMENT_LABEL, PERIOD_LABEL } from "@/lib/job-format";
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
  const [lang] = useLang();
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
  // Vacancy details reviewed before the job goes live.
  const [responsibilities, setResponsibilities] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("month");
  const [hours, setHours] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [noFee, setNoFee] = useState(false);
  const [gate, setGate] = useState<"loading" | "ok" | "verify" | "restricted" | "login">("loading");

  useEffect(() => {
    fetch("/api/employer/verification")
      .then(async (r) => {
        if (r.status === 401) return setGate("login");
        const d = await r.json();
        if (d.restricted) return setGate("restricted");
        setGate(d.contact_verified ? "ok" : "verify");
        if (d.business_name) setEmployerName((n) => n || d.business_name);
      })
      .catch(() => setGate("ok"));
  }, []);

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
          responsibilities,
          salary_min: salaryMin,
          salary_max: salaryMax || salaryMin,
          salary_period: salaryPeriod,
          hours,
          employment_type: employmentType,
          no_fee_confirmed: noFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "verify_contact") setGate("verify");
        if (data.code === "restricted") setGate("restricted");
        throw new Error(data.error || "Failed to post");
      }

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
        <h3 className="section-title">{lang === "ne" ? "समीक्षाका लागि पठाइयो" : "Sent for review"}</h3>
        <p className="mx-auto mt-2 max-w-md text-base text-ink-light">
          {lang === "ne"
            ? "हरेक नयाँ काम समीक्षापछि मात्र खुला हुन्छ। स्वीकृत भएपछि तपाईंलाई सूचना आउँछ र यो लिंक काम गर्न थाल्छ।"
            : "Every new job goes live only after review. You will get a notification when it is approved, and then this link will work for candidates."}
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
        <h1 className="page-title">{t("postJob", lang)}</h1>

        {gate === "verify" && (
          <div className="alert-note">
            <p className="font-semibold">{lang === "ne" ? "पहिले आफ्नो सम्पर्क प्रमाणित गर्नुहोस्" : "First, verify your contact details"}</p>
            <p className="mt-1">
              {lang === "ne"
                ? "काम पोस्ट गर्न मोबाइल नम्बर (OTP) र सम्पर्क व्यक्तिको विवरण चाहिन्छ। करिब दुई मिनेट लाग्छ।"
                : "Posting needs a confirmed mobile number (OTP) and the contact person's details. It takes about two minutes."}
            </p>
            <Link href="/employer/verify" className="btn-primary btn-sm mt-3">
              {lang === "ne" ? "प्रमाणीकरण सुरु गर्नुहोस्" : "Start verification"}
            </Link>
          </div>
        )}
        {gate === "restricted" && (
          <div className="alert-error">
            {lang === "ne"
              ? "समीक्षा चलिरहेको बेला तपाईंको खाता अस्थायी रूपमा प्रतिबन्धित छ।"
              : "Your account is temporarily restricted while a review is in progress."}{" "}
            <Link href="/employer/verify" className="underline">
              {lang === "ne" ? "विवरण" : "Details"}
            </Link>
          </div>
        )}
        {gate === "login" && <div className="alert-note">{x("errLoginEmployer", lang)}</div>}

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

        {/* Vacancy details: what applicants need to decide, and what reviewers check */}
        <div className="space-y-5 border-t border-rule pt-5">
          <h2 className="text-xl font-semibold">{lang === "ne" ? "कामको विवरण" : "About the job"}</h2>
          <div>
            <label className="label" htmlFor="job-resp">{lang === "ne" ? "काम र जिम्मेवारी" : "What the person will do"}</label>
            <textarea
              id="job-resp"
              className="input min-h-[100px]"
              required
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder={lang === "ne" ? "जस्तै: ग्राहकलाई सेवा, सामानको हिसाब, पसल मिलाउने" : "e.g. Serve customers, keep stock records, keep the shop tidy"}
            />
          </div>

          <fieldset className="min-w-0">
            <legend className="label">{lang === "ne" ? "तलब (रुपैयाँ)" : "Salary (rupees)"}</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid-cols-[1fr_auto_1fr_10rem]">
              <input
                aria-label={lang === "ne" ? "न्यूनतम" : "Minimum"}
                className="input"
                inputMode="numeric"
                required
                placeholder={lang === "ne" ? "न्यूनतम" : "From"}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value.replace(/[^\d]/g, ""))}
              />
              <span className="text-ink-muted">{lang === "ne" ? "देखि" : "to"}</span>
              <input
                aria-label={lang === "ne" ? "अधिकतम" : "Maximum"}
                className="input"
                inputMode="numeric"
                placeholder={lang === "ne" ? "अधिकतम" : "Up to"}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value.replace(/[^\d]/g, ""))}
              />
              <select
                aria-label={lang === "ne" ? "अवधि" : "Per"}
                className="input col-span-3 sm:col-span-1"
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod)}
              >
                {(["month", "day", "hour"] as SalaryPeriod[]).map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p][lang]}
                  </option>
                ))}
              </select>
            </div>
            <p className="hint">
              {lang === "ne" ? "एउटै रकम भए 'अधिकतम' खाली छोड्नुहोस्। तलब सबै आवेदकले देख्छन्।" : "Same amount? Leave 'Up to' empty. Applicants see the salary."}
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="job-type">{lang === "ne" ? "रोजगारीको प्रकार" : "Employment type"}</label>
              <select
                id="job-type"
                className="input"
                required
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              >
                <option value="">{lang === "ne" ? "छान्नुहोस्" : "Choose"}</option>
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et} value={et}>
                    {EMPLOYMENT_LABEL[et][lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="job-hours">{lang === "ne" ? "कामको समय" : "Working hours"}</label>
              <input
                id="job-hours"
                className="input"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder={lang === "ne" ? "जस्तै: आइत–शुक्र, १० देखि ६" : "e.g. Sun to Fri, 10 am to 6 pm"}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-rule p-4">
            <input
              type="checkbox"
              required
              checked={noFee}
              onChange={(e) => setNoFee(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#d92f49]"
            />
            <span className="text-base">
              {lang === "ne"
                ? "म पुष्टि गर्छु कि आवेदकसँग आवेदन, परीक्षा वा भर्ना शुल्क लिइने छैन, र म यो व्यवसायका लागि काम पोस्ट गर्न अधिकृत छु।"
                : "I confirm applicants will not be charged any application, assessment or recruitment fee, and I am authorised to post this job for the business."}
            </span>
          </label>
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
          <Icon name="list-check" size={18} className="mt-0.5 text-brand-ink" />
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

      <button type="submit" disabled={posting || gate === "verify" || gate === "restricted" || gate === "login"} className="btn-primary w-full">
        {posting ? t("posting", lang) : lang === "ne" ? "समीक्षाका लागि पठाउनुहोस्" : "Send job for review"}
      </button>
    </form>
  );
}
