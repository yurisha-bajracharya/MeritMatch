import Stamp from "@/components/Stamp";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Stamp plus words, so the meaning never depends on the graphic alone. */
export default function VerifiedBadge({
  lang = "en",
  size = 64,
}: {
  lang?: Lang;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Stamp
        size={size}
        center="PROOF"
        label="VERIFIED EMPLOYER"
        tone="moss"
        tilt={-6}
      />
      <div>
        <p className="font-semibold text-moss">{t(lang, "verifiedEmployer")}</p>
        <p className="text-sm">{t(lang, "verifiedNote")}</p>
      </div>
    </div>
  );
}
