import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";

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
      <div className="font-syne font-bold text-3xl md:text-4xl text-white leading-none">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix ?? ""}
      </div>
      <div className="text-xs text-white/60 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

export function TrustStatsSection() {
  return (
    <AnimatedSection className="pt-6 md:pt-20 pb-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="relative bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F3460] rounded-3xl p-8 sm:p-10 md:p-14 overflow-hidden">
          {/* Glow orb */}
          <div className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-10 sm:mb-12">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs
                font-semibold uppercase tracking-wider mb-4
                bg-white/15 text-white border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Operations Live
              </span>
              <h2 className="font-syne font-bold text-2xl md:text-4xl text-white mb-3">
                Built on Trust & Speed
              </h2>
              <p className="text-white/70 text-sm max-w-md mx-auto">
                Every order backed by real guarantees. No hidden terms. No surprises.
              </p>
            </div>

            {/* Big numbers row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto mb-10 sm:mb-12">
              <TrustStat value={SITE_STATS.ordersCompleted} suffix="+" label="Orders Completed" />
              <TrustStat value={SITE_STATS.clientsServed} suffix="+" label="Clients Worldwide" />
              <TrustStat value={`${SITE_STATS.avgDeliveryHours}`} suffix="h" label="Avg. Delivery" />
              <TrustStat value={SITE_STATS.satisfactionRate} suffix="%" label="Satisfaction Rate" />
            </div>

            {/* Operational details — compact grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-4xl mx-auto mb-8">
              {[
                { icon: "⚡", label: "3–24h Delivery", sub: "Rush in 6h, urgent in 3h" },
                { icon: "🔄", label: "1.2 Avg Revisions", sub: "98% first-pass approval" },
                { icon: "💬", label: "< 1hr Response", sub: "Support 7 days a week" },
                { icon: "⭐", label: `${SITE_STATS.avgRating}/5 Rating`, sub: `${fmtPlus(SITE_STATS.verifiedReviews)} verified reviews` },
                { icon: "🛡️", label: "100% Guarantee", sub: "Free revisions until perfect" },
                { icon: "🌍", label: `${SITE_STATS.countriesServed}+ Countries`, sub: `${fmtPlus(SITE_STATS.ordersCompleted)} orders delivered` },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-lg flex-shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white/90 truncate">{s.label}</div>
                    <div className="text-[10px] text-white/50">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              {["🧵 Hand-digitized", "✓ Machine-tested", "♾️ Free revisions", "🔄 All formats", "⚡ 3-24h delivery"].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1 text-[11px] font-medium text-white/80 px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
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
