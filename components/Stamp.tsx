"use client";

export default function Stamp({
  ringText,
  center,
  size = 72,
}: {
  ringText: string;
  /** Text for the middle, or "check" to draw a tick mark instead of a character. */
  center: string;
  size?: number;
}) {
  const r = size / 2;
  const textR = r * 0.72;

  // Repeat text to fill circle
  const upper = ringText.toUpperCase();
  const fill = (upper + " · ").repeat(4);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <path
          id={`ring-${size}`}
          d={`M ${r},${r} m -${textR},0 a ${textR},${textR} 0 1,1 ${textR * 2},0 a ${textR},${textR} 0 1,1 -${textR * 2},0`}
        />
      </defs>

      <circle cx={r} cy={r} r={r - 2} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx={r} cy={r} r={r - 6} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />

      <text fontSize={size * 0.1} fill="currentColor" fontWeight="600" letterSpacing="0.12em">
        <textPath href={`#ring-${size}`} startOffset="0%">
          {fill}
        </textPath>
      </text>

      {center === "check" ? (
        <path
          d={`M ${r - size * 0.13} ${r + size * 0.01} l ${size * 0.09} ${size * 0.09} l ${size * 0.17} -${size * 0.18}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={Math.max(2, size * 0.07)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <text
          x={r}
          y={r}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.22}
          fontWeight="800"
          fill="currentColor"
        >
          {center}
        </text>
      )}
    </svg>
  );
}
