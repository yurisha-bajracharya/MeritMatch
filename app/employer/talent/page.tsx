"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Icon from "@/components/Icon";
import { useLang } from "@/lib/useLang";
import { localizeDigits } from "@/lib/i18n";
import { formatDate } from "@/lib/dates";
import { TAG_LABELS } from "@/lib/tags";
import { cityName } from "@/lib/places";

type Person = {
  id: string;
  skills: string[];
  topTalent: { tag: string; employer: string; at: string; score: number }[];
  bestScore: number | null;
  tasks: number;
  cities: string[];
  invited: { job_id: string; applied: boolean }[];
};
type Job = { id: string; title: string; category: string };

const SKILLS = Object.keys(TAG_LABELS);

export default function TalentSearchPage() {
  const [lang] = useLang();
  const ne = lang === "ne";
  const n = (v: number | string) => localizeDigits(v, lang);
  const [skill, setSkill] = useState("");
  const [people, setPeople] = useState<Person[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [needLogin, setNeedLogin] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [showMsg, setShowMsg] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/employer/talent?skill=${encodeURIComponent(skill)}`)
      .then((r) => (r.status === 401 ? (setNeedLogin(true), null) : r.json()))
      .then((d) => {
        if (!d) return;
        setPeople(d.people);
        setJobs(d.jobs);
        setJobId((cur) => cur || d.jobs[0]?.id || "");
      })
      .catch(() => setPeople([]));
  }, [skill]);
  useEffect(() => {
    setPicked(new Set());
    load();
  }, [load]);

  const invitable = useMemo(() => (people ?? []).filter((p) => !p.invited.some((i) => i.job_id === jobId)), [people, jobId]);
  const allPicked = invitable.length > 0 && invitable.every((p) => picked.has(p.id));

  const togglePick = (id: string) =>
    setPicked((s) => {
      const nx = new Set(s);
      nx.has(id) ? nx.delete(id) : nx.add(id);
      return nx;
    });

  const send = async () => {
    setBusy(true);
    setErr("");
    setResult("");
    try {
      const r = await fetch("/api/employer/talent/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...picked], job_id: jobId, message }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setResult(
        ne
          ? `${n(d.sent)} जनालाई निम्तो पठाइयो।${d.already ? ` ${n(d.already)} जना पहिले नै निम्त्याइएका वा आवेदन दिइसकेका।` : ""}${d.unreachable ? ` ${n(d.unreachable)} जनाको खाता नभएकाले पुग्न सकिएन।` : ""}`
          : `Invitation sent to ${d.sent} ${d.sent === 1 ? "person" : "people"}.${d.already ? ` ${d.already} already invited or applied.` : ""}${d.unreachable ? ` ${d.unreachable} have no account to notify.` : ""}`,
      );
      setPicked(new Set());
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (needLogin)
    return (
      <>
        <Navbar />
        <main className="container-main py-12">
          <p>{ne ? "रोजगारदाताको रूपमा लगइन गर्नुहोस्।" : "Log in as an employer."}</p>
          <Link href="/signup?mode=login" className="btn-primary mt-4">{ne ? "लगइन" : "Log in"}</Link>
        </main>
      </>
    );

  return (
    <>
      <Navbar />
      <main className="container-main max-w-4xl py-8 pb-40 sm:py-12">
        <Link href="/employer/dashboard" className="link text-sm">
          {ne ? "← मेरा कामहरू" : "← My jobs"}
        </Link>
        <h1 className="page-title mt-3">{ne ? "प्रतिभा खोज्नुहोस्" : "Find top talent"}</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-light">
          {ne
            ? "प्रतिभा सूचीमा आफैं जोडिएका मानिस। नाम, फोन, लिङ्ग, उमेर र ठेगाना देखिँदैन। छान्नुहोस् र आफ्नो कामको कार्यमा निम्तो पठाउनुहोस्।"
            : "People who chose to join the talent pool. No names, phones, gender, age or home district. Pick people and invite them to your job's task."}
        </p>

        {/* filter */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block sm:w-72">
            <span className="label">{ne ? "सीप" : "Skill"}</span>
            <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">{ne ? "सबै सीप" : "All skills"}</option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {TAG_LABELS[s][lang]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-ink-muted sm:pb-3">
            {people ? (ne ? `${n(people.length)} जना` : `${people.length} ${people.length === 1 ? "person" : "people"}`) : ""}
          </p>
        </div>

        {/* list */}
        {people === null ? (
          <p className="mt-8 text-ink-muted">{ne ? "लोड हुँदै…" : "Loading…"}</p>
        ) : people.length === 0 ? (
          <div className="empty mt-8">{ne ? "यो सीपमा अहिले कोही छैन।" : "Nobody with this skill in the pool yet."}</div>
        ) : (
          <>
            <label className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={allPicked}
                onChange={() => setPicked(allPicked ? new Set() : new Set(invitable.map((p) => p.id)))}
              />
              {ne ? "सबै छान्नुहोस्" : "Select all"}
            </label>
            <ul className="mt-3 space-y-3">
              {people.map((p) => {
                const inv = p.invited.find((i) => i.job_id === jobId);
                const top = p.topTalent.filter((t) => !skill || t.tag === skill);
                return (
                  <li key={p.id} className={`rounded-lg border p-4 ${picked.has(p.id) ? "border-brand bg-brand-light/30" : "border-rule"}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`${ne ? "छान्नुहोस्" : "Select"} ${p.id}`}
                        className="mt-1 h-5 w-5 shrink-0 accent-brand"
                        checked={picked.has(p.id)}
                        disabled={Boolean(inv)}
                        onChange={() => togglePick(p.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold">{p.id}</span>
                          <span className="text-sm text-ink-light">
                            {p.bestScore !== null
                              ? ne
                                ? `उत्कृष्ट कार्य अंक ${n(p.bestScore)}% · ${n(p.tasks)} कार्य`
                                : `Best task ${p.bestScore}% · ${p.tasks} ${p.tasks === 1 ? "task" : "tasks"}`
                              : ne ? "कार्य गरेको छैन" : "No task yet"}
                          </span>
                        </div>
                        {top.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {top.map((t) => (
                              <span key={t.tag + t.at} className="badge-ochre !whitespace-normal flex-wrap !gap-x-1 !gap-y-0 text-left">
                                <Icon name="star" size={12} />
                                {ne ? `शीर्ष प्रतिभा: ${TAG_LABELS[t.tag]?.ne}` : `Top talent in ${TAG_LABELS[t.tag]?.en}`}
                                <span className="font-normal text-ink-light">
                                  · {t.employer} · {formatDate(t.at, lang, true)} · {n(t.score)}%
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.skills.slice(0, 6).map((s) => (
                            <span key={s} className="badge-muted">
                              {TAG_LABELS[s]?.[lang] ?? s}
                            </span>
                          ))}
                        </div>
                        {p.cities.length > 0 && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                            <Icon name="pin" size={12} />
                            {ne ? "काम गर्न चाहने ठाउँ: " : "Willing to work in: "}
                            {p.cities.map((c) => cityName(c, lang)).join(", ")}
                          </p>
                        )}
                        {inv && (
                          <p className="mt-2 text-xs font-medium text-moss">
                            {inv.applied
                              ? ne ? "निम्तोपछि कार्य गरिसके" : "Did the task after your invitation"
                              : ne ? "यो कामका लागि निम्त्याइसकियो" : "Already invited to this job"}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {result && <div className="alert-note mt-6" role="status">{result}</div>}
        {err && <p className="mt-4 text-sm text-danger" role="alert">{err}</p>}
      </main>

      {/* invite bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-white/95 backdrop-blur">
        <div className="container-main flex max-w-4xl flex-col gap-2 py-3 sm:flex-row sm:items-end">
          {jobs.length === 0 ? (
            <p className="text-sm text-ink-light">
              {ne ? "निम्तो पठाउन पहिले खुला काम चाहिन्छ। " : "You need an open job to invite people to. "}
              <Link href="/employer/post" className="link">{ne ? "काम पोस्ट गर्नुहोस्" : "Post a job"}</Link>
            </p>
          ) : (
            <>
              <label className="block min-w-0 sm:w-56">
                <span className="label !mb-1 text-xs">{ne ? "कुन कामको कार्य?" : "Task for which job?"}</span>
                <select className="input !py-2" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`min-w-0 flex-1 ${showMsg ? "block" : "hidden sm:block"}`}>
                <span className="label !mb-1 text-xs">{ne ? "सन्देश (ऐच्छिक)" : "Message (optional)"}</span>
                <input
                  className="input !py-2"
                  maxLength={400}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={ne ? "तपाईंको सीप हाम्रो कामसँग मिल्छ। छोटो कार्य गरिदिनुहोस्।" : "Your skills fit our job. Please try our short task."}
                />
              </label>
              <div className="flex items-center gap-2">
              {!showMsg && (
                <button type="button" className="btn-ghost btn-sm shrink-0 sm:hidden" onClick={() => setShowMsg(true)}>
                  {ne ? "+ सन्देश" : "+ Message"}
                </button>
              )}
              <button type="button" className="btn-primary flex-1 sm:flex-none" disabled={busy || picked.size === 0} onClick={send}>
                {busy ? (ne ? "पठाउँदै…" : "Sending…") : ne ? `निम्तो पठाउनुहोस् (${n(picked.size)})` : `Send invitation (${picked.size})`}
              </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
