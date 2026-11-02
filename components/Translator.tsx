"use client";

import Link from "next/link";
import { useState } from "react";
import Segmented from "@/components/Segmented";
import { t } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";
import type { Lang } from "@/lib/types";

type Skill = { tag: string; evidence: string };

/** Skills that share one explanation are shown together as chips. */
function groupByEvidence(skills: Skill[]) {
  const groups = new Map<string, string[]>();
  for (const s of skills)
    groups.set(s.evidence, [...(groups.get(s.evidence) ?? []), s.tag]);
  return [...groups].map(([evidence, tags]) => ({ evidence, tags }));
}

export default function Translator() {
  const [lang, setLang] = useState<Lang>("ne");
  const [text, setText] = useState("");
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (text.trim().length < 10) {
      setError(t(lang, "trTooShort"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!res.ok) throw new Error();
      setSkills((await res.json()).skills);
    } catch {
      setError(t(lang, "trError"));
    } finally {
      setLoading(false);
    }
  }

  const tags = skills?.map((s) => s.tag).join(",") ?? "";

  return (
    <main lang={lang}>
      <header className="py-5">
        <Link href="/" className="font-semibold text-brand">
          MeritMatch
        </Link>
      </header>

      <section className="border-t border-rule pt-8">
        <h1 className="font-display text-3xl text-brand">
          {t(lang, "trTitle")}
        </h1>
        <p className="mt-3">{t(lang, "trIntro")}</p>
      </section>

      {skills === null ? (
        <form
          onSubmit={submit}
          className="border-t border-rule mt-8 pt-6 space-y-6"
          noValidate
        >
          <Segmented
            legend={t(lang, "language")}
            value={lang}
            onChange={setLang}
            options={[
              { value: "ne", label: "नेपाली" },
              { value: "en", label: "English" },
            ]}
          />
          <div>
            <label htmlFor="work" className="block text-sm font-medium mb-2">
              {t(lang, "trLabel")}
            </label>
            <textarea
              id="work"
              className="field min-h-44 text-base"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(lang, "trPlaceholder")}
              maxLength={1500}
            />
            <p className="mt-2 text-sm">{t(lang, "trNote")}</p>
          </div>
          {error && (
            <p role="alert" className="border-l-4 border-ink pl-3">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-proof w-full"
            disabled={loading}
          >
            {loading ? t(lang, "trWorking") : t(lang, "trSubmit")}
          </button>
        </form>
      ) : (
        <>
          <section className="border-t border-rule mt-8 pt-6">
            <h2 className="font-semibold">{t(lang, "trResultTitle")}</h2>
            {skills.length === 0 ? (
              <p className="ledger-row mt-3">{t(lang, "trNone")}</p>
            ) : (
              <ul className="mt-3">
                {groupByEvidence(skills).map((g) => (
                  <li key={g.evidence} className="ledger-row">
                    <span className="flex flex-wrap gap-2">
                      {g.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block border border-brand text-brand rounded-[3px] px-2 py-0.5 text-sm font-medium"
                        >
                          {TAG_LABELS[tag]?.[lang] ?? tag}
                        </span>
                      ))}
                    </span>
                    <span className="block mt-2">{g.evidence}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="border-t border-rule mt-2 pt-6 space-y-3">
            {skills.length > 0 && (
              <Link
                href={`/jobs?tags=${tags}&lang=${lang}`}
                className="btn btn-primary w-full"
              >
                {t(lang, "trJobsCta")}
              </Link>
            )}
            <button
              type="button"
              className="btn btn-quiet w-full"
              onClick={() => {
                setSkills(null);
                setText("");
              }}
            >
              {t(lang, "trAgain")}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
