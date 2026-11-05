/**
 * MeritMatch logo — two overlapping circles.
 *
 * The outlined circle (ruled with wavy strands) is the candidate: textured,
 * individual, not yet filled in. The solid coral circle is the opportunity.
 * They overlap — that overlap is the match.
 *
 * Pure SVG, no hooks, so it works in both server and client components.
 * The <defs> ids are shared across instances on purpose: every instance
 * declares identical defs, so the browser resolving to the first is correct.
 */

export function LogoMark({
  size = 32,
  className = "",
  withBackdrop = false,
}: {
  size?: number;
  className?: string;
  /** Paint the dark plate behind the mark (for light surfaces / favicons). */
  withBackdrop?: boolean;
}) {
  // Stroke is in viewBox units, so it shrinks with the mark. Without this a
  // 26px navbar logo draws hairlines and turns to mush.
  const sw = size < 40 ? 5.5 : size < 90 ? 3.4 : 2.2;

  return (
    <svg
      viewBox="0 0 405 302"
      width={(size * 405) / 302}
      height={size}
      className={className}
      role="img"
      aria-label="MeritMatch"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mmGrad" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#F2707C" />
          <stop offset="45%" stopColor="#F65F6F" />
          <stop offset="100%" stopColor="#F03B50" />
        </linearGradient>
        <clipPath id="mmClip">
          <circle cx="134" cy="150" r="126" />
        </clipPath>
      </defs>

      {withBackdrop && <rect width="405" height="302" rx="48" fill="#191824" />}

      {/* opportunity */}
      <circle cx="263" cy="150" r="128" fill="url(#mmGrad)" />

      {/* candidate — wavy strands, clipped to the outlined circle */}
      <g clipPath="url(#mmClip)">
        <g
          transform="rotate(-16 134 150)"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        >
          <path d="M-16 -20 C0 -5 0 10 -16 25 C-32 40 -32 55 -16 70 C0 85 0 100 -16 115 C-32 130 -32 145 -16 160 C0 175 0 190 -16 205 C-32 220 -32 235 -16 250 C0 265 0 280 -16 295 C-32 310 -32 325 -16 340" />
          <path d="M38 -20 C54 -5 54 10 38 25 C22 40 22 55 38 70 C54 85 54 100 38 115 C22 130 22 145 38 160 C54 175 54 190 38 205 C22 220 22 235 38 250 C54 265 54 280 38 295 C22 310 22 325 38 340" />
          <path d="M92 -20 C108 -5 108 10 92 25 C76 40 76 55 92 70 C108 85 108 100 92 115 C76 130 76 145 92 160 C108 175 108 190 92 205 C76 220 76 235 92 250 C108 265 108 280 92 295 C76 310 76 325 92 340" />
          <path d="M146 -20 C162 -5 162 10 146 25 C130 40 130 55 146 70 C162 85 162 100 146 115 C130 130 130 145 146 160 C162 175 162 190 146 205 C130 220 130 235 146 250 C162 265 162 280 146 295 C130 310 130 325 146 340" />
          <path d="M200 -20 C216 -5 216 10 200 25 C184 40 184 55 200 70 C216 85 216 100 200 115 C184 130 184 145 200 160 C216 175 216 190 200 205 C184 220 184 235 200 250 C216 265 216 280 200 295 C184 310 184 325 200 340" />
          <path d="M254 -20 C270 -5 270 10 254 25 C238 40 238 55 254 70 C270 85 270 100 254 115 C238 130 238 145 254 160 C270 175 270 190 254 205 C238 220 238 235 254 250 C270 265 270 280 254 295 C238 310 238 325 254 340" />
        </g>
      </g>

      <circle cx="134" cy="150" r="126" stroke="currentColor" strokeWidth={sw} />
    </svg>
  );
}

/** Mark + wordmark, for the navbar and the hero. */
export default function Logo({
  size = 28,
  className = "",
  showText = true,
}: {
  size?: number;
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="text-ink shrink-0" />
      {showText && (
        <span className="font-display font-bold tracking-tight text-ink">
          MeritMatch
        </span>
      )}
    </span>
  );
}
