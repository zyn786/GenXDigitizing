import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SITE_CLAIMS } from "@/lib/site-config";

function TrustStat({
  value,
  suffix,
  label,
}: {
  value: number | string;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="font-syne text-3xl font-bold leading-none text-white md:text-4xl">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix ?? ""}
      </div>
      <div className="mt-1.5 text-xs font-medium text-white/60">{label}</div>
    </div>
  );
}

export function TrustStatsSection() {
  return (
    <AnimatedSection className="pb-0 pt-6 md:pt-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F3460] p-8 sm:p-10 md:p-14">
          {/* Glow orb */}
          <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[300px] w-[300px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl" />

          <div className="relative z-10">
            <div className="mb-10 text-center sm:mb-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16A34A]" />
                Operations Live
              </span>
              <h2 className="mb-3 font-syne text-2xl font-bold text-white md:text-4xl">
                Built on Trust & Speed
              </h2>
              <p className="mx-auto max-w-md text-sm text-white/70">
                Every order backed by real guarantees. No hidden terms. No surprises.
              </p>
            </div>

            {/* Big numbers row */}
            <div className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-6 sm:mb-12 sm:gap-8 md:grid-cols-4">
              {/* Was 5,000+ orders / 500+ clients / 4h / 99% satisfaction, all
                  invented. These are provable instead: price from
                  service_tiers, turnaround and revisions from published policy,
                  format count from the output_fmt enum. */}
              <TrustStat value={SITE_CLAIMS.price.value} label="Standard Designs" />
              <TrustStat value="12" suffix="h" label="Standard Turnaround" />
              <TrustStat value={SITE_CLAIMS.revisions.value} label="Unlimited Revisions" />
              <TrustStat value={SITE_CLAIMS.formats.value} label="Machine Formats" />
            </div>

            {/* Operational details — compact grid */}
            <div className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {[
                // "1.2 Avg Revisions / 98% first-pass approval" was invented — a
                // performance metric for work that had never been done. The
                // replacements are capabilities and policies, not results.
                { icon: "⚡", label: "3–24h Delivery", sub: "Rush in 6h, urgent in 3h" },
                { icon: "🔄", label: "Unlimited Revisions", sub: "Free, until it's right" },
                { icon: "💬", label: "< 1hr Response", sub: "Support 7 days a week" },
                { icon: "♻️", label: "All Formats Free", sub: "DST, PES, EMB, JEF + more" },
                { icon: "🛡️", label: "100% Guarantee", sub: "Free revisions until perfect" },
                { icon: "🌍", label: "Worldwide", sub: "Files delivered digitally" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className="flex-shrink-0 text-lg">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white/90">{s.label}</div>
                    <div className="text-[10px] text-white/50">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "🧵 Hand-digitized",
                "✓ Machine-tested",
                "♾️ Free revisions",
                "🔄 All formats",
                "⚡ 3-24h delivery",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
