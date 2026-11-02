import Link from "next/link";
import { t } from "@/lib/i18n";
import { readDb } from "@/lib/store";
import { isKnownTag, similarJobs, TAG_LABELS } from "@/lib/tags";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

type Search = { s?: string; tags?: string; lang?: string };

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === "en" ? "en" : "ne";
  const db = await readDb();

  const sub = sp.s ? db.submissions.find((s) => s.id === sp.s) : undefined;
  const tags = sub ? sub.tags : (sp.tags ?? "").split(",").filter(isKnownTag);
  const applied = sub ? db.submissions.filter((s) => s.candidateId === sub.candidateId).map((s) => s.jobId) : [];
  const matches = similarJobs(tags, db.jobs, applied);

  return (
    <main lang={lang}>
      <header className="py-5">
        {sub ? (
          <Link href={`/outcome/${sub.id}`} className="font-semibold text-brand">&larr; {t(lang, "backToResult")}</Link>
        ) : (
          <Link href="/" className="font-semibold text-brand">MeritMatch</Link>
        )}
      </header>

      <section className="border-t border-rule pt-8">
        <h1 className="font-display text-3xl text-brand">{t(lang, "similarJobs")}</h1>
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={t(lang, "yourSkills")}>
            {tags.map((tag) => (
              <li key={tag} className="border border-brand text-brand rounded-[3px] px-2 py-1 text-sm">
                {TAG_LABELS[tag][lang]}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        {matches.length === 0 && <p className="ledger-row">{t(lang, "noSimilar")}</p>}
        {matches.map(({ job, shared }) => (
          <Link key={job.id} href={`/t/${job.id}`} className="ledger-row block">
            <span className="block text-sm text-ink/75">{job.employer}{job.location ? `, ${job.location}` : ""}</span>
            <span className="block font-semibold text-lg">{job.title}</span>
            <span className="block text-sm mt-1">
              {t(lang, "matchingSkills", { tags: shared.map((x) => TAG_LABELS[x][lang]).join(", ") })}
            </span>
          </Link>
        ))}
        {matches.length > 0 && <div className="border-t border-rule" />}
      </section>
    </main>
  );
}
