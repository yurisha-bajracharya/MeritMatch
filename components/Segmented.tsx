"use client";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="tab-list" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={`tab ${o.value === value ? "tab-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
