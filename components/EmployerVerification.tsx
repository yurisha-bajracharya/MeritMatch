"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { cleanForUpload } from "@/lib/clean-upload";
import type { Lang, LayerStatus } from "@/lib/types";

type Evidence = { id: string; layer: "business" | "presence"; kind: string; value: string; has_file: number; created_at: string };
type JobRow = { id: string; title: string; review_status: string; review_note: string; created_at: string };
type State = {
  phone: string;
  business_name: string;
  contact_name: string;
  contact_position: string;
  email: string;
  authorized: boolean;
  phone_verified: boolean;
  contact_verified: boolean;
  business_status: LayerStatus;
  business_note: string;
  presence_status: LayerStatus;
  presence_note: string;
  manual_note: string;
  evidence: Evidence[];
  restricted: boolean;
  restricted_reason: string;
  otp_demo: boolean;
  jobs: JobRow[];
  demo_code?: string;
};

const L = (en: string, ne: string): Record<Lang, string> => ({ en, ne });

const LAYER_STATUS: Record<LayerStatus, { label: Record<Lang, string>; cls: string }> = {
  none: { label: L("Not started", "सुरु भएको छैन"), cls: "badge-muted" },
  submitted: { label: L("Waiting for review", "समीक्षाको पर्खाइमा"), cls: "badge-ochre" },
  needs_info: { label: L("More information needed", "थप जानकारी चाहिन्छ"), cls: "badge-brand" },
  approved: { label: L("Approved", "स्वीकृत"), cls: "badge-moss" },
  rejected: { label: L("Not accepted", "स्वीकार भएन"), cls: "badge-brand" },
};

export const JOB_STATUS: Record<string, { label: Record<Lang, string>; cls: string }> = {
  pending: { label: L("Waiting for review", "समीक्षाको पर्खाइमा"), cls: "badge-ochre" },
  approved: { label: L("Live: Job Verified", "खुला: काम प्रमाणित"), cls: "badge-moss" },
  needs_info: { label: L("More information needed", "थप जानकारी चाहिन्छ"), cls: "badge-brand" },
  rejected: { label: L("Not approved", "स्वीकृत भएन"), cls: "badge-brand" },
  suspended: { label: L("Temporarily hidden", "अस्थायी रूपमा लुकाइएको"), cls: "badge-muted" },
};

const OPTIONS: Record<"business" | "presence", { kind: string; label: Record<Lang, string>; hint: Record<Lang, string>; needsFile?: boolean; link?: boolean }[]> = {
  business: [
    { kind: "pan", label: L("Business PAN", "व्यवसायको प्यान"), hint: L("Type the PAN number. A photo of the PAN certificate helps.", "प्यान नम्बर लेख्नुहोस्। प्रमाणपत्रको फोटो भए झन् राम्रो।") },
    { kind: "registration", label: L("Business registration certificate", "व्यवसाय दर्ता प्रमाणपत्र"), hint: L("Photo or PDF of the certificate. Add the number if you know it.", "प्रमाणपत्रको फोटो वा PDF। नम्बर थाहा भए लेख्नुहोस्।") },
    { kind: "ward", label: L("Municipality or ward registration", "नगरपालिका वा वडा दर्ता"), hint: L("Photo of the ward or municipality letter or certificate.", "वडा वा नगरपालिकाको पत्र वा प्रमाणपत्रको फोटो।") },
    { kind: "licence", label: L("Industry licence", "उद्योग इजाजतपत्र"), hint: L("Only if your trade needs one.", "तपाईंको पेशामा चाहिने भए मात्र।") },
    { kind: "other", label: L("Something else", "अरू केही"), hint: L("Any other proof. Explain what it is.", "अरू कुनै प्रमाण। के हो भनेर लेख्नुहोस्।") },
  ],
  presence: [
    { kind: "premises_photo", label: L("Photo of your shop, office or signboard", "पसल, कार्यालय वा साइनबोर्डको फोटो"), hint: L("A clear photo of the front with the name visible is enough.", "नाम देखिने गरी अगाडिको स्पष्ट फोटो पुग्छ।"), needsFile: true },
    { kind: "maps", label: L("Google Maps location", "गुगल म्याप लोकेसन"), hint: L("Paste the map link to your business.", "तपाईंको व्यवसायको म्याप लिंक टाँस्नुहोस्।"), link: true },
    { kind: "social", label: L("Facebook or other business page", "फेसबुक वा अरू व्यवसायिक पेज"), hint: L("Paste the link to the page.", "पेजको लिंक टाँस्नुहोस्।"), link: true },
    { kind: "website", label: L("Business website", "व्यवसायको वेबसाइट"), hint: L("Paste the address.", "ठेगाना टाँस्नुहोस्।"), link: true },
    { kind: "other", label: L("Something else", "अरू केही"), hint: L("Any other proof that the business operates here.", "व्यवसाय यहाँ चल्छ भन्ने अरू प्रमाण।") },
  ],
};

