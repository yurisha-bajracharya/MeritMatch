"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import NotificationBell from "./NotificationBell";
import { LogoMark } from "./Logo";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-rule">
      <div className="container-main flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-bold text-ink tracking-tight
                     transition-opacity hover:opacity-80"
        >
          <LogoMark size={26} className="text-ink shrink-0" />
          MeritMatch
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/jobs"
            className="text-sm text-ink-light hover:text-ink transition-colors"
          >
            {t("jobs", lang)}
          </Link>

          {user?.role === "candidate" && (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-ink-light hover:text-ink transition-colors"
              >
                {t("dashboard", lang)}
              </Link>
              <Link
                href="/experience-mapper"
                className="text-sm text-ink-light hover:text-ink transition-colors"
              >
                {t("experienceMapper", lang)}
              </Link>
            </>
          )}

          {user?.role === "employer" && (
            <Link
              href="/employer/post"
              className="text-sm text-ink-light hover:text-ink transition-colors"
            >
              {t("postJob", lang)}
            </Link>
          )}

          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            {t("langToggle", lang)}
          </button>

          {user && <NotificationBell lang={lang} />}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-ink-light hover:text-ink"
              >
                <span className="w-7 h-7 rounded-full bg-brand-light text-brand border border-brand/25 flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="hidden sm:inline">
                  {user.name || user.phone}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 bg-surface border border-rule rounded-lg shadow-xl shadow-black/40 py-1 min-w-[140px] animate-fade-in">
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-ink-light hover:bg-paper-dark"
                  >
                    {t("logout", lang)}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signup?mode=login" className="btn-ghost btn-sm">
                {t("login", lang)}
              </Link>
              <Link href="/signup" className="btn-primary btn-sm">
                {t("signUp", lang)}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-ink-light"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-rule bg-surface animate-fade-in">
          <div className="container-main py-3 flex flex-col gap-2">
            <Link
              href="/jobs"
              className="py-2 text-sm text-ink-light"
              onClick={() => setMenuOpen(false)}
            >
              {t("jobs", lang)}
            </Link>
            {user?.role === "candidate" && (
              <>
                <Link
                  href="/dashboard"
                  className="py-2 text-sm text-ink-light"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("dashboard", lang)}
                </Link>
                <Link
                  href="/experience-mapper"
                  className="py-2 text-sm text-ink-light"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("experienceMapper", lang)}
                </Link>
              </>
            )}
            {user?.role === "employer" && (
              <Link
                href="/employer/post"
                className="py-2 text-sm text-ink-light"
                onClick={() => setMenuOpen(false)}
              >
                {t("postJob", lang)}
              </Link>
            )}
            <button
              onClick={() => setLang(lang === "en" ? "ne" : "en")}
              className="py-2 text-sm text-ink-muted text-left"
            >
              {t("langToggle", lang)}
            </button>
            {user ? (
              <button
                onClick={logout}
                className="py-2 text-sm text-danger text-left"
              >
                {t("logout", lang)}
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/signup?mode=login"
                  className="btn-ghost btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("login", lang)}
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("signUp", lang)}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
