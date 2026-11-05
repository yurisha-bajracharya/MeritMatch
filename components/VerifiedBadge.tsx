"use client";

import Stamp from "./Stamp";
import { x } from "@/lib/i18n-extra";
import { useLang } from "@/lib/useLang";

export default function VerifiedBadge({ className }: { className?: string }) {
  const [lang] = useLang();
  return (
    <div className={`flex items-center gap-2 text-moss ${className ?? ""}`}>
      <Stamp ringText="VERIFIED EMPLOYER" center="check" size={36} />
      <span className="text-xs font-semibold uppercase tracking-wider">{x("verified", lang)}</span>
    </div>
  );
}
