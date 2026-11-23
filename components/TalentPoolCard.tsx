"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";
import { TAG_LABELS } from "@/lib/tags";
import { formatDate } from "@/lib/dates";
import { localizeDigits } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Tag = { id: string; tag: string; employer: string; job: string; score: number; at: string; expires: string; hidden: boolean };
type Invite = { id: string; job_id: string; title: string; created_at: string; submission_id: string };

/** Candidate's Top talent tags, talent pool switch and invitations. */
export default function TalentPoolCard({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  const [d, setD] = useState<{ inPool: boolean; tags: Tag[]; invites: Invite[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    fetch("/api/profile/talent-pool")
      .then((r) => (r.ok ? r.json() : null))
      .then(setD)
      .catch(() => {});
  }, []);
  useEffect(load, [load]);
  if (!d) return null;

  const post = async (body: object) => {
    setBusy(true);
    await fetch("/api/profile/talent-pool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    load();
  };

  return (
    <div className="mt-4 rounded-lg border border-ochre/30 bg-ochre-light/50 p-5">
      <p className="flex items-center gap-2 text-base font-semibold text-ink">
        <Icon name="star" size={18} className="text-ochre" />
        {ne ? "शीर्ष प्रतिभा" : "Top talent"}
      </p>
      <p className="mt-1 text-sm text-ink-light">
        {ne
          ? "रोजगारदाताले तपाईंको नाम नदेखी, कार्य राम्रो भएपछि दिने चिनो।"
          : "Given by employers after a strong task, before they knew who you were."}
      </p>
      {d.tags.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {d.tags.map((t) => (
            <li key={t.id} className={`rounded-md bg-white p-2.5 text-sm ring-1 ring-ochre/25 ${t.hidden ? "opacity-60" : ""}`}>
              <p className="font-semibold text-ink">
                {ne ? `शीर्ष प्रतिभा: ${TAG_LABELS[t.tag]?.ne ?? t.tag}` : `Top talent in ${TAG_LABELS[t.tag]?.en ?? t.tag}`}
              </p>
              <p className="text-xs text-ink-light">
                {t.employer} · {formatDate(t.at, lang, true)} · {localizeDigits(t.score, lang)}%
                {" · "}
                {ne ? `म्याद ${formatDate(t.expires, lang, true)}` : `until ${formatDate(t.expires, lang, true)}`}
              </p>
              <button type="button" disabled={busy} onClick={() => post({ tagId: t.id, hidden: !t.hidden })} className="mt-1 text-xs text-ink-muted underline-offset-2 hover:underline">
                {t.hidden ? (ne ? "फेरि देखाउनुहोस्" : "Show again") : ne ? "लुकाउनुहोस्" : "Hide"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink">{ne ? "अहिलेसम्म छैन। कामको कार्य गर्नुहोस्, राम्रो भए यहाँ देखिन्छ।" : "None yet. Do a job's task; strong work can earn one."}</p>
      )}

      <div className="mt-4 border-t border-ochre/20 pt-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" checked={d.inPool} disabled={busy} onChange={(e) => post({ join: e.target.checked })} />
          <span className="text-sm">
            <span className="font-semibold text-ink">{ne ? "प्रतिभा सूचीमा रहनुहोस्" : "Be in the talent pool"}</span>
            <span className="mt-0.5 block text-ink-light">
              {ne
                ? "प्रमाणित रोजगारदाताले तपाईंलाई खोजेर कार्यमा निम्तो दिन सक्छन्। नाम र फोन लुकाइन्छ। जुनसुकै बेला हटाउन सक्नुहुन्छ।"
                : "Verified employers can find you and invite you to a task. Name and phone stay hidden. Untick anytime."}
            </span>
          </span>
        </label>
      </div>

      {d.invites.length > 0 && (
        <div className="mt-4 border-t border-ochre/20 pt-4">
          <p className="text-sm font-semibold text-ink">{ne ? "तपाईंलाई आएका निम्तो" : "Invitations to you"}</p>
          <ul className="mt-2 space-y-1.5">
            {d.invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{i.title}</span>
                {i.submission_id ? (
                  <span className="shrink-0 text-xs text-moss">{ne ? "कार्य गरियो" : "Task done"}</span>
                ) : (
                  <Link href={`/t/${i.job_id}?invite=${i.id}`} className="link shrink-0 text-xs">
                    {ne ? "कार्य गर्नुहोस्" : "Do the task"}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
