"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/useLang";
import type { User } from "@/lib/types";
import { t } from "@/lib/i18n";
import { x } from "@/lib/i18n-extra";
import NotificationBell from "./NotificationBell";
import { LogoMark } from "./Logo";
import Icon from "./Icon";

type NavItem = { href: string; label: string; match: (p: string) => boolean };

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname() || "/";
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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

  // Close the profile menu on outside click or Escape.
  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const logout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
    window.location.href = "/";
  };

  const items: NavItem[] = [
    { href: "/jobs", label: t("jobs", lang), match: (p) => p.startsWith("/jobs") || p.startsWith("/t/") },
  ];
  if (user?.role === "candidate") {
    items.push(
      { href: "/dashboard", label: t("dashboard", lang), match: (p) => p.startsWith("/dashboard") },
      { href: "/experience-mapper", label: t("experienceMapper", lang), match: (p) => p.startsWith("/experience-mapper") },
    );
  }
  if (user?.role === "employer") {
    items.push(
      {
        href: "/employer/dashboard",
        label: x("myJobs", lang),
        match: (p) => p.startsWith("/employer/dashboard") || p.startsWith("/employer/jobs"),
      },
      { href: "/employer/post", label: t("postJob", lang), match: (p) => p.startsWith("/employer/post") },
      {
        href: "/employer/verify",
        label: lang === "ne" ? "प्रमाणीकरण" : "Verification",
        match: (p) => p.startsWith("/employer/verify"),
      },
    );
  }

  const langButton = (className = "", short = false) => (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ne" : "en")}
      className={`inline-flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-ink hover:border-field ${className}`}
      aria-label={lang === "en" ? "नेपालीमा हेर्नुहोस् (switch to Nepali)" : "Switch to English"}
      lang={lang === "en" ? "ne" : "en"}
    >
      <Icon name="globe" size={16} />
      {short ? (lang === "en" ? "नेपाली" : "EN") : t("langToggle", lang)}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-rule bg-white/95 backdrop-blur" aria-label="Main">
      <div className="container-main flex h-[68px] items-center gap-3 md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-ink">
          <LogoMark size={26} className="shrink-0 text-ink" />
          MeritMatch
        </Link>

        {/* Desktop links */}
        <ul className="hidden h-full items-stretch gap-1 md:flex">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center px-3 text-[0.9375rem] font-medium transition-colors ${
                    active ? "text-ink" : "text-ink-light hover:text-ink"
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-brand" aria-hidden />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {langButton()}
          {user && <NotificationBell lang={lang} />}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm font-medium text-ink hover:bg-paper-dark"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="max-w-[10rem] truncate">{user.name || user.phone}</span>
                <Icon name="chevron-down" size={16} className="text-ink-muted" />
              </button>
              {profileOpen && (
                <div className="menu absolute right-0 top-12 min-w-[220px]" role="menu">
                  <div className="border-b border-rule px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.name || user.phone}</p>
                    <p className="text-xs text-ink-muted">
                      {user.role === "employer" ? t("employer", lang) : t("jobSeeker", lang)} · {user.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-paper-dark"
                  >
                    <Icon name="logout" size={16} className="text-ink-muted" />
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

        {/* Mobile: language + bell stay visible, the rest goes in the menu */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {langButton("!px-2.5", true)}
          {user && <NotificationBell lang={lang} />}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-paper-dark"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-rule bg-white md:hidden">
          <ul className="container-main flex flex-col py-2">
            {items.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[48px] items-center border-l-[3px] pl-3 text-base ${
                      active ? "border-brand font-semibold text-ink" : "border-transparent text-ink-light"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-rule pt-3">
              {user ? (
                <div className="flex items-center justify-between gap-3 pb-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name || user.phone}</p>
                    <p className="text-xs text-ink-muted">
                      {user.role === "employer" ? t("employer", lang) : t("jobSeeker", lang)}
                    </p>
                  </div>
                  <button type="button" onClick={logout} className="btn-secondary btn-sm">
                    {t("logout", lang)}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pb-2">
                  <Link href="/signup?mode=login" className="btn-secondary btn-sm flex-1">
                    {t("login", lang)}
                  </Link>
                  <Link href="/signup" className="btn-primary btn-sm flex-1">
                    {t("signUp", lang)}
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
