"use client";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Props = { lang: Lang; shared: boolean; onChange: (on: boolean) => void };

export default function SharedDeviceToggle({ lang, shared, onChange }: Props) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={shared}
        onClick={() => onChange(!shared)}
        className="flex w-full items-center justify-between gap-4 min-h-12 text-left cursor-pointer"
      >
        <span className="font-medium">{t(lang, "sharedLabel")}</span>
        <span
          className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-brand ${shared ? "bg-brand" : "bg-transparent"}`}
          aria-hidden
        >
          <span className={`absolute top-0.5 size-6 rounded-full ${shared ? "left-[26px] bg-ochre" : "left-0.5 bg-brand"}`} />
        </span>
      </button>
      <p className="mt-1 text-sm" aria-live="polite">
        {t(lang, shared ? "sharedOn" : "sharedOff")}
      </p>
    </div>
  );
}
