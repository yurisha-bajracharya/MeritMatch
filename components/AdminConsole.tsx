"use client";

import { useCallback, useEffect, useState } from "react";
import { TAG_LABELS } from "@/lib/tags";
import Icon from "./Icon";
import { CATEGORY_LABEL, REPORT_CATEGORIES, REPORT_STATUSES, STATUS_LABEL, type ReportCategory, type ReportStatus } from "@/lib/reports";
import { EMPLOYMENT_LABEL, formatSalary } from "@/lib/job-format";
import type { EmployerBadges, Job } from "@/lib/types";

/**
 * Admin console: reports, vacancy review, employer verification, audit log.
 * Everything here needs the admin key; private documents and report
 * screenshots are only ever loaded through it.
 */

type Tab = "reports" | "jobs" | "employers" | "identity" | "skills" | "audit";
type AuditRow = { id: string; actor: string; action: string; target_type: string; target_id: string; detail: string; created_at: string };
type Evidence = { id: string; layer: "business" | "presence"; kind: string; value: string; has_file: number; mime: string; created_at: string };
type EmployerRow = {
  id: string;
  account_name: string;
  phone: string;
  restricted: boolean;
  restricted_reason: string;
  business_name: string;
  contact_name: string;
  contact_position: string;
  email: string;
  authorized: boolean;
  phone_verified_at: string;
  business_status: string;
  business_note: string;
  presence_status: string;
  presence_note: string;
  manual_note: string;
  updated_at: string;
  badges: EmployerBadges;
  evidence: Evidence[];
  jobs: number;
  open_reports: number;
};
type AdminJob = Job & {
  business_name: string;
  contact_name: string;
  contact_position: string;
  authorized: boolean;
  employer_phone: string;
  employer_restricted: boolean;
  open_reports: number;
};
type ReportRow = {
  id: string;
  ref: string;
  reporter_user_id: string;
  reporter_contact: string;
  employer_id: string;
  job_id: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  escalated: boolean;
  reporter_message: string;
  internal_note: string;
  created_at: string;
  updated_at: string;
  job_title: string;
  job_status: string;
  business_name: string;
  employer_account: string;
  employer_restricted: boolean;
  attachments: { id: string; mime: string; bytes: number }[];
};

const KIND_LABEL: Record<string, string> = {
  pan: "PAN (as typed, not checked with IRD)",
  registration: "Registration certificate",
  ward: "Municipality / ward registration",
  licence: "Industry licence",
  premises_photo: "Photo of premises / signboard",
  maps: "Map location",
  website: "Website",
  social: "Social media page",
  other: "Other",
};

const STATUS_CLS: Record<string, string> = {
  none: "badge-muted",
  submitted: "badge-ochre",
  needs_info: "badge-brand",
  approved: "badge-moss",
  rejected: "badge-brand",
  pending: "badge-ochre",
  suspended: "badge-muted",
  new: "badge-ochre",
  under_review: "badge-ochre",
  awaiting_info: "badge-brand",
  resolved: "badge-moss",
  dismissed: "badge-muted",
};

const when = (s: string) => (s ? new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

export default function AdminConsole() {
  const [key, setKey] = useState("");
  const [tab, setTab] = useState<Tab>("reports");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  // Read the saved key before any request, so the first load does not fail.
  useEffect(() => {
    try {
      setKey(sessionStorage.getItem("mm_admin_key") ?? "");
    } catch {}
    setReady(true);
  }, []);
  const saveKey = (k: string) => {
    setKey(k);
    try {
      sessionStorage.setItem("mm_admin_key", k);
    } catch {}
  };

  const api = useCallback(
    async (url: string, body?: object) => {
      setErr("");
      const r = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(r.status === 401 ? "Admin key is wrong or missing." : d.error || "Failed");
        throw new Error(d.error);
      }
      return d;
    },
    [key],
  );

  const done = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const TABS: [Tab, string][] = [
    ["reports", "Reports"],
    ["jobs", "Job review"],
    ["employers", "Employers"],
    ["identity", "ID checks"],
    ["skills", "Skill photos"],
    ["audit", "Audit log"],
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="page-title mt-1">Review and safety</h1>
        </div>
        <div className="w-full max-w-xs">
          <label htmlFor="admin-key" className="label">
            Admin key
          </label>
          <input id="admin-key" type="password" className="input" value={key} onChange={(e) => saveKey(e.target.value)} />
        </div>
      </header>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-rule" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative min-h-[44px] shrink-0 px-4 text-sm font-medium ${tab === id ? "text-ink" : "text-ink-light hover:text-ink"}`}
          >
            {label}
            {tab === id && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-brand" />}
          </button>
        ))}
      </div>

      {err && <div className="alert-error mt-4" role="alert">{err}</div>}
      {msg && <div className="alert-ok mt-4" role="status">{msg}</div>}

      <div className="mt-6">
        {!ready ? null : tab === "reports" && <Reports api={api} done={done} adminKey={key} />}
        {tab === "jobs" && <Jobs api={api} done={done} />}
        {tab === "employers" && <Employers api={api} done={done} adminKey={key} />}
        {tab === "identity" && <Identity api={api} done={done} adminKey={key} />}
        {tab === "skills" && <SkillPhotos api={api} done={done} adminKey={key} />}
        {tab === "audit" && <Audit api={api} />}
      </div>
    </div>
  );
}

