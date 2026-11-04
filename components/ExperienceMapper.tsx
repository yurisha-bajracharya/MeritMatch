"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";

type TranslatedSkill = { tag: string; evidence: string };

export default function ExperienceMapper({ lang: initialLang = "en" }: { lang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<TranslatedSkill[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleMap = async () => {
    setLoading(true);
    setError("");
    setSkills([]);
    setSaved(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSkills(data.skills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    const tags = skills.map((s) => s.tag);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "session",
        }),
      });
      const session = await res.json();
      if (!session.user) {
        setError("Please log in to save skills to your profile");
        return;
      }

      // Update user skills
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.user.name,
          phone: session.user.phone,
          role: session.user.role,
          skills: [...new Set([...session.user.skills, ...tags])],
          experience_text: text,
        }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save");
    }
  };

  // Group skills by evidence similarity
  const grouped = skills.reduce<Record<string, TranslatedSkill[]>>((acc, skill) => {
    const key = skill.evidence.slice(0, 40);
    (acc[key] ??= []).push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">{t("experienceMapperTitle", lang)}</h2>
            <p className="section-sub text-sm">{t("experienceMapperDesc", lang)}</p>
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

      {skills.length > 0 && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold mb-4">{t("skillsFound", lang)}</h3>

          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="p-4 rounded-lg bg-paper-dark">
                <p className="text-sm text-ink-light italic mb-2">
                  {t("evidence", lang)}: {group[0].evidence}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.map((s) => (
                    <span key={s.tag} className="badge-brand">
                      {TAG_LABELS[s.tag]?.[lang] ?? s.tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={saveToProfile} disabled={saved} className="btn-primary flex-1">
              {saved ? "✓ Saved" : t("saveToProfile", lang)}
            </button>
            <a
              href={`/jobs?tags=${skills.map((s) => s.tag).join(",")}`}
              className="btn-secondary flex-1 text-center"
            >
              {t("viewJobs", lang)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
