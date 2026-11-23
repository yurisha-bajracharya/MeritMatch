"use client";

import type { Lang } from "@/lib/types";

export default function MyJobs({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  return (
    <section className="mt-8 rounded-lg border border-rule p-5">
      <h2 className="text-xl font-semibold text-ink">
        {ne ? "मेरो आवेदनहरू" : "My applications"}
      </h2>
      <p className="mt-2 text-sm text-ink-light">
        {ne
          ? "आवेदन पछि यो स्थानमा तपाईंको नतिजा देखिनेछ।"
          : "Your submitted application results will appear here."}
      </p>
    </section>
  );
}
