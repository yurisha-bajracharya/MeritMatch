"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Stamp from "@/components/Stamp";
import VerifiedBadge from "@/components/VerifiedBadge";
import Segmented from "@/components/Segmented";
import SharedDeviceToggle from "@/components/SharedDeviceToggle";
import VoiceRecorder from "@/components/VoiceRecorder";
import {
  clearDraft,
  isShared,
  loadDraft,
  saveDraft,
  setShared,
  wipeAll,
} from "@/lib/device";
import { localizeDigits, t } from "@/lib/i18n";
import type { PublicTemplate } from "@/lib/templates";
import type { Gender, InputMode, Job, Lang, Region } from "@/lib/types";

type Stage = "intro" | "task" | "details" | "done";

function formatClock(seconds: number, lang: Lang) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return localizeDigits(`${m}:${String(s).padStart(2, "0")}`, lang);
}

export default function TaskFlow({
  job,
  template,
}: {
  job: Job;
  template: PublicTemplate;
}) {
  const [lang, setLang] = useState<Lang>("ne");
  const [mode, setMode] = useState<InputMode>("text");
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(template.durationMin * 60);
  const [timeUp, setTimeUp] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [region, setRegion] = useState<Region | "">("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  const [shared, setSharedState] = useState(false);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);

  const total = template.scenarios.length;
  const scenario = template.scenarios[index];

  // Restore an earlier attempt unless this is a shared phone.
  useEffect(() => {
    const sharedNow = isShared();
    setSharedState(sharedNow);
    const draft = loadDraft(job.id);
    if (draft) {
      setLang(draft.lang);
      setMode(draft.mode);
      setAnswers(draft.answers);
      setIndex(Math.min(draft.index, total - 1));
      setRestored(true);
      if (draft.endAt) {
        setEndAt(draft.endAt);
        setStage("task");
      }
    }
    setReady(true);
  }, [job.id, total]);

  useEffect(() => {
    if (!ready || shared || stage === "done") return;
    saveDraft(job.id, { lang, mode, answers, index, endAt });
  }, [ready, shared, stage, job.id, lang, mode, answers, index, endAt]);

  useEffect(() => {
    if (stage !== "task" || endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setTimeUp(true);
        setStage("details");
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [stage, endAt]);

  function changeShared(on: boolean) {
    setShared(on);
    setSharedState(on);
    if (on) setRestored(false);
  }

  function endSession() {
    wipeAll();
    window.location.assign("/");
  }

  function appendVoice(text: string) {
    setAnswers((a) => ({
      ...a,
      [scenario.id]: [a[scenario.id], text].filter(Boolean).join(" "),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (
      !name.trim() ||
      phone.replace(/\D/g, "").length < 7 ||
      !gender ||
      !region
    ) {
      setError(t(lang, "errorFields"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          language: lang,
          inputMode: mode,
          candidate: { name, phone, gender, region },
          answers: template.scenarios.map((s) => ({
            scenarioId: s.id,
            text: answers[s.id] ?? "",
          })),
        }),
      });
      if (res.status === 201) {
        setSubmissionId((await res.json()).id);
        clearDraft(job.id);
        setStage("done");
      } else if (res.status === 409) setError(t(lang, "errorDuplicate"));
      else if (res.status === 400) setError(t(lang, "errorFields"));
      else setError(t(lang, "errorGeneric"));
    } catch {
      setError(t(lang, "errorGeneric"));
    } finally {
      setSending(false);
    }
  }

  const header = (
    <header className="py-5">
      <p className="text-sm text-ink/75">
        {job.employer}
        {job.location ? `, ${job.location}` : ""}
      </p>
      <p className="font-semibold text-brand">{job.title}</p>
    </header>
  );

  return (
    <main lang={lang}>
      {stage === "intro" && (
        <>
          <div className="pt-5">
            <span className="font-semibold text-brand">MeritMatch</span>
          </div>
          <section className="border-t border-rule mt-5 pt-8">
            {job.verified && (
              <div className="mb-6">
                <VerifiedBadge lang={lang} />
              </div>
            )}
            <p className="text-sm text-ink/75">
              {job.employer}
              {job.location ? `, ${job.location}` : ""}
            </p>
            <h1 className="font-display text-4xl leading-tight text-brand mt-1">
              {job.title}
            </h1>
            <p className="mt-4 text-lg font-semibold">
              {t(lang, "minutes", {
                n: localizeDigits(template.durationMin, lang),
              })}
            </p>
            <p className="mt-3">{t(lang, "introBody")}</p>
          </section>

          <section className="border-t border-rule mt-8 pt-6 space-y-6">
            <Segmented
              legend={t(lang, "language")}
              value={lang}
              onChange={setLang}
              options={[
                { value: "ne", label: "नेपाली" },
                { value: "en", label: "English" },
              ]}
            />
            <Segmented
              legend={t(lang, "inputMode")}
              value={mode}
              onChange={setMode}
              options={[
                { value: "text", label: t(lang, "type") },
                { value: "voice", label: t(lang, "voice") },
              ]}
            />
            <SharedDeviceToggle
              lang={lang}
              shared={shared}
              onChange={changeShared}
            />
            {restored && !shared && (
              <p className="border-l-4 border-ochre pl-3" role="status">
                {t(lang, "restored")}
              </p>
            )}
          </section>

          <div className="border-t border-rule mt-8 pt-6">
            <button
              type="button"
              className="btn btn-proof w-full"
              onClick={() => {
                setEndAt(Date.now() + template.durationMin * 60_000);
                setStage("task");
              }}
            >
              {t(lang, "start")}
            </button>
          </div>
        </>
      )}

      {stage === "task" && scenario && (
        <>
          <div className="sticky top-0 z-10 bg-paper border-b border-rule py-3 flex items-center justify-between">
            <span className="text-sm">
              {t(lang, "situation", {
                n: localizeDigits(index + 1, lang),
                m: localizeDigits(total, lang),
              })}
            </span>
            <span className="text-right">
              <span className="block text-xs text-ink/75">
                {t(lang, "timeLeft")}
              </span>
              <span
                className={`block text-2xl font-semibold tabular-nums ${remaining <= 120 ? "text-ink underline decoration-ochre decoration-4 underline-offset-4" : "text-brand"}`}
                role="timer"
              >
                {formatClock(remaining, lang)}
              </span>
            </span>
          </div>

          <section className="pt-6">
            <p className="whitespace-pre-line text-lg">
              {scenario.prompt[lang]}
            </p>
          </section>

          <section className="border-t border-rule mt-6 pt-6 space-y-4">
            <label htmlFor="answer" className="block text-sm font-medium">
              {t(lang, "yourAnswer")}
            </label>
            <textarea
              id="answer"
              key={scenario.id}
              className="field min-h-48 text-base"
              value={answers[scenario.id] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [scenario.id]: e.target.value }))
              }
              placeholder={t(lang, "placeholder")}
            />
            {mode === "voice" && (
              <VoiceRecorder lang={lang} onText={appendVoice} />
            )}
          </section>

          <div className="border-t border-rule mt-6 pt-6 flex gap-3">
            {index > 0 && (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => setIndex(index - 1)}
              >
                {t(lang, "back")}
              </button>
            )}
            {index < total - 1 ? (
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => setIndex(index + 1)}
              >
                {t(lang, "next")}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-proof flex-1"
                onClick={() => setStage("details")}
              >
                {t(lang, "finish")}
              </button>
            )}
          </div>
        </>
      )}

      {stage === "details" && (
        <>
          {header}
          <form
            onSubmit={submit}
            className="border-t border-rule pt-6 space-y-6"
            noValidate
          >
            {timeUp && (
              <p className="border-l-4 border-ochre pl-3" role="status">
                {t(lang, "timeUp")}
              </p>
            )}
            <div>
              <h1 className="font-display text-3xl text-brand">
                {t(lang, "aboutYou")}
              </h1>
              <p className="mt-2 text-sm">{t(lang, "aboutYouNote")}</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                {t(lang, "name")}
              </label>
              <input
                id="name"
                className="field"
                autoComplete={shared ? "off" : "name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                {t(lang, "phone")}
              </label>
              <input
                id="phone"
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete={shared ? "off" : "tel"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
            <Segmented
              legend={t(lang, "gender")}
              value={gender as Gender}
              onChange={setGender}
              options={[
                { value: "female", label: t(lang, "female") },
                { value: "male", label: t(lang, "male") },
                { value: "other", label: t(lang, "other") },
              ]}
            />
            <Segmented
              legend={t(lang, "region")}
              value={region as Region}
              onChange={setRegion}
              options={[
                { value: "urban", label: t(lang, "urban") },
                { value: "rural", label: t(lang, "rural") },
              ]}
            />

            {error && (
              <p role="alert" className="border-l-4 border-ink pl-3">
                {error}
              </p>
            )}

            <div className="border-t border-rule pt-6">
              <button
                type="submit"
                className="btn btn-proof w-full"
                disabled={sending}
              >
                {sending ? t(lang, "sending") : t(lang, "submit")}
              </button>
            </div>
          </form>
        </>
      )}

      {stage === "done" && (
        <>
          {header}
          <section className="border-t border-rule pt-8 flex flex-col items-center text-center">
            <Stamp
              size={140}
              center={t(lang, "doneStamp")}
              label="ANSWERS RECEIVED"
              tone="moss"
            />
            <h1 className="font-display text-3xl text-brand mt-6">
              {t(lang, "doneTitle")}
            </h1>
            <p className="mt-2 text-lg">{t(lang, "doneBlind")}</p>
          </section>
          <section className="border-t border-rule mt-8 pt-6">
            <h2 className="font-semibold">{t(lang, "nextHeading")}</h2>
            <ol className="mt-3">
              {(["next1", "next2", "next3"] as const).map((k, i) => (
                <li key={k} className="ledger-row flex gap-3">
                  <span className="font-semibold text-brand w-6 shrink-0">
                    {localizeDigits(i + 1, lang)}
                  </span>
                  <span>{t(lang, k)}</span>
                </li>
              ))}
            </ol>
            {submissionId && !shared && (
              <div className="mt-6">
                <Link
                  href={`/outcome/${submissionId}`}
                  className="btn btn-quiet w-full"
                >
                  {t(lang, "viewResult")}
                </Link>
                <p className="mt-2 text-sm">{t(lang, "resultNote")}</p>
              </div>
            )}
            {shared && (
              <div className="mt-6">
                <p className="border-l-4 border-ochre pl-3">
                  {t(lang, "sharedDone")}
                </p>
                <button
                  type="button"
                  className="btn btn-primary w-full mt-4"
                  onClick={endSession}
                >
                  {t(lang, "endSession")}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
