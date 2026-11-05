"use client";

import Stamp from "./Stamp";

export default function VerifiedBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-moss ${className ?? ""}`}>
      <Stamp ringText="VERIFIED EMPLOYER" center="check" size={36} />
      <span className="text-xs font-semibold uppercase tracking-wider">Verified</span>
    </div>
  );
}
