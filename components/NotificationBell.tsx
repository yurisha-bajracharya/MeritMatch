"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";
import { x } from "@/lib/i18n-extra";
import { useLang } from "@/lib/useLang";

type NotifData = {
  id: string;
  type: string;
  title: string;
  message: string;
  job_id: string;
  link?: string;
  job_title?: string;
  job_employer?: string;
  job_location?: string;
  read: boolean;
  created_at: string;
};

/** Write the notification in the reader's language from its type and job. */
function textOf(n: NotifData, lang: Lang): { title: string; body: string } {
  const title = n.job_title || "";
  const employer = n.job_employer || "";
  if (n.type === "new_job" && title) {
    return {
      title: x("newJobTitle", lang, { title }),
      body: x("newJobBody", lang, {
        employer,
        place: n.job_location ? ` (${n.job_location})` : "",
      }),
    };
  }
  if (n.type === "shortlisted") {
    return {
      title: x("shortlistedTitle", lang),
      body: title ? x("shortlistedBody", lang, { employer, title }) : x("shortlistedMsg", lang),
    };
  }
  return { title: n.title, body: n.message };
}

export default function NotificationBell(_props: { lang?: Lang }) {
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifData[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnread(d.unread ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-ink-light hover:text-ink transition-colors"
        aria-label={x("notificationsLabel", lang)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-paper text-[10px] font-bold flex items-center justify-center bell-ring">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-surface border border-rule rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-fade-in z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
            <span className="text-sm font-semibold">{t("notifications", lang)}</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand hover:underline"
              >
                {t("markAllRead", lang)}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-muted">
                {t("noNotifications", lang)}
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || (n.job_id ? `/jobs?highlight=${n.job_id}` : "#")}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-rule/50 hover:bg-paper-dark transition-colors ${
                    !n.read ? "bg-brand-light/30" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-ink">{textOf(n, lang).title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{textOf(n, lang).body}</div>
                  <div className="text-[10px] text-ink-muted mt-1">
                    {new Date(n.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : undefined)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
