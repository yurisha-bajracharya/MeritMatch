"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import Icon from "./Icon";
import { CATEGORY_LABEL, REPORT_CATEGORIES, type ReportCategory } from "@/lib/reports";
import { cleanForUpload } from "@/lib/clean-upload";
import type { Lang } from "@/lib/types";

/**
 * "Report a problem" for any job or employer, verified or not. Opens a short
 * form in a dialog. Free, private, and the employer never learns who reported.
 */
export default function ReportButton({
  jobId,
  employerId,
  about,
  lang,
  variant = "link",
}: {
  jobId?: string;
  employerId?: string;
  /** Shown in the dialog so the person knows what they are reporting. */
  about: string;
  lang: Lang;
  variant?: "link" | "button";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  // The form is only rendered while the dialog is open, so a page with many
  // jobs does not carry many hidden copies of it.
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; link: string } | null>(null);
  const ne = lang === "ne";

  const open = () => {
    setError("");
    setIsOpen(true);
    requestAnimationFrame(() => ref.current?.showModal());
  };
  const close = () => {
    ref.current?.close();
    setIsOpen(false);
    if (done) {
      setDone(null);
      setCategory("");
      setDescription("");
      setContact("");
      setFiles([]);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError(ne ? "समस्या के हो छान्नुहोस्।" : "Choose what the problem is.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("description", description);
      fd.set("contact", contact);
      if (jobId) fd.set("job_id", jobId);
      if (employerId) fd.set("employer_id", employerId);
      for (const f of files) fd.append("files", await cleanForUpload(f), f.name);
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={
          variant === "button"
            ? "btn-secondary btn-sm"
            : "inline-flex min-h-[36px] items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-danger hover:underline"
        }
      >
        <Icon name="alert" size={15} />
        {ne ? "समस्या रिपोर्ट गर्नुहोस्" : "Report a problem"}
      </button>

      <dialog
        ref={ref}
        className="m-auto w-[min(34rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-2rem)] rounded-lg border border-rule bg-white p-0 text-ink backdrop:bg-ink/40"
        aria-labelledby={`${uid}-title`}
        onClose={() => setIsOpen(false)}
      >
        {isOpen && (
        <>
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 id={`${uid}-title`} className="text-xl font-semibold">
              {ne ? "समस्या रिपोर्ट गर्नुहोस्" : "Report a problem"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-ink-muted">{about}</p>
          </div>
          <button type="button" onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-paper-dark">
            <Icon name="x" size={20} label={ne ? "बन्द गर्नुहोस्" : "Close"} />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-6">
            <p className="flex items-center gap-2 text-lg font-semibold text-moss">
              <Icon name="check-circle" size={22} />
              {ne ? "रिपोर्ट पठाइयो" : "Report sent"}
            </p>
            <p className="mt-3 text-base">
              {ne
                ? "यो समस्या रिपोर्ट गर्नुभएकोमा धन्यवाद। हाम्रो टोलीले तपाईंको रिपोर्ट हेर्नेछ। तपाईंको रिपोर्ट सार्वजनिक रूपमा देखाइँदैन।"
                : "Thank you for reporting this issue. Our team will review your report. Your report will not be displayed publicly."}
            </p>
            <p className="mt-4 text-sm text-ink-light">{ne ? "तपाईंको रिपोर्ट नम्बर" : "Your report reference"}</p>
            <p className="font-mono text-2xl font-semibold tracking-wider">{done.ref}</p>
            <p className="mt-3 text-sm text-ink-light">
              {ne
                ? "स्थिति हेर्न यो लिंक सुरक्षित राख्नुहोस्। लिंक भएकाले मात्र यो रिपोर्ट हेर्न सक्छ।"
                : "Keep this link to check the status. Only someone with the link can see it."}
            </p>
            <Link href={done.link} className="link mt-1 inline-block break-all text-sm">
              {typeof window !== "undefined" ? window.location.origin : ""}
              {done.link}
            </Link>
            <div className="mt-6">
              <button type="button" onClick={close} className="btn-primary">
                {ne ? "ठीक छ" : "Done"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 overflow-y-auto px-5 py-5">
            <fieldset className="min-w-0">
              <legend className="label">{ne ? "के भयो?" : "What happened?"}</legend>
              <div className="space-y-1">
                {REPORT_CATEGORIES.map((c) => (
                  <label key={c} className="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-paper-dark">
                    <input
                      type="radio"
                      name={`${uid}-category`}
                      value={c}
                      checked={category === c}
                      onChange={() => setCategory(c)}
                      className="h-4 w-4 shrink-0 accent-[#900000]"
                    />
                    <span className="text-base">{CATEGORY_LABEL[c][lang]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${uid}-desc`} className="label">
                {ne ? "छोटकरीमा बताउनुहोस् (ऐच्छिक)" : "Tell us briefly (optional)"}
              </label>
              <textarea
                id={`${uid}-desc`}
                className="input min-h-[90px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-files`} className="label">
                {ne ? "स्क्रिनसट वा प्रमाण (ऐच्छिक, ३ सम्म)" : "Screenshots or proof (optional, up to 3)"}
              </label>
              <input
                id={`${uid}-files`}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-rule file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
              />
            </div>

            <div>
              <label htmlFor={`${uid}-contact`} className="label">
                {ne ? "हामीले सम्पर्क गर्ने फोन वा इमेल (ऐच्छिक)" : "Phone or email if we may contact you (optional)"}
              </label>
              <input id={`${uid}-contact`} className="input" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} />
              <p className="hint">
                {ne
                  ? "रोजगारदाताले कहिल्यै थाहा पाउँदैनन् कि कसले रिपोर्ट गर्‍यो। रिपोर्ट गर्न निःशुल्क छ।"
                  : "The employer is never told who reported. Reporting is free."}
              </p>
            </div>

            {error && <div className="alert-error" role="alert">{error}</div>}

            <div className="flex flex-wrap gap-3 border-t border-rule pt-4">
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? (ne ? "पठाउँदै…" : "Sending…") : ne ? "रिपोर्ट पठाउनुहोस्" : "Send report"}
              </button>
              <button type="button" onClick={close} className="btn-ghost">
                {ne ? "रद्द" : "Cancel"}
              </button>
            </div>
          </form>
        )}
        </>
        )}
      </dialog>
    </>
  );
}