export default function EmployerVerification() {
  const [lang] = useLang();
  const ne = lang === "ne";
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/employer/verification");
    if (r.status === 401) return setNeedLogin(true);
    setS(await r.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (body: object, key: string) => {
    setBusy(key);
    setErr("");
    try {
      const r = await fetch("/api/employer/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setS((prev) => ({ ...d, demo_code: d.demo_code ?? (key === "verify" ? undefined : prev?.demo_code) }));
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy("");
    }
  };

  if (needLogin) {
    return (
      <div className="empty">
        {ne ? "रोजगारदाताको रूपमा लग इन गर्नुहोस्।" : "Log in as an employer to verify your business."}
        <div className="mt-4">
          <Link href="/signup?mode=login" className="btn-primary btn-sm">
            {ne ? "लग इन" : "Log in"}
          </Link>
        </div>
      </div>
    );
  }
  if (!s) return <div className="skeleton h-96" />;

  const steps = [
    { key: "contact", label: L("Contact", "सम्पर्क"), done: s.contact_verified, status: s.contact_verified ? "approved" : "none" },
    { key: "business", label: L("Business identity", "व्यवसायको पहिचान"), done: s.business_status === "approved", status: s.business_status },
    { key: "presence", label: L("Business presence", "व्यवसायको उपस्थिति"), done: s.presence_status === "approved", status: s.presence_status },
  ] as const;
  const doneCount = steps.filter((x) => x.done).length;

  return (
    <div>
      <header className="max-w-2xl">
        <p className="eyebrow">{ne ? "रोजगारदाता प्रमाणीकरण" : "Employer verification"}</p>
        <h1 className="page-title mt-2">{ne ? "आफ्नो व्यवसाय प्रमाणित गर्नुहोस्" : "Verify your business"}</h1>
        <p className="section-sub">
          {ne
            ? "सानो पसलदेखि ठूलो कम्पनीसम्म यो पूरा गर्न सक्छन्। हरेक चरणमा एउटा उपयुक्त प्रमाण पुग्छ। वेबसाइट वा कम्पनी इमेल चाहिँदैन।"
            : "Small shops and large companies can both finish this. One suitable item is enough for each step. You do not need a website or a company email."}
        </p>
      </header>

      {s.restricted && (
        <div className="alert-error mt-6" role="alert">
          <p className="font-semibold">{ne ? "तपाईंको खाता अस्थायी रूपमा प्रतिबन्धित छ" : "Your account is temporarily restricted"}</p>
          <p className="mt-1">{s.restricted_reason}</p>
        </div>
      )}

      {/* Progress */}
      <section className="mt-8" aria-label={ne ? "प्रगति" : "Progress"}>
        <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={doneCount}>
          <div className="progress-bar-fill" style={{ width: `${(doneCount / 3) * 100}%` }} />
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-4">
          {steps.map((st, i) => (
            <li key={st.key} className="text-sm">
              <a href={`#${st.key}`} className="font-semibold text-ink hover:underline">
                {i + 1}. {st.label[lang]}
              </a>
              <div className="mt-1">
                <span className={LAYER_STATUS[st.status as LayerStatus].cls}>
                  {st.key === "contact" ? (st.done ? (ne ? "पूरा" : "Done") : ne ? "बाँकी" : "To do") : LAYER_STATUS[st.status as LayerStatus].label[lang]}
                </span>
              </div>
            </li>
          ))}
          <li className="text-sm">
            <a href="#jobs" className="font-semibold text-ink hover:underline">
              4. {ne ? "हरेक काम" : "Each job"}
            </a>
            <p className="mt-1 text-ink-muted">{ne ? "अलग्गै समीक्षा हुन्छ" : "Reviewed one by one"}</p>
          </li>
        </ol>
      </section>

      {err && <div className="alert-error mt-6" role="alert">{err}</div>}

      <ContactStep s={s} lang={lang} busy={busy} act={act} />
      <EvidenceStep layer="business" s={s} lang={lang} reload={load} act={act} busy={busy} setErr={setErr} />
      <EvidenceStep layer="presence" s={s} lang={lang} reload={load} act={act} busy={busy} setErr={setErr} />

      <section id="jobs" className="mt-12 scroll-mt-24 border-t border-rule pt-8">
        <h2 className="section-title">4. {ne ? "हरेक काम अलग्गै समीक्षा हुन्छ" : "Every job is reviewed separately"}</h2>
        <p className="mt-2 max-w-2xl text-base text-ink-light">
          {ne
            ? "प्रमाणित रोजगारदाताको पनि हरेक नयाँ काम समीक्षा नभएसम्म पर्खाइमा रहन्छ। हामी तलब, स्थान, समय र आवेदकसँग शुल्क नलिने प्रतिज्ञा जाँच्छौं।"
            : "Even for a verified employer, each new job waits until it is reviewed. We check the salary, location, hours, and your promise not to charge applicants."}
        </p>
        {s.jobs.length ? (
          <ul className="mt-5 divide-y divide-rule border-y border-rule">
            {s.jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{j.title}</p>
                  {j.review_note && j.review_status !== "approved" && (
                    <p className="mt-1 text-sm text-ink-light">
                      <span className="font-semibold">{ne ? "समीक्षकको सन्देश: " : "Reviewer: "}</span>
                      {j.review_note}
                    </p>
                  )}
                </div>
                <span className={JOB_STATUS[j.review_status]?.cls ?? "badge-muted"}>
                  {JOB_STATUS[j.review_status]?.label[lang] ?? j.review_status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">{ne ? "अहिलेसम्म कुनै काम पोस्ट गरिएको छैन।" : "No jobs posted yet."}</p>
        )}
        <Link href="/employer/post" className="btn-secondary mt-5">
          {ne ? "काम पोस्ट गर्नुहोस्" : "Post a job"}
        </Link>
      </section>
    </div>
  );
}

function ContactStep({
  s,
  lang,
  busy,
  act,
}: {
  s: State;
  lang: Lang;
  busy: string;
  act: (b: object, k: string) => Promise<boolean>;
}) {
  const ne = lang === "ne";
  const [f, setF] = useState({
    business_name: s.business_name,
    contact_name: s.contact_name,
    contact_position: s.contact_position,
    email: s.email,
    authorized: s.authorized,
  });
  const [code, setCode] = useState("");
  const saved = Boolean(s.contact_name && s.authorized);

  return (
    <section id="contact" className="mt-12 scroll-mt-24 border-t border-rule pt-8">
      <h2 className="section-title">1. {ne ? "सम्पर्क प्रमाणीकरण" : "Contact verification"}</h2>
      <p className="mt-2 max-w-2xl text-base text-ink-light">
        {ne ? "चाहिने: मोबाइल नम्बर, तपाईंको नाम र पद, र काम पोस्ट गर्ने अनुमति छ भन्ने पुष्टि। इमेल ऐच्छिक हो।" : "Required: mobile number, your name and position, and confirmation that you may post jobs. Email is optional."}
      </p>

      <form
        className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          act({ action: "contact", ...f }, "contact");
        }}
      >
        <div className="sm:col-span-2">
          <label className="label" htmlFor="v-business">{ne ? "व्यवसायको नाम" : "Business name"}</label>
          <input id="v-business" className="input" required value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="v-name">{ne ? "तपाईंको नाम" : "Your name"}</label>
          <input id="v-name" className="input" required value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="v-pos">{ne ? "तपाईंको पद" : "Your position"}</label>
          <input
            id="v-pos"
            className="input"
            required
            placeholder={ne ? "जस्तै: सञ्चालक, प्रबन्धक" : "e.g. Owner, Manager"}
            value={f.contact_position}
            onChange={(e) => setF({ ...f, contact_position: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="v-email">{ne ? "इमेल (ऐच्छिक)" : "Email (optional)"}</label>
          <input id="v-email" type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <p className="hint">{ne ? "कुनै पनि इमेल चल्छ।" : "Any email works, Gmail is fine."}</p>
        </div>
        <div>
          <p className="label">{ne ? "मोबाइल नम्बर" : "Mobile number"}</p>
          <p className="flex min-h-[48px] items-center gap-2 text-base">
            {s.phone}
            {s.phone_verified && (
              <span className="badge-moss">
                <Icon name="check" size={13} /> {ne ? "पुष्टि भयो" : "Confirmed"}
              </span>
            )}
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={f.authorized}
            onChange={(e) => setF({ ...f, authorized: e.target.checked })}
            className="mt-1 h-5 w-5 shrink-0 accent-[#d92f49]"
          />
          <span className="text-base">
            {ne ? "म यो व्यवसायका लागि काम पोस्ट गर्न अधिकृत छु।" : "I am authorised to post jobs for this business."}
          </span>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-secondary" disabled={busy === "contact"}>
            {busy === "contact" ? "…" : ne ? "विवरण सुरक्षित गर्नुहोस्" : "Save details"}
          </button>
        </div>
      </form>

      {!s.phone_verified && (
        <div className="mt-6 max-w-2xl rounded-lg bg-paper-dark p-5">
          <p className="text-base font-semibold">{ne ? "मोबाइल नम्बर पुष्टि गर्नुहोस्" : "Confirm your mobile number"}</p>
          <p className="mt-1 text-sm text-ink-light">
            {ne ? `हामी ${s.phone} मा ६ अंकको कोड पठाउँछौं।` : `We send a 6-digit code to ${s.phone}.`}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button type="button" className="btn-secondary" disabled={busy === "otp" || !saved} onClick={() => act({ action: "send_otp" }, "otp")}>
              {s.demo_code ? (ne ? "नयाँ कोड पठाउनुहोस्" : "Send a new code") : ne ? "कोड पठाउनुहोस्" : "Send code"}
            </button>
            <div>
              <label className="label" htmlFor="v-otp">{ne ? "कोड" : "Code"}</label>
              <input
                id="v-otp"
                className="input !w-40 font-mono tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <button type="button" className="btn-primary" disabled={code.length !== 6 || busy === "verify"} onClick={() => act({ action: "verify_otp", code }, "verify")}>
              {ne ? "पुष्टि गर्नुहोस्" : "Confirm"}
            </button>
          </div>
          {!saved && <p className="hint">{ne ? "पहिले माथिको विवरण सुरक्षित गर्नुहोस्।" : "Save your details above first."}</p>}
          {s.demo_code && (
            <p className="alert-note mt-4">
              {ne ? "डेमो मोड: SMS सेवा जोडिएको छैन, त्यसैले कोड यहाँ देखाइएको छ: " : "Demo mode: no SMS service is connected, so the code is shown here: "}
              <span className="font-mono text-lg font-semibold">{s.demo_code}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function EvidenceStep({
  layer,
  s,
  lang,
  reload,
  act,
  busy,
  setErr,
}: {
  layer: "business" | "presence";
  s: State;
  lang: Lang;
  reload: () => Promise<void>;
  act: (b: object, k: string) => Promise<boolean>;
  busy: string;
  setErr: (e: string) => void;
}) {
  const ne = lang === "ne";
  const status = layer === "business" ? s.business_status : s.presence_status;
  const note = layer === "business" ? s.business_note : s.presence_note;
  const items = s.evidence.filter((e) => e.layer === layer);
  const opts = OPTIONS[layer];
  const [kind, setKind] = useState(opts[0].kind);
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const opt = opts.find((o) => o.kind === kind)!;
  const locked = status === "approved";
  const n = layer === "business" ? 2 : 3;

  const add = async () => {
    setAdding(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("layer", layer);
      fd.set("kind", kind);
      fd.set("value", value);
      if (file) fd.set("file", await cleanForUpload(file), file.name);
      const r = await fetch("/api/employer/verification/evidence", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setValue("");
      setFile(null);
      setFileKey((k) => k + 1);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/employer/verification/evidence?id=${id}`, { method: "DELETE" });
    await reload();
  };

  const labelOf = (k: string) => opts.find((o) => o.kind === k)?.label[lang] ?? k;

  return (
    <section id={layer} className="mt-12 scroll-mt-24 border-t border-rule pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">
          {n}. {layer === "business" ? (ne ? "व्यवसायको पहिचान" : "Business identity") : ne ? "व्यवसायको उपस्थिति" : "Business presence"}
        </h2>
        <span className={LAYER_STATUS[status].cls}>{LAYER_STATUS[status].label[lang]}</span>
      </div>
      <p className="mt-2 max-w-2xl text-base text-ink-light">
        {layer === "business"
          ? ne
            ? "तलका मध्ये कुनै एउटा पुग्छ। मेरिटम्याचका मानिसले हेर्छन्; हामी IRD सँग स्वचालित जाँच गर्दैनौं।"
            : "Any ONE of these is enough. A person at MeritMatch reviews it; we do not check PAN numbers with the IRD automatically."
          : ne
            ? "व्यवसाय भनिएको ठाउँमा चल्छ भन्ने एउटा प्रमाण पुग्छ। साइनबोर्डको फोटो मात्र पनि चल्छ। यो स्थलगत निरीक्षण होइन।"
            : "One item showing the business operates where you say is enough. A signboard photo alone is fine. This is not a physical inspection."}
      </p>

      {note && status !== "approved" && (
        <div className="alert-note mt-4 max-w-2xl">
          <p className="font-semibold">{ne ? "समीक्षकको सन्देश" : "Message from the reviewer"}</p>
          <p className="mt-1">{note}</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-5 max-w-2xl divide-y divide-rule border-y border-rule">
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-base font-medium">{labelOf(e.kind)}</p>
                <p className="truncate text-sm text-ink-light">
                  {e.value}
                  {e.value && e.has_file ? " · " : ""}
                  {e.has_file ? (ne ? "फाइल संलग्न" : "File attached") : ""}
                </p>
              </div>
              {!locked && (
                <button type="button" onClick={() => remove(e.id)} className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-paper-dark hover:text-danger">
                  <Icon name="trash" size={16} label={ne ? "हटाउनुहोस्" : "Remove"} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <div className="mt-5 max-w-2xl rounded-lg border border-rule p-5">
          <fieldset className="min-w-0">
            <legend className="label">{ne ? "तपाईंसँग के छ?" : "What can you provide?"}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {opts.map((o) => (
                <label
                  key={o.kind}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${kind === o.kind ? "border-ink" : "border-rule hover:border-field"}`}
                >
                  <input type="radio" name={`kind-${layer}`} checked={kind === o.kind} onChange={() => setKind(o.kind)} className="mt-1 h-4 w-4 shrink-0 accent-[#d92f49]" />
                  <span className="text-sm font-medium">{o.label[lang]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="hint">{opt.hint[lang]}</p>

          {!opt.needsFile && (
            <div className="mt-4">
              <label className="label" htmlFor={`val-${layer}`}>
                {opt.link ? (ne ? "लिंक" : "Link") : kind === "pan" ? (ne ? "प्यान नम्बर" : "PAN number") : ne ? "विवरण" : "Details"}
              </label>
              <input id={`val-${layer}`} className="input" value={value} onChange={(e) => setValue(e.target.value)} inputMode={opt.link ? "url" : "text"} />
            </div>
          )}
          {!opt.link && (
            <div className="mt-4">
              <label className="label" htmlFor={`file-${layer}`}>
                {opt.needsFile ? (ne ? "फोटो" : "Photo") : ne ? "फोटो वा PDF (ऐच्छिक)" : "Photo or PDF (optional)"}
              </label>
              <input
                key={fileKey}
                id={`file-${layer}`}
                type="file"
                accept="image/*,application/pdf"
                capture={opt.needsFile ? "environment" : undefined}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-rule file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
              />
              <p className="hint">{ne ? "बढीमा ५ MB। फाइल मेरिटम्याचका समीक्षकले मात्र हेर्छन्।" : "Up to 5 MB. Only MeritMatch reviewers can open it."}</p>
            </div>
          )}
          <button type="button" className="btn-secondary mt-4" disabled={adding || (!value && !file)} onClick={add}>
            <Icon name="plus" size={16} />
            {adding ? "…" : ne ? "थप्नुहोस्" : "Add"}
          </button>
        </div>
      )}

      {!locked && status !== "submitted" && (
        <div className="mt-5 max-w-2xl">
          <button
            type="button"
            className="btn-primary"
            disabled={!items.length || busy === `submit-${layer}`}
            onClick={() => act({ action: "submit_layer", layer }, `submit-${layer}`)}
          >
            {ne ? "समीक्षाका लागि पठाउनुहोस्" : "Send for review"}
          </button>
          {!items.length && <p className="hint">{ne ? "पहिले कम्तीमा एउटा प्रमाण थप्नुहोस्।" : "Add at least one item first."}</p>}

          <button type="button" className="link mt-4 block text-sm" onClick={() => setManual((m) => !m)} aria-expanded={manual}>
            {ne ? "यीमध्ये केही छैन? हातैले समीक्षा माग्नुहोस्" : "Don't have any of these? Ask for a manual review"}
          </button>
          {manual && (
            <div className="mt-3">
              <label className="label" htmlFor={`manual-${layer}`}>
                {ne ? "आफ्नो अवस्था बताउनुहोस्" : "Explain your situation"}
              </label>
              <textarea
                id={`manual-${layer}`}
                className="input min-h-[90px]"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={ne ? "जस्तै: घरमै सिलाइ गर्छु, दर्ता छैन, वडाबाट सिफारिस लिन सक्छु।" : "e.g. I sew from home, not registered yet, I can get a ward recommendation."}
              />
              <button
                type="button"
                className="btn-secondary mt-3"
                disabled={!manualText.trim() || busy === `manual-${layer}`}
                onClick={() => act({ action: "submit_layer", layer, note: manualText }, `manual-${layer}`)}
              >
                {ne ? "हातैले समीक्षा माग्नुहोस्" : "Request manual review"}
              </button>
            </div>
          )}
        </div>
      )}
      {status === "submitted" && (
        <p className="mt-5 max-w-2xl text-sm text-ink-light">
          {ne
            ? "समीक्षाका लागि पठाइयो। थप चाहिए हामी सूचना पठाउँछौं। अझै प्रमाण थप्न सक्नुहुन्छ।"
            : "Sent for review. We will notify you if we need anything else. You can still add items."}
        </p>
      )}
    </section>
  );
}
