import type { ReactNode } from "react";

/**
 * One consistent icon set, drawn as SVG.
 *
 * Why not emoji: they render differently on every phone (colour on Android
 * and iOS, flat or missing on older Windows), they ignore the theme, and
 * they cannot be recoloured. These inherit `currentColor`, so they follow
 * the text colour and the dark theme automatically.
 *
 * 24x24 grid, 1.75 stroke, round caps. Decorative by default (aria-hidden);
 * pass `label` when an icon stands alone without text beside it.
 */

const PATHS: Record<string, ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16.2 9.5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  scale: (
    <>
      <path d="M12 4v16M8 20h8" />
      <path d="M5 7h14" />
      <path d="M5 7l-2.5 6a3 3 0 005 0L5 7zM19 7l-2.5 6a3 3 0 005 0L19 7z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 015.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-9z" />
      <circle cx="12" cy="13" r="3.4" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
      <path d="M15.5 10.5l5-2.5v8l-5-2.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4.5 15v3.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V15" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M10 7V4.5h4V7" />
      <path d="M6.5 7l.8 12a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.4l.8-12" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.8v5.4c0 4.3-2.9 8-7 9.8-4.1-1.8-7-5.5-7-9.8V5.8L12 3z" />
      <path d="M9 12l2.2 2.2L15.2 10" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.6 9.6 0 0112 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2.1-2.7 3.4M6.4 7.6C4.4 9 3 10.9 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6L10 4z" />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
    </>
  ),
  "list-check": (
    <>
      <path d="M10 6.5h10M10 12h10M10 17.5h10" />
      <path d="M3.5 6.5l1.3 1.3 2.2-2.4M3.5 12l1.3 1.3 2.2-2.4M3.5 17.5l1.3 1.3 2.2-2.4" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l1-4.2L16.6 4.2a1.8 1.8 0 012.6 0l.6.6a1.8 1.8 0 010 2.6L8.2 19 4 20z" />
      <path d="M14.5 6.3l3.2 3.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 15.5H3L12 4z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="16.9" r=".6" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r=".7" fill="currentColor" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c.6-3.6 3.5-5.6 7-5.6s6.4 2 7 5.6" />
    </>
  ),
  building: (
    <>
      <path d="M5 20.5V4.5a1 1 0 011-1h8a1 1 0 011 1v16M15 9.5h3a1 1 0 011 1v10" />
      <path d="M8.5 7.5h3M8.5 11h3M8.5 14.5h3M3.5 20.5h17" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 1.8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17.5l5-4.5 3.5 3 2.5-2.2 5 4.2" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 16,
  className = "",
  label,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible name. Omit when the icon sits next to visible text. */
  label?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** A rounded tile holding an icon, for feature rows and empty states. */
export function IconTile({
  name,
  size = 20,
  tone = "brand",
  className = "",
}: {
  name: IconName;
  size?: number;
  tone?: "brand" | "moss" | "ochre" | "muted";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-light text-brand",
    moss: "bg-moss-light text-moss",
    ochre: "bg-ochre-light text-ochre",
    muted: "bg-paper-dark text-ink-light",
  } as const;
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]} ${className}`}
    >
      <Icon name={name} size={size} />
    </span>
  );
}
