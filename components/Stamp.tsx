import { useId } from "react";

type StampProps = {
  /** Text running around the ring */
  label?: string;
  /** Short word in the centre */
  center?: string;
  size?: number;
  tone?: "moss" | "brand" | "ochre";
  /** Slight tilt, like a hand-pressed stamp */
  tilt?: number;
};

const tones = {
  moss: "#4A7856",
  brand: "#1E3A5F",
  ochre: "#D9A441",
};

export default function Stamp({
  label = "VERIFIED BY MERITMATCH",
  center = "PROOF",
  size = 96,
  tone = "moss",
  tilt = -8,
}: StampProps) {
  const id = useId();
  const color = tones[tone];
  const text = `${label} \u2022 `.repeat(2);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${center}: ${label}`}
      style={{ transform: `rotate(${tilt}deg)`, color }}
    >
      <defs>
        <path id={id} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        fontSize="9.5"
        fontWeight="600"
        letterSpacing="1.6"
        fill="currentColor"
      >
        <textPath href={`#${id}`} textLength="272">
          {text}
        </textPath>
      </text>
      <text
        x="60"
        y="65"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        letterSpacing="1"
        fill="currentColor"
      >
        {center}
      </text>
    </svg>
  );
}
