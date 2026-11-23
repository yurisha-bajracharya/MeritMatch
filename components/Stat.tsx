/** One number with a label. Used on the report pages. */
export default function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="border-l-2 border-brand pl-4">
      <p className="text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
