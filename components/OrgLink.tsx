"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

/** Link to a training organisation, sharing only job outcomes, with consent. */
export default function OrgLink({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  const [s, setS] = useState<{ linked: boolean; name?: string } | null>(null);
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/profile/org")
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => {});
    try {
      const c = localStorage.getItem("mm_org");
      if (c) setCode(c);
    } catch {}
  }, []);

  const link = async () => {
    setErr("");
    const r = await fetch("/api/profile/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, consent }),
    });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Failed");
    setS(d);
  };
  const unlink = async () => {
    await fetch("/api/profile/org", { method: "DELETE" });
    setS({ linked: false });
  };

  if (!s) return null;
  return (
    <section aria-labelledby="org-h">
      <h2 id="org-h" className="text-xl font-semibold text-ink">{ne ? "तालिम दिने संस्था" : "Your training organisation"}</h2>
      {s.linked ? (
        <>
          <p className="mt-2 text-base">{s.name}</p>
          <p className="mt-1 text-sm text-ink-light">
            {ne
              ? "उनीहरूले तपाईंको कामको नतिजा (नियुक्ति, ९० दिनसम्म काम, औपचारिक रोजगारी) देख्छन्, उत्तर होइन।"
              : "They see your job outcomes (hired, still working at 90 days, formal job), never your answers."}
          </p>
          <button type="button" onClick={unlink} className="link mt-2 text-sm">
            {ne ? "साझा गर्न बन्द गर्नुहोस्" : "Stop sharing"}
          </button>
        </>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-ink-light">
            {ne ? "कुनै संस्थाबाट तालिम लिनुभयो? उनीहरूको कोड लेख्नुहोस्।" : "Trained with an organisation? Enter its code."}
          </p>
          <label className="sr-only" htmlFor="org-code">{ne ? "संस्थाको कोड" : "Organisation code"}</label>
          <input id="org-code" className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SABAL" />
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#900000]" />
            {ne ? "म यो संस्थासँग मेरो कामको नतिजा साझा गर्न सहमत छु।" : "I agree to share my job outcomes with this organisation."}
          </label>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button type="button" className="btn-secondary btn-sm" disabled={!code.trim() || !consent} onClick={link}>
            {ne ? "जोड्नुहोस्" : "Link"}
          </button>
        </div>
      )}
    </section>
  );
}
