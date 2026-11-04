"use client";

import { isShared, setShared } from "@/lib/device";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

export default function SharedDeviceToggle({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(isShared);

  const toggle = () => {
    const next = !on;
    setShared(next);
    setOn(next);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className={`toggle ${on ? "toggle-on" : "toggle-off"}`}
        role="switch"
        aria-checked={on}
        aria-label={t("sharedDevice", lang)}
      >
        <span className={`toggle-dot ${on ? "toggle-dot-on" : "toggle-dot-off"}`} />
      </button>
      <div>
        <span className="text-sm font-medium">{t("sharedDevice", lang)}</span>
        <p className="text-xs text-ink-muted">{t("sharedDeviceHint", lang)}</p>
      </div>
    </div>
  );
}