type Api = (url: string, body?: object) => Promise<any>;

/** A note box with a set of action buttons that all use the same text. */
function Actions({
  actions,
  placeholder = "Note (kept in the audit log; some actions show it to the employer or reporter)",
}: {
  actions: { label: string; onClick: (text: string) => Promise<unknown> | void; tone?: "primary" | "danger"; needsText?: boolean }[];
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3">
      <textarea className="input min-h-[70px] !text-sm" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={busy || (a.needsText && !text.trim())}
            className={a.tone === "primary" ? "btn-primary btn-sm" : a.tone === "danger" ? "btn-secondary btn-sm !text-danger" : "btn-secondary btn-sm"}
            onClick={async () => {
              setBusy(true);
              try {
                await a.onClick(text.trim());
                setText("");
              } catch {
              } finally {
                setBusy(false);
              }
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Opens a private file through the admin key (img src cannot send headers). */
function PrivateFile({
  kind,
  id,
  mime,
  adminKey,
  label,
  side,
}: {
  kind: "evidence" | "report" | "identity" | "skill";
  id: string;
  mime: string;
  adminKey: string;
  label: string;
  side?: "front" | "back";
}) {
  const [url, setUrl] = useState("");
  const open = async () => {
    const r = await fetch(`/api/admin/file?kind=${kind}&id=${id}${side ? `&side=${side}` : ""}`, { headers: { "x-admin-key": adminKey } });
    if (!r.ok) return;
    const u = URL.createObjectURL(await r.blob());
    if (mime === "application/pdf") window.open(u, "_blank", "noopener");
    else setUrl(u);
  };
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} className="mt-2 max-h-64 rounded-md border border-rule" />
  ) : (
    <button type="button" onClick={open} className="link inline-flex items-center gap-1 text-sm">
      <Icon name={mime === "application/pdf" ? "list-check" : "image"} size={15} />
      Open {mime === "application/pdf" ? "PDF" : "image"}
    </button>
  );
}

function History({ api, type, id }: { api: Api; type: "report" | "employer" | "job" | "candidate"; id: string }) {
  const title = { report: "Report history", employer: "Employer review history", job: "Job review history", candidate: "ID check history" }[type];
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  return (
    <details
      className="mt-3 text-sm"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open && !rows) api(`/api/admin/audit?type=${type}&id=${id}`).then(setRows).catch(() => {});
      }}
    >
      <summary className="cursor-pointer font-medium text-ink-light">{title}</summary>
      {rows?.length ? (
        <ul className="mt-2 space-y-1 text-ink-light">
          {rows.map((r) => (
            <li key={r.id}>
              <span className="text-ink-muted">{when(r.created_at)}</span> · {r.actor} · <span className="font-medium text-ink">{r.action}</span>
              {r.detail ? ` · ${r.detail}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-ink-muted">{rows ? "Nothing recorded yet." : "Loading…"}</p>
      )}
    </details>
  );
}

/* ---------------- Reports ---------------- */

function Reports({ api, done, adminKey }: { api: Api; done: (m: string) => void; adminKey: string }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [f, setF] = useState({ status: "", category: "", employer: "", job: "" });
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    api(`/api/admin/reports?${q}`).then(setRows).catch(() => {});
  }, [api, f]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (r: ReportRow, body: object, m: string) => {
    await api(`/api/admin/reports/${r.id}`, body);
    done(m);
    load();
  };
  const jobAct = async (r: ReportRow, action: string, note: string, m: string) => {
    await api(`/api/admin/jobs/${r.job_id}/review`, { action, note: note || `Report ${r.ref}` });
    await api(`/api/admin/reports/${r.id}`, { action: "note", note: `${action} job: ${note || "(no note)"}` });
    done(m);
    load();
  };
  const empAct = async (r: ReportRow, action: string, reason: string, m: string) => {
    await api(`/api/admin/employers/${r.employer_id}`, { action, reason: reason || `Report ${r.ref}` });
    await api(`/api/admin/reports/${r.id}`, { action: "note", note: `${action} employer: ${reason || "(no note)"}` });
    done(m);
    load();
  };

  const employers = [...new Map(rows.filter((r) => r.employer_id).map((r) => [r.employer_id, r.business_name || r.employer_account])).entries()];
  const jobs = [...new Map(rows.filter((r) => r.job_id).map((r) => [r.job_id, r.job_title])).entries()];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        <select className="input" aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All statuses</option>
          {REPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s].en}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">All reasons</option>
          {REPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c].en}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Employer" value={f.employer} onChange={(e) => setF({ ...f, employer: e.target.value })}>
          <option value="">All employers</option>
          {employers.map(([id, name]) => (
            <option key={id} value={id}>
              {name || id}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Job" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })}>
          <option value="">All jobs</option>
          {jobs.map(([id, title]) => (
            <option key={id} value={id}>
              {title || id}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        One report is a reason to look, not proof. Hide a job or restrict an account only when a concern is credible and serious, and restore it if the review clears it.
      </p>

      <ul className="mt-4 divide-y divide-rule border-y border-rule">
        {rows.length === 0 && <li className="py-8 text-center text-ink-muted">No reports.</li>}
        {rows.map((r) => (
          <li key={r.id} className="py-3">
            <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left" aria-expanded={open === r.id}>
              <span className="min-w-0">
                <span className="font-mono font-semibold">{r.ref}</span>
                {r.escalated && <span className="badge-brand ml-2">Escalated</span>}
                <span className="block text-sm text-ink-light">
                  {CATEGORY_LABEL[r.category].en} · {r.job_title || "No job"} · {r.business_name || r.employer_account || "No employer account"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-ink-muted">{when(r.created_at)}</span>
                <span className={STATUS_CLS[r.status]}>{STATUS_LABEL[r.status].en}</span>
              </span>
            </button>

            {open === r.id && (
              <div className="mt-4 rounded-lg bg-paper-dark p-4">
                <p className="whitespace-pre-wrap text-base">{r.description || <span className="text-ink-muted">No description.</span>}</p>
                {r.reporter_contact && <p className="mt-2 text-sm">Reporter contact (private): {r.reporter_contact}</p>}
                <p className="mt-1 text-sm text-ink-muted">Reporter {r.reporter_user_id ? "has an account" : "was not logged in"}. Never share their identity with the employer.</p>
                {r.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    {r.attachments.map((a) => (
                      <PrivateFile key={a.id} kind="report" id={a.id} mime={a.mime} adminKey={adminKey} label={`Attachment for ${r.ref}`} />
                    ))}
                  </div>
                )}
                {r.internal_note && (
                  <pre className="mt-3 whitespace-pre-wrap rounded-md border border-rule bg-white p-3 font-sans text-sm text-ink-light">{r.internal_note}</pre>
                )}
                <p className="mt-3 text-sm">
                  Job status: <span className={STATUS_CLS[r.job_status] ?? "badge-muted"}>{r.job_status || "n/a"}</span> · Employer:{" "}
                  {r.employer_restricted ? <span className="badge-brand">Restricted</span> : <span className="badge-muted">Active</span>}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "new" && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => act(r, { action: "status", status: "under_review" }, "Marked under review")}>
                      Mark under review
                    </button>
                  )}
                  <button type="button" className="btn-secondary btn-sm" onClick={() => act(r, { action: "escalate", on: !r.escalated }, r.escalated ? "De-escalated" : "Escalated")}>
                    {r.escalated ? "Remove escalation" : "Escalate"}
                  </button>
                </div>

                <Actions
                  actions={[
                    { label: "Ask reporter for more information", needsText: true, onClick: (t) => act(r, { action: "request_info", message: t }, "Request sent to reporter") },
                    ...(r.employer_id
                      ? [{ label: "Ask employer for clarification", needsText: true, onClick: (t: string) => act(r, { action: "contact_employer", message: t }, "Message sent to employer") }]
                      : []),
                    { label: "Add internal note", needsText: true, onClick: (t) => act(r, { action: "note", note: t }, "Note added") },
                    { label: "Resolve", tone: "primary" as const, needsText: true, onClick: (t) => act(r, { action: "status", status: "resolved", note: t }, "Report resolved") },
                    { label: "Dismiss", needsText: true, onClick: (t) => act(r, { action: "status", status: "dismissed", note: t }, "Report dismissed") },
                    ...(r.job_id
                      ? r.job_status === "suspended"
                        ? [{ label: "Restore job", onClick: (t: string) => jobAct(r, "restore", t, "Job restored") }]
                        : [{ label: "Hide job while investigating", tone: "danger" as const, needsText: true, onClick: (t: string) => jobAct(r, "suspend", t, "Job hidden") }]
                      : []),
                    ...(r.employer_id
                      ? r.employer_restricted
                        ? [{ label: "Restore employer", needsText: true, onClick: (t: string) => empAct(r, "restore", t, "Employer restored") }]
                        : [{ label: "Restrict employer", tone: "danger" as const, needsText: true, onClick: (t: string) => empAct(r, "restrict", t, "Employer restricted") }]
                      : []),
                  ]}
                />
                <History api={api} type="report" id={r.id} />
                {r.employer_id && <History api={api} type="employer" id={r.employer_id} />}
                {r.job_id && <History api={api} type="job" id={r.job_id} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Jobs ---------------- */

function Jobs({ api, done }: { api: Api; done: (m: string) => void }) {
  const [rows, setRows] = useState<AdminJob[]>([]);
  const [status, setStatus] = useState("pending");
  const load = useCallback(() => {
    api("/api/admin/jobs").then(setRows).catch(() => {});
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (j: AdminJob, action: string, note: string, m: string) => {
    await api(`/api/admin/jobs/${j.id}/review`, { action, note });
    done(m);
    load();
  };
  const shown = rows.filter((j) => !status || j.review_status === status);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["pending", "needs_info", "approved", "suspended", "rejected", ""].map((s) => (
          <button key={s || "all"} type="button" onClick={() => setStatus(s)} className={`chip ${status === s ? "chip-on" : ""}`}>
            {s ? s.replace("_", " ") : "all"} ({rows.filter((j) => !s || j.review_status === s).length})
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-4">
        {shown.length === 0 && <li className="empty">Nothing here.</li>}
        {shown.map((j) => (
          <li key={j.id} className="rounded-lg border border-rule p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{j.title}</p>
                <p className="text-sm text-ink-light">
                  {j.employer_name} · {j.location} · posted {when(j.created_at)}
                </p>
              </div>
              <span className={STATUS_CLS[j.review_status]}>{j.review_status.replace("_", " ")}</span>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-ink-muted">Salary: </dt><dd className="inline">{formatSalary(j, "en") ?? <span className="text-danger">missing</span>}</dd></div>
              <div><dt className="inline text-ink-muted">Type: </dt><dd className="inline">{j.employment_type ? EMPLOYMENT_LABEL[j.employment_type].en : <span className="text-danger">missing</span>}</dd></div>
              <div><dt className="inline text-ink-muted">Hours: </dt><dd className="inline">{j.hours || <span className="text-danger">missing</span>}</dd></div>
              <div><dt className="inline text-ink-muted">No-fee promise: </dt><dd className="inline">{j.no_fee_confirmed ? "confirmed" : <span className="text-danger">not confirmed</span>}</dd></div>
              <div><dt className="inline text-ink-muted">Contact: </dt><dd className="inline">{j.contact_name ? `${j.contact_name} (${j.contact_position}), ${j.employer_phone}` : "none"}</dd></div>
              <div><dt className="inline text-ink-muted">Authorised: </dt><dd className="inline">{j.authorized ? "yes" : "no"}</dd></div>
              <div><dt className="inline text-ink-muted">Employer: </dt><dd className="inline">{j.employer_badges?.employer ? "Employer Verified" : j.employer_badges?.contact ? "Contact verified only" : "Not verified"}{j.employer_restricted ? ", RESTRICTED" : ""}</dd></div>
              <div><dt className="inline text-ink-muted">Open reports: </dt><dd className="inline">{j.open_reports}</dd></div>
            </dl>
            {j.responsibilities && <p className="mt-2 whitespace-pre-line text-sm">{j.responsibilities}</p>}
            {j.review_note && <p className="mt-2 text-sm text-ink-light">Last note: {j.review_note}</p>}
            <Actions
              placeholder="Note for the employer (needed for anything except approve / restore)"
              actions={
                j.review_status === "suspended" || j.review_status === "rejected"
                  ? [{ label: "Restore (approve)", tone: "primary", onClick: (t) => act(j, "restore", t, "Job restored") }]
                  : j.review_status === "approved"
                    ? [{ label: "Hide while investigating", tone: "danger", needsText: true, onClick: (t) => act(j, "suspend", t, "Job hidden") }]
                    : [
                        { label: "Approve: Job Verified", tone: "primary", onClick: (t) => act(j, "approve", t, "Job approved") },
                        { label: "Ask for more information", needsText: true, onClick: (t) => act(j, "request_info", t, "Request sent") },
                        { label: "Reject", tone: "danger", needsText: true, onClick: (t) => act(j, "reject", t, "Job rejected") },
                      ]
              }
            />
            <History api={api} type="job" id={j.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Employers ---------------- */

function Employers({ api, done, adminKey }: { api: Api; done: (m: string) => void; adminKey: string }) {
  const [rows, setRows] = useState<EmployerRow[]>([]);
  const load = useCallback(() => {
    api("/api/admin/employers").then(setRows).catch(() => {});
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (e: EmployerRow, body: object, m: string) => {
    await api(`/api/admin/employers/${e.id}`, body);
    done(m);
    load();
  };

  return (
    <ul className="space-y-4">
      {rows.length === 0 && <li className="empty">No employers yet.</li>}
      {rows.map((e) => (
        <li key={e.id} className="rounded-lg border border-rule p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{e.business_name || e.account_name}</p>
              <p className="text-sm text-ink-light">
                {e.contact_name ? `${e.contact_name}, ${e.contact_position}` : "No contact person yet"} · {e.phone}
                {e.email ? ` · ${e.email}` : ""}
              </p>
              <p className="mt-1 text-sm">
                Phone {e.phone_verified_at ? "confirmed by OTP" : "not confirmed"} · Authorised: {e.authorized ? "yes" : "no"} · {e.jobs} jobs · {e.open_reports} open reports
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {e.badges.employer && <span className="badge-moss">Employer Verified</span>}
              {e.restricted && <span className="badge-brand">Restricted</span>}
            </div>
          </div>
          {e.restricted && <p className="mt-2 text-sm text-danger">Reason: {e.restricted_reason}</p>}
          {e.manual_note && (
            <p className="alert-note mt-3">
              <span className="font-semibold">Manual review request: </span>
              {e.manual_note}
            </p>
          )}

          {(["business", "presence"] as const).map((layer) => {
            const items = e.evidence.filter((x) => x.layer === layer);
            const st = layer === "business" ? e.business_status : e.presence_status;
            return (
              <div key={layer} className="mt-4 rounded-md bg-paper-dark p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{layer === "business" ? "Business identity" : "Business presence"}</p>
                  <span className={STATUS_CLS[st]}>{st.replace("_", " ")}</span>
                </div>
                {items.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {items.map((x) => (
                      <li key={x.id}>
                        <span className="font-medium">{KIND_LABEL[x.kind] ?? x.kind}</span>
                        {x.value && (
                          <>
                            {": "}
                            {/^https?:\/\//.test(x.value) ? (
                              <a href={x.value} target="_blank" rel="noopener noreferrer nofollow" className="link break-all">
                                {x.value}
                              </a>
                            ) : (
                              x.value
                            )}
                          </>
                        )}
                        {x.has_file ? (
                          <div>
                            <PrivateFile kind="evidence" id={x.id} mime={x.mime} adminKey={adminKey} label={KIND_LABEL[x.kind] ?? x.kind} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">No evidence added.</p>
                )}
                <Actions
                  placeholder="Message to the employer (needed to ask for more or to decline)"
                  actions={[
                    { label: "Approve", tone: "primary", onClick: (t) => act(e, { action: "approve", layer, message: t }, "Approved") },
                    { label: "Ask for more information", needsText: true, onClick: (t) => act(e, { action: "request_info", layer, message: t }, "Request sent") },
                    { label: "Not accepted", tone: "danger", needsText: true, onClick: (t) => act(e, { action: "reject", layer, message: t }, "Marked not accepted") },
                  ]}
                />
              </div>
            );
          })}

          <Actions
            placeholder="Reason or message (kept in the audit log)"
            actions={[
              { label: "Message employer", needsText: true, onClick: (t) => act(e, { action: "message", message: t }, "Message sent") },
              e.restricted
                ? { label: "Restore account", needsText: true, onClick: (t) => act(e, { action: "restore", reason: t }, "Account restored") }
                : { label: "Restrict account", tone: "danger", needsText: true, onClick: (t) => act(e, { action: "restrict", reason: t }, "Account restricted") },
            ]}
          />
          <History api={api} type="employer" id={e.id} />
        </li>
      ))}
    </ul>
  );
}

/* ---------------- ID checks ---------------- */

type IdRow = {
  user_id: string;
  doc_type: string;
  name_on_doc: string;
  status: string;
  note: string;
  submitted_at: string;
  reviewed_at: string;
  front_mime: string;
  back_mime: string;
  has_front: number;
  has_back: number;
  account_name: string;
  phone: string;
};

const ID_NAMES: Record<string, string> = {
  citizenship: "Citizenship certificate",
  nid: "National ID card",
  passport: "Passport",
  licence: "Driving licence",
  voter: "Voter ID card",
};

function Identity({ api, done, adminKey }: { api: Api; done: (m: string) => void; adminKey: string }) {
  const [rows, setRows] = useState<IdRow[]>([]);
  const load = useCallback(() => {
    api("/api/admin/identity").then(setRows).catch(() => {});
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (r: IdRow, action: string, message: string, m: string) => {
    await api(`/api/admin/identity/${r.user_id}`, { action, message });
    done(m);
    load();
  };

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Check that the name on the ID matches the account name and that the photo is readable. Approving or declining deletes the photos at once; only the result is kept. Never copy ID numbers anywhere.
      </p>
      <ul className="mt-4 space-y-4">
        {rows.length === 0 && <li className="empty">No ID checks yet.</li>}
        {rows.map((r) => (
          <li key={r.user_id} className="rounded-lg border border-rule p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{r.account_name}</p>
                <p className="text-sm text-ink-light">
                  {ID_NAMES[r.doc_type] ?? r.doc_type} · {r.phone} · sent {when(r.submitted_at)}
                </p>
                {r.name_on_doc && (
                  <p className="mt-1 text-sm">
                    Name typed as on the ID: <span className="font-semibold">{r.name_on_doc}</span>
                    {r.name_on_doc.trim().toLowerCase() !== r.account_name.trim().toLowerCase() && (
                      <span className="badge-brand ml-2">Differs from account name</span>
                    )}
                  </p>
                )}
              </div>
              <span className={STATUS_CLS[r.status] ?? "badge-muted"}>{r.status.replace("_", " ")}</span>
            </div>
            {(r.has_front || r.has_back) ? (
              <div className="mt-3 flex flex-wrap gap-6">
                {r.has_front ? <PrivateFile kind="identity" id={r.user_id} side="front" mime={r.front_mime} adminKey={adminKey} label="ID front" /> : null}
                {r.has_back ? <PrivateFile kind="identity" id={r.user_id} side="back" mime={r.back_mime} adminKey={adminKey} label="ID back" /> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Photos deleted after the decision{r.reviewed_at ? ` (${when(r.reviewed_at)})` : ""}.</p>
            )}
            {r.note && <p className="mt-2 text-sm text-ink-light">Last message: {r.note}</p>}
            {(r.status === "submitted" || r.status === "needs_info") && (
              <Actions
                placeholder="Message to the person (needed to ask again or to decline)"
                actions={[
                  { label: "Approve: ID verified", tone: "primary", onClick: (t) => act(r, "approve", t, "ID verified, photos deleted") },
                  { label: "Ask for a clearer photo", needsText: true, onClick: (t) => act(r, "request_info", t, "Request sent") },
                  { label: "Decline", tone: "danger", needsText: true, onClick: (t) => act(r, "reject", t, "Declined, photos deleted") },
                ]}
              />
            )}
            <History api={api} type="candidate" id={r.user_id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Skill photos ---------------- */

type SkillRow = {
  id: string;
  user_id: string;
  tag: string;
  caption: string;
  status: "ai_checked" | "needs_review" | "reviewed" | "rejected";
  ai_note: string;
  review_note: string;
  created_at: string;
  mime: string;
  name: string;
  experience_text: string;
  experience_en: string;
};

const SKILL_STATUS: Record<SkillRow["status"], [string, string]> = {
  needs_review: ["Waiting for review", "badge-ochre"],
  ai_checked: ["AI says it fits", "badge-moss"],
  reviewed: ["Accepted", "badge-moss"],
  rejected: ["Not accepted", "badge-brand"],
};

function SkillPhotos({ api, done, adminKey }: { api: Api; done: (m: string) => void; adminKey: string }) {
  const [rows, setRows] = useState<SkillRow[]>([]);
  const load = useCallback(() => {
    api("/api/admin/skill-evidence").then(setRows).catch(() => {});
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (r: SkillRow, action: "accept" | "reject", message: string) => {
    await api(`/api/admin/skill-evidence/${r.id}`, { action, message });
    done(action === "accept" ? "Photo accepted" : "Photo not accepted, person told why");
    load();
  };
  return (
    <div>
      <p className="text-sm text-ink-muted">
        Does the photo show work that fits the skill? You cannot know who did the work, so accept a photo when it plausibly fits. Decline anything showing other people&apos;s personal details, children, or nothing related. AI-checked photos can still be declined.
      </p>
      <ul className="mt-4 space-y-4">
        {rows.length === 0 && <li className="empty">No skill photos yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-rule p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-semibold">{TAG_LABELS[r.tag]?.en ?? r.tag}</p>
                <p className="text-sm text-ink-light">
                  {r.name} · sent {when(r.created_at)}
                </p>
              </div>
              <span className={SKILL_STATUS[r.status][1]}>{SKILL_STATUS[r.status][0]}</span>
            </div>
            {r.caption && <p className="mt-2 text-sm">Caption: <span className="text-ink">{r.caption}</span></p>}
            {r.ai_note && <p className="mt-1 text-sm text-ink-light">AI saw: {r.ai_note}</p>}
            {(r.experience_en || r.experience_text) && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-ink-light">What they wrote about their experience</summary>
                {r.experience_text && <p className="mt-1">{r.experience_text}</p>}
                {r.experience_en && r.experience_en !== r.experience_text && <p className="mt-1 text-ink-light">English: {r.experience_en}</p>}
              </details>
            )}
            <div className="mt-3">
              <PrivateFile kind="skill" id={r.id} mime={r.mime} adminKey={adminKey} label={`${r.tag} photo`} />
            </div>
            {r.review_note && <p className="mt-2 text-sm text-ink-light">Last message: {r.review_note}</p>}
            {r.status !== "rejected" && (
              <Actions
                placeholder="Message to the person (needed to decline, so they can try again)"
                actions={[
                  ...(r.status !== "reviewed" ? [{ label: "Accept", tone: "primary" as const, onClick: (t: string) => act(r, "accept", t) }] : []),
                  { label: "Decline", tone: "danger" as const, needsText: true, onClick: (t: string) => act(r, "reject", t) },
                ]}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Audit ---------------- */

function Audit({ api }: { api: Api }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => {
    api("/api/admin/audit").then(setRows).catch(() => {});
  }, [api]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-rule text-ink-muted">
          <tr>
            <th className="py-2 pr-4 font-medium">When</th>
            <th className="py-2 pr-4 font-medium">Who</th>
            <th className="py-2 pr-4 font-medium">Action</th>
            <th className="py-2 pr-4 font-medium">Target</th>
            <th className="py-2 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-4 whitespace-nowrap">{when(r.created_at)}</td>
              <td className="py-2 pr-4">{r.actor}</td>
              <td className="py-2 pr-4 font-medium">{r.action}</td>
              <td className="py-2 pr-4">{r.target_type} {r.target_id.slice(0, 8)}</td>
              <td className="py-2">{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-8 text-center text-ink-muted">Nothing recorded yet.</p>}
    </div>
  );
}
