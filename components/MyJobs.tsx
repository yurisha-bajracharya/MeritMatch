"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { localizeDigits } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Row = { id: string; position: string; business_name: string; start_date: string; status: string; due_day: number | null; letter_waiting: number };

/** Candidate dashboard: jobs got through MeritMatch, with what needs doing. */
export default function MyJobs({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<Row[]>([]);
  const ne = lang === "ne";
  useEffect(() => {
    fetch("/api/profile/hires")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => {});
  }, []);
  if (!rows.length) return null;
  return (
    <section className="mt-8" aria-labelledby="myjobs-h">
      <h2 id="myjobs-h" className="section-title">{ne ? "तपाईंको काम" : "Your job"}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/hire/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule p-4 hover:border-field">
              <span>
                <span className="block text-lg font-semibold text-ink">{r.position}</span>
                <span className="text-sm text-ink-light">{r.business_name}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {r.letter_waiting ? <span className="badge-ochre">{ne ? "नियुक्तिपत्र पुष्टि गर्नुहोस्" : "Confirm your letter"}</span> : null}
                {r.due_day && r.status === "active" ? (
                  <span className="badge-brand">{ne ? `${localizeDigits(r.due_day, lang)} दिनको चेक-इन बाँकी` : `${r.due_day}-day check-in due`}</span>
                ) : null}
                <Icon name="arrow-right" size={18} className="text-ink-muted" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
