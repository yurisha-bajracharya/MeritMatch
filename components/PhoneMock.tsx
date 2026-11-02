type Props = {
  sender?: string;
  channel?: string;
  time?: string;
  children: React.ReactNode;
};

/** Mock of a phone showing an incoming text. Not connected to any telecom service. */
export default function PhoneMock({
  sender = "MeritMatch",
  channel = "SMS",
  time = "now",
  children,
}: Props) {
  return (
    <figure
      className="mx-auto w-full max-w-[18rem] rounded-[28px] border-[3px] border-ink bg-paper p-3"
      aria-label={`${channel} message preview`}
    >
      <div
        className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink/80"
        aria-hidden
      />
      <figcaption className="flex items-baseline justify-between border-b border-rule pb-2 text-sm">
        <span className="font-semibold">{sender}</span>
        <span className="text-ink/75">{channel}</span>
      </figcaption>
      <div className="py-3">
        <div className="rounded-2xl rounded-tl-sm border border-rule bg-white px-3 py-2 text-[0.95rem] leading-snug">
          {children}
        </div>
        <p className="mt-1 pl-1 text-xs text-ink/75">{time}</p>
      </div>
    </figure>
  );
}
