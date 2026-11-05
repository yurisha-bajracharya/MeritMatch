"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Segmented from "./Segmented";
import SharedDeviceToggle from "./SharedDeviceToggle";
import VoiceRecorder from "./VoiceRecorder";
import McqStep from "./McqStep";
import Icon from "./Icon";
import ScoringExplainer from "./ScoringExplainer";
import { saveDraft, loadDraft, clearDraft } from "@/lib/device";
import type { Lang, InputMode, Scenario, Criterion, CustomQuestion, PublicMcq, Evidence } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";

type Stage = "intro" | "mcq" | "task" | "details" | "submitting" | "done";

type Props = {
  jobId: string;
  jobTitle: string;
  employerName: string;
  durationMin: number;
  scenarios: Scenario[];
  rubric: Criterion[];
  customQuestions: CustomQuestion[];
  aiScoring: boolean;
  /** Choice questions (no answer key). Empty on a job with none. */
  mcq?: PublicMcq[];
  evidence?: Evidence;
};

export default function TaskFlow({
  jobId,
  jobTitle,
  employerName,
  durationMin,
  scenarios,
  rubric,
  customQuestions,
  aiScoring,
  mcq = [],
  evidence = "none",
}: Props) {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<InputMode>("text");
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [endAt, setEndAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  // Seeds the option shuffle. Fresh per visit; answers store the ORIGINAL index.
  const [seed] = useState(() => Math.random().toString(36).slice(2));
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  // Characters pasted in (not typed). Reported to the server as an advisory
  // signal for the employer; it never changes the score.
  const pasteChars = useRef(0);

  // The questions the candidate sees (custom if set, otherwise scenarios)
  const questions: { id: string; prompt: Record<Lang, string> }[] =
    customQuestions.length > 0
      ? customQuestions.map((q) => ({ id: q.id, prompt: q.prompt }))
      : scenarios;

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(jobId);
    if (draft) {
      setLang(draft.lang);
      setMode(draft.mode);
      setAnswers(draft.answers);
      setIndex(draft.index);
      if (draft.endAt && draft.endAt > Date.now()) {
        setEndAt(draft.endAt);
        const unanswered = mcq.some((q) => draft.answers[`mcq:${q.id}`] === undefined);
        setStage(unanswered ? "mcq" : "task");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Timer
  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const diff = Math.max(0, endAt - Date.now());
      const m = Math.floor(diff / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(`${m}:${String(s).padStart(2, "0")}`);
      if (diff <= 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [endAt]);

  // Save draft
  useEffect(() => {
    if (stage === "task" || stage === "mcq") {
      saveDraft(jobId, { lang, mode, answers, index, endAt });
    }
  }, [answers, index, lang, mode, endAt, jobId, stage]);

  const startTask = () => {
    const end = Date.now() + durationMin * 60_000;
    setEndAt(end);
    setStage(mcq.length > 0 ? "mcq" : "task");
  };

  const setAnswer = (id: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [id]: text }));
  };

  const handleVoice = useCallback(
    (text: string) => {
      const q = questions[index];
      if (q) setAnswer(q.id, (answers[q.id] ?? "") + " " + text);
    },
    [index, answers, questions],
  );

  const handleSubmit = async () => {
    setStage("submitting");
    setError("");

    const mcqList = mcq.map((q) => ({
      id: q.id,
      choice: Number(answers[`mcq:${q.id}`] ?? -1),
    }));

    const answerList = questions.map((q) => ({
      scenarioId: q.id,
      text: answers[q.id] ?? "",
    }));

    // Start time = end time minus the allowed duration. Derived from endAt so
    // it is still right when the candidate resumed from a saved draft.
    const startedAt = endAt ? endAt - durationMin * 60_000 : Date.now();
    const elapsedSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          language: lang,
          input_mode: mode,
          answers: answerList,
          mcq: mcqList,
          candidate_name: name,
          candidate_phone: phone,
          candidate_gender: gender,
          candidate_region: region,
          elapsed_sec: elapsedSec,
          paste_chars: pasteChars.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setResult(data);
      setSubmissionId(data.submissionId);
      setAccessToken(data.accessToken ?? "");
      try {
        // Lets the candidate find their result again on this device.
        localStorage.setItem(`mm_outcome_${data.submissionId}`, data.accessToken ?? "");
      } catch {}
      clearDraft(jobId);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStage("details");
    }
  };

  // --- INTRO ---
  if (stage === "intro") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card">
          <h2 className="section-title">{jobTitle}</h2>
          <p className="text-sm text-ink-light mt-1">{employerName}</p>

          <p className="text-sm text-ink mt-4">{t("taskIntro", lang)}</p>

          <div className="mt-4 p-3 rounded-lg bg-brand-light text-sm text-brand">
            {t("minuteTask", lang, { min: String(durationMin) })}
            {aiScoring && <span className="ml-2 badge-ochre text-[10px]">{t("aiScored", lang)}</span>}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">{t("english", lang)} / {t("nepali", lang)}</label>
              <Segmented
                name="language"
                value={lang}
                onChange={setLang}
                options={[
                  { value: "en", label: "English" },
                  { value: "ne", label: "नेपाली" },
                ]}
              />
            </div>

            <SharedDeviceToggle lang={lang} />
          </div>

          {mcq.length > 0 && (
            <p className="mt-4 text-xs text-ink-muted">
              {lang === "ne"
                ? `पहिले ${localizeDigits(mcq.length, lang)} छोटा छनोट प्रश्न, अनि लिखित प्रश्न। टाइमर सबैमा चल्छ।`
                : `First ${mcq.length} quick choice questions, then the written questions. The timer covers both.`}
            </p>
          )}

          <button onClick={startTask} className="btn-primary mt-6 w-full">
            {t("startTask", lang)}
          </button>
        </div>

        <ScoringExplainer lang={lang} audience="candidate" aiScoring={aiScoring} evidence={evidence} />
      </div>
    );
  }

  // --- CHOICE QUESTIONS ---
  if (stage === "mcq") {
    const picked = Object.fromEntries(
      mcq
        .filter((q) => answers[`mcq:${q.id}`] !== undefined)
        .map((q) => [q.id, answers[`mcq:${q.id}`]]),
    );
    return (
      <div className="space-y-3">
        <div className="card !p-3 flex items-center justify-end">
          <span className="text-sm font-mono text-ochre font-semibold">
            {t("timeLeft", lang)}: {localizeDigits(timeLeft, lang)}
          </span>
        </div>
        <McqStep
          questions={mcq}
          lang={lang}
          picked={picked}
          seed={seed}
          onPick={(id, optionIndex) => setAnswer(`mcq:${id}`, String(optionIndex))}
          onDone={() => setStage("task")}
        />
      </div>
    );
  }

  // --- TASK ---
  if (stage === "task") {
    const q = questions[index];
    const total = questions.length;

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Timer bar */}
        <div className="card !p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-light">
              {t("scenario", lang)} {localizeDigits(index + 1, lang)}/{localizeDigits(total, lang)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Segmented
              name="input-mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "text", label: t("textMode", lang) },
                { value: "voice", label: t("voiceMode", lang) },
              ]}
            />
            <span className="text-sm font-mono text-ochre font-semibold">
              {t("timeLeft", lang)}: {localizeDigits(timeLeft, lang)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="card">
          <p className="text-sm font-medium text-ink leading-relaxed">
            {q.prompt[lang] || q.prompt.en}
          </p>

          {mode === "voice" ? (
            <div className="mt-4 space-y-3">
              <VoiceRecorder lang={lang} onResult={handleVoice} />
              {answers[q.id] && (
                <div className="p-3 rounded-lg bg-paper-dark text-sm text-ink-light">
                  {answers[q.id]}
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="input mt-4 min-h-[120px] resize-y"
              placeholder={t("typeHere", lang)}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              onPaste={(e) => {
                pasteChars.current += e.clipboardData.getData("text").length;
              }}
            />
          )}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              className="btn-ghost btn-sm"
              disabled={index === 0}
            >
              {t("back", lang)}
            </button>

            {index < total - 1 ? (
              <button
                onClick={() => setIndex(index + 1)}
                className="btn-primary btn-sm"
              >
                {t("next", lang)}
              </button>
            ) : (
              <button
                onClick={() => setStage("details")}
                className="btn-primary btn-sm"
              >
                {t("next", lang)}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DETAILS ---
  if (stage === "details") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card">
          <h3 className="text-lg font-semibold">{t("almostDone", lang)}</h3>
          <p className="text-sm text-ink-muted mt-1">{t("detailsHint", lang)}</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">{t("yourName", lang)}</label>
              <input
                className="input"
                placeholder={t("namePlaceholder", lang)}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="label">{t("yourPhone", lang)}</label>
              <input
                className="input"
                placeholder={t("phonePlaceholder", lang)}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="label">{t("gender", lang)}</label>
              <Segmented
                name="gender"
                value={gender as any}
                onChange={setGender}
                options={[
                  { value: "female", label: t("female", lang) },
                  { value: "male", label: t("male", lang) },
                  { value: "other", label: t("other", lang) },
                ]}
              />
            </div>

            <div>
              <label className="label">{t("region", lang)}</label>
              <Segmented
                name="region"
                value={region as any}
                onChange={setRegion}
                options={[
                  { value: "urban", label: t("urban", lang) },
                  { value: "rural", label: t("rural", lang) },
                ]}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-danger-light text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStage("task")} className="btn-secondary flex-1">
              {t("back", lang)}
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1">
              {t("submitAll", lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBMITTING ---
  if (stage === "submitting") {
    return (
      <div className="card text-center py-12 animate-fade-in">
        <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-ink-light mt-4">{t("submitting", lang)}</p>
      </div>
    );
  }

  // --- DONE ---
  return (
    <div className="card text-center animate-fade-in">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-moss-light text-moss">
        <Icon name="check-circle" size={30} label="Done" />
      </div>
      <h3 className="section-title">{t("taskDone", lang)}</h3>
      <p className="text-sm text-ink-light mt-2 max-w-md mx-auto">
        {t("taskDoneMsg", lang)}
      </p>

      {result && (
        <div className="mt-6 p-4 rounded-lg bg-paper-dark text-left max-w-sm mx-auto">
          <p className="text-sm font-medium">
            {t("totalScore", lang)}: <span className="text-brand font-bold">{result.total}%</span>
          </p>
          {result.mcqTotal > 0 && (
            <p className="text-xs text-ink-light mt-1">
              {lang === "ne" ? "छनोट प्रश्न" : "Choice questions"}: {localizeDigits(result.mcqCorrect, lang)}/{localizeDigits(result.mcqTotal, lang)}
              {" · "}
              {lang === "ne" ? "लिखित" : "Written"}: {localizeDigits(result.writtenScore, lang)}%
            </p>
          )}
          <p className="text-xs text-ink-muted mt-1">{result.reason}</p>
          <p className="text-xs text-ink-muted mt-1">
            {t("scoredBy", lang)}: {result.scoredBy}
          </p>
        </div>
      )}

      {submissionId && (
        <a
          href={`/outcome/${submissionId}?k=${accessToken}`}
          className="btn-primary mt-6 inline-flex"
        >
          {t("viewOutcome", lang)}
        </a>
      )}
      {submissionId && (
        <p className="mt-3 text-xs text-ink-muted max-w-sm mx-auto">
          {lang === "ne"
            ? "यो लिंक सुरक्षित राख्नुहोस्। यही लिंकबाट तपाईं नतिजा हेर्न, पहिचान साझा गर्न र फोटो/भिडियो थप्न सक्नुहुन्छ।"
            : "Keep this link. It is how you see your result, choose whether to share your details, and add photos or video."}
          {evidence === "photos" &&
            (lang === "ne" ? " यो कामले कामका फोटो माग्छ।" : " This job asks for photos of your work.")}
        </p>
      )}
    </div>
  );
}
