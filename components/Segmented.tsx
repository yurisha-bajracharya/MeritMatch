"use client";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export default function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex border-[1.5px] border-brand rounded-[4px] overflow-hidden">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex-1 min-h-12 flex items-center justify-center px-3 text-center cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ochre has-[:focus-visible]:-outline-offset-3 ${
              value === o.value
                ? "bg-brand text-paper font-semibold"
                : "text-brand"
            }`}
          >
            <input
              type="radio"
              name={legend}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
