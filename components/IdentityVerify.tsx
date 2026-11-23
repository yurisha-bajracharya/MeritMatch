"use client";

import type { Lang } from "@/lib/types";

export default function IdentityVerify({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  return (
    <section className="rounded-lg border border-rule p-5">
      <h2 className="text-xl font-semibold text-ink">
        {ne ? "पहिचान प्रमाणीकरण" : "Identity verification"}
      </h2>
      <p className="mt-2 text-sm text-ink-light">
        {ne
          ? "निजी ID जाँच अहिले उपलब्ध छैन। तपाईंको काम र नम्बर अझै पनि गुप्त राखिन्छ।"
          : "Optional ID review is not available yet. Your identity remains hidden while you apply."}
      </p>
    </section>
  );
}
