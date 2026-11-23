"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { cleanForUpload } from "@/lib/clean-upload";
import { ID_LABEL, ID_TYPES, type IdStatus, type IdType } from "@/lib/identity-types";
import type { Lang } from "@/lib/types";

type State = { status: IdStatus; doc_type: string; note: string; account_name: string; reviewed_at: string };

/** Optional ID check on the candidate dashboard. One simple upload. */
export default function IdentityVerify({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  const [s, setS] = useState<State | null>(null);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<IdType>("citizenship");
  const [name, setName] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/identity")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setS(d);
        if (d && !name) setName(d.account_name || "");
      })
      .catch(() => {});
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("doc_type", docType);
      fd.set("name_on_doc", name);
      fd.set("consent", String(consent));
      if (front) fd.set("front", await cleanForUpload(front), front.name);
      if (back) fd.set("back", await cleanForUpload(back), back.name);
      const r = await fetch("/api/identity", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setOpen(false);
      setFront(null);
      setBack(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    await fetch("/api/identity", { method: "DELETE" });
    await load();
  };

  if (!s) return null;
  const canUpload = s.status === "none" || s.status === "needs_info" || s.status === "rejected";

  return (
    <section id="identity" aria-labelledby="identity-h" className="scroll-mt-24">
      <div className="flex items-start justify-between gap-3">
        <h2 id="identity-h" className="text-xl font-semibold text-ink">
          {ne ? "परिचय प्रमाणित गर्नुहोस् (ऐच्छिक)" : "Verify your identity (optional)"}
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink-light">
        {ne
          ? "रोजगारदाताले तपाईंको नामको छेउमा “परिचयपत्र प्रमाणित” देख्छन्। उनीहरूले परिचयपत्र कहिल्यै देख्दैनन्। तपाईंको अंक वा क्रममा यसले फरक पार्दैन।"
          : "Employers see an “ID verified” badge next to your code. They never see the ID itself. It does not change your score or rank."}
      </p>

      {s.status === "approved" && (
        <p className="alert-ok mt-3 flex items-center gap-2">
          <Icon name="check-circle" size={18} />
          {ne ? "तपाईंको परिचयपत्र प्रमाणित भयो। फोटो मेटाइसकिएको छ।" : "Your ID is verified. The photos have been deleted."}
        </p>
      )}
      {s.status === "submitted" && (
        <p className="alert-note mt-3">
          {ne ? "समीक्षाको पर्खाइमा। निर्णयपछि फोटो मेटाइन्छ।" : "Waiting for review. The photos are deleted as soon as a decision is made."}
        </p>
      )}
      {(s.status === "needs_info" || s.status === "rejected") && s.note && (
        <div className="alert-note mt-3">
          <p className="font-semibold">
            {s.status === "needs_info" ? (ne ? "अझ स्पष्ट फोटो चाहिन्छ" : "We need a clearer photo") : ne ? "प्रमाणित गर्न सकिएन" : "We could not verify this ID"}
          </p>
          <p className="mt-1">{s.note}</p>
        </div>
      )}

      {canUpload && !open && (
        <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => setOpen(true)}>
          <Icon name="upload" size={16} />
          {s.status === "none" ? (ne ? "परिचयपत्र अपलोड गर्नुहोस्" : "Upload an ID") : ne ? "फेरि अपलोड गर्नुहोस्" : "Upload again"}
        </button>
      )}
      {s.status !== "none" && (
        <button type="button" className="link mt-3 block text-sm" onClick={withdraw}>
          {ne ? "हटाउनुहोस् र मेरो फोटो मेटाउनुहोस्" : "Withdraw and delete my photos"}
        </button>
      )}

      {open && canUpload && (
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-rule p-4">
          <div>
            <label className="label" htmlFor="id-type">{ne ? "परिचयपत्रको प्रकार" : "Type of ID"}</label>
            <select id="id-type" className="input" value={docType} onChange={(e) => setDocType(e.target.value as IdType)}>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ID_LABEL[t][lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="id-name">{ne ? "परिचयपत्रमा लेखिएको नाम" : "Your name as written on it"}</label>
            <input id="id-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="id-front">{ne ? "अगाडिको फोटो" : "Photo of the front"}</label>
            <input
              id="id-front"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              required
              onChange={(e) => setFront(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-rule file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </div>
          <div>
            <label className="label" htmlFor="id-back">{ne ? "पछाडिको फोटो (भए)" : "Photo of the back (if it has one)"}</label>
            <input
              id="id-back"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => setBack(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-rule file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="hint">{ne ? "सबै अक्षर पढिने गरी, उज्यालोमा खिच्नुहोस्।" : "Take it in good light so every word can be read."}</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#900000]" />
            <span className="text-sm">
              {ne
                ? "मेरिटम्याचका समीक्षकले मात्र यो हेर्न सक्छन् र निर्णयपछि फोटो मेटाइन्छ भन्ने मलाई थाहा छ। रोजगारदाताले परिचयपत्र देख्दैनन्।"
                : "I understand only a MeritMatch reviewer can see this, and the photos are deleted after the decision. Employers never see the ID."}
            </span>
          </label>
          {err && <div className="alert-error" role="alert">{err}</div>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm" disabled={busy || !consent || !front || !name.trim()}>
              {busy ? "…" : ne ? "समीक्षाका लागि पठाउनुहोस्" : "Send for review"}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
              {ne ? "रद्द" : "Cancel"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
