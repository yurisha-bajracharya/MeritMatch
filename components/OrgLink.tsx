"use client";

import type { Lang } from "@/lib/types";

export default function OrgLink({ lang }: { lang: Lang }) {
  const ne = lang === "ne";
  return (
    <section className="rounded-lg border border-rule p-5">
      <h2 className="text-xl font-semibold text-ink">
        {ne ? "तालिम संगठन" : "Training organisation"}
      </h2>
      <p className="mt-2 text-sm text-ink-light">
        {ne
          ? "संगठनसँग नतिजा साझा गर्ने सुविधा शीघ्र उपलब्ध हुनेछ।"
          : "Organisation result sharing will be available soon."}
      </p>
    </section>
  );
}
