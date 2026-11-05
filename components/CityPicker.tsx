"use client";

import Icon from "./Icon";
import { ANYWHERE, CITIES, PROVINCES, cityName } from "@/lib/places";
import type { Lang } from "@/lib/types";

/**
 * Multi-select for a candidate's preferred cities. Picking "anywhere" means
 * they are open to any city; specific cities are then ignored for filtering
 * but kept so the person can switch back.
 */
export function CityPicker({
  value,
  onChange,
  lang,
  max = 5,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  lang: Lang;
  max?: number;
}) {
  const anywhere = value.includes(ANYWHERE);
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (id === ANYWHERE || value.filter((x) => x !== ANYWHERE).length < max) {
      onChange([...value, id]);
    }
  };

  const byProvince = Object.entries(PROVINCES).map(([pid, label]) => ({
    pid,
    label,
    cities: CITIES.filter((c) => c.province === pid),
  }));

  const chip = (selected: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
      selected
        ? "border-brand bg-brand-light text-brand"
        : "border-rule text-ink-light hover:border-brand/50"
    }`;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => toggle(ANYWHERE)}
        aria-pressed={anywhere}
        className={chip(anywhere)}
      >
        {anywhere && <Icon name="check" size={12} strokeWidth={3} />}
        {cityName(ANYWHERE, lang)}
      </button>

      {byProvince.map(({ pid, label, cities }) => (
        <div key={pid}>
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-muted">{label[lang]}</p>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((c) => {
              const selected = value.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={selected}
                  className={chip(selected)}
                >
                  {selected && <Icon name="check" size={12} strokeWidth={3} />}
                  {c.name[lang]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-ink-muted">
        {lang === "ne"
          ? `बढीमा ${max} शहर रोज्न सकिन्छ। यसले तपाईंलाई नजिकका काम पहिले देखाउँछ; अन्य ठाउँका काम लुकाइँदैन जबसम्म तपाईंले फिल्टर नलगाउनुहुन्छ।`
          : `Pick up to ${max} cities. Nearby jobs are shown first; jobs elsewhere are not hidden unless you filter.`}
      </p>
    </div>
  );
}

/** Single city dropdown for employers posting a job, grouped by province. */
export function CitySelect({
  value,
  onChange,
  lang,
  required,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
  required?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{lang === "ne" ? "शहर छान्नुहोस्" : "Choose a city"}</option>
      {Object.entries(PROVINCES).map(([pid, label]) => (
        <optgroup key={pid} label={label[lang]}>
          {CITIES.filter((c) => c.province === pid).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
