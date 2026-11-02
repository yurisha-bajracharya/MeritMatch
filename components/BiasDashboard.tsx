"use client";

import { useEffect, useRef, useState } from "react";
import type { BiasStats } from "@/lib/bias";

/** 0 to 1, eased, starting once `active` turns true. Jumps to 1 if the user prefers reduced motion. */
function useProgress(active: boolean, ms = 1400) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / ms);
      setP(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, ms]);
  return p;
}

function Bar({
  label,
  value,
  shown,
  kind,
}: {
  label: string;
  value: number;
  shown: number;
  kind: "pool" | "merit" | "resume";
}) {
  const fill =
    kind === "merit"
      ? "bg-brand"
      : kind === "pool"
        ? "bg-ink/35"
        : "border-2 border-dashed border-brand bg-transparent";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{Math.round(shown)}%</span>
      </div>
      <div
        className="mt-1 h-4 bg-rule/60"
        role="img"
        aria-label={`${label}: ${value}%`}
      >
        <div className={`h-full ${fill}`} style={{ width: `${shown}%` }} />
      </div>
    </div>
  );
}

type Metric = { key: "women" | "rural"; title: string; noun: string };

const metrics: Metric[] = [
  { key: "women", title: "Women", noun: "women" },
  { key: "rural", title: "Rural applicants", noun: "from rural areas" },
];

function MetricBlock({
  m,
  stats,
  compare,
}: {
  m: Metric;
  stats: BiasStats;
  compare: boolean;
}) {
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const p = useProgress(seen);
  const merit = stats.merit[m.key];
  const resume = stats.resume[m.key];
  const diff = merit - resume;

  return (
    <section
      ref={ref}
      className="border-t border-rule py-6"
      aria-labelledby={`h-${m.key}`}
    >
      <h2 id={`h-${m.key}`} className="font-semibold">
        {m.title}
      </h2>
      <p className="mt-2 flex items-baseline gap-3">
        <span className="font-display text-6xl text-brand tabular-nums">
          {Math.round(merit * p)}%
        </span>
        <span>of the shortlist are {m.noun}</span>
      </p>

      <Bar
        label="All applicants"
        value={stats.pool[m.key]}
        shown={stats.pool[m.key] * p}
        kind="pool"
      />
      <Bar
        label="MeritMatch shortlist"
        value={merit}
        shown={merit * p}
        kind="merit"
      />
      {compare && (
        <>
          <Bar
            label="Resume screening (assumed)"
            value={resume}
            shown={resume * p}
            kind="resume"
          />
          <p className="mt-4 border-l-4 border-ochre pl-3 font-medium">
            {diff > 0
              ? `${diff} points more ${m.noun} than the resume-based estimate`
              : diff < 0
                ? `${-diff} points fewer ${m.noun} than the resume-based estimate`
                : `Same share of ${m.noun} as the resume-based estimate`}
          </p>
        </>
      )}
    </section>
  );
}

export default function BiasDashboard({
  stats,
  odds,
}: {
  stats: BiasStats;
  odds: { women: number; rural: number };
}) {
  const [compare, setCompare] = useState(false);

  return (
    <div>
      <div className="border-t border-rule py-4">
        <button
          type="button"
          role="switch"
          aria-checked={compare}
          onClick={() => setCompare((c) => !c)}
          className="flex w-full items-center justify-between gap-4 min-h-12 text-left cursor-pointer"
        >
          <span className="font-medium">
            Compare to a resume-based hypothetical
          </span>
          <span
            className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-brand ${compare ? "bg-brand" : "bg-transparent"}`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full ${compare ? "left-[26px] bg-ochre" : "left-0.5 bg-brand"}`}
            />
          </span>
        </button>
      </div>

      {metrics.map((m) => (
        <MetricBlock key={m.key} m={m} stats={stats} compare={compare} />
      ))}

      <section className="border-t border-rule py-6 text-sm space-y-2">
        <p>
          Based on {stats.applicants} applicants and a shortlist of{" "}
          {stats.shortlisted}. Scores come from the task answers only; gender
          and area are never sent to the scorer.
        </p>
        {stats.applicants < 20 && (
          <p>
            This is a small group, so treat the percentages as a rough guide.
          </p>
        )}
        {compare && (
          <p>
            The resume figure is an illustration, not measured data. It assumes
            a resume screen passes women at {Math.round(odds.women * 100)}% and
            rural applicants at {Math.round(odds.rural * 100)}% of the rate of
            otherwise equal applicants.
          </p>
        )}
      </section>
    </div>
  );
}
