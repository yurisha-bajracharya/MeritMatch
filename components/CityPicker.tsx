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

  const chosen = value.filter((v) => v !== ANYWHERE);
  const full = chosen.length >= max;
  const ne = lang === "ne";

  // Compact on purpose: chosen cities as removable chips plus one dropdown,
  // instead of every city in Nepal laid out at once.
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={anywhere}
          onChange={() => toggle(ANYWHERE)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#900000]"
        />
        <span>
          <span className="block text-base font-medium text-ink">{cityName(ANYWHERE, lang)}</span>
          <span className="block text-sm text-ink-muted">
            {ne ? "कुनै पनि शहरको काम उत्तिकै देखाइन्छ।" : "Jobs in every city are shown equally."}
          </span>
        </span>
      </label>

      <div>
        <p className="label">{ne ? `रोजेका शहर (${chosen.length}/${max})` : `Your cities (${chosen.length} of ${max})`}</p>
        {chosen.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chosen.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="chip !border-ink/30 !text-ink"
                  aria-label={ne ? `${cityName(id, lang)} हटाउनुहोस्` : `Remove ${cityName(id, lang)}`}
                >
                  {cityName(id, lang)}
                  <Icon name="x" size={14} className="text-ink-muted" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">{ne ? "अहिलेसम्म कुनै शहर रोजिएको छैन।" : "No cities chosen yet."}</p>
        )}
      </div>

      <div>
        <label className="sr-only" htmlFor="add-city">
          {ne ? "शहर थप्नुहोस्" : "Add a city"}
        </label>
        <select
          id="add-city"
          className="input"
          value=""
          disabled={full}
          onChange={(e) => e.target.value && toggle(e.target.value)}
        >
          <option value="">
            {full
              ? ne
                ? `बढीमा ${max} शहर रोजिसक्नुभयो`
                : `You have chosen ${max} cities`
              : ne
                ? "+ शहर थप्नुहोस्"
                : "+ Add a city"}
          </option>
          {Object.entries(PROVINCES).map(([pid, label]) => (
            <optgroup key={pid} label={label[lang]}>
              {CITIES.filter((c) => c.province === pid && !value.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[lang]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="hint">
          {ne
            ? "तपाईंका शहरका काम पहिले देखिन्छन्; अन्य ठाउँका काम लुकाइँदैन।"
            : "Jobs in your cities are shown first; jobs elsewhere are not hidden."}
        </p>
      </div>
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
