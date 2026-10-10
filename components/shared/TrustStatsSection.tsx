import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SITE_CLAIMS } from "@/lib/site-config";

export interface LiveStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  reviewCount: number;
  avgRating?: number | null;
}

/**
 * Live counts are only shown once they are worth showing.
 *
 * Below this, the row falls back to published policy claims — which are true
 * statements about price, turnaround and revisions, never invented numbers.
 * Hiding a weak real number is not a false claim; inventing a strong one is.
 * Raise or lower this to taste — it is the only knob.
 */
export const MIN_LIVE_COUNT = 10;

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

export function TrustStatsSection({ stats }: { stats?: LiveStats }) {
  // Real numbers first. Every value below is read from the database at request
  // time (getLiveStats in app/(marketing)/home/page.tsx, revalidated every 5
  // minutes) and is only rendered when it is above zero — so this row can never
  // advertise "0 designs delivered", and it falls back to the published policy
  // claims when there is nothing real to report yet.
  //
  // Do not add a number here that is not read from the database. Hardcoded
  // performance metrics (5,000+ orders, 4.9/5, 98% first-pass) were removed
  // from this component for exactly that reason — see lib/site-config.ts.
  const live: { value: number | string; suffix?: string; label: string }[] = [];

  if (stats?.deliveredOrders && stats.deliveredOrders >= MIN_LIVE_COUNT) {
    live.push({ value: stats.deliveredOrders, label: "Designs Delivered" });
  }
  if (stats?.avgRating && stats.reviewCount >= MIN_LIVE_COUNT) {
    live.push({
      value: stats.avgRating,
      suffix: "/5",
      label: `From ${stats.reviewCount.toLocaleString()} Verified Reviews`,
    });
  }
  if (stats?.activeOrders && stats.activeOrders >= MIN_LIVE_COUNT) {
    live.push({ value: stats.activeOrders, label: "Orders In Production" });
  }
  if (stats?.totalOrders && stats.totalOrders >= MIN_LIVE_COUNT) {
    live.push({ value: stats.totalOrders, label: "Orders Placed" });
  }

  const policy = [
    { value: SITE_CLAIMS.price.value, label: "Standard Designs" },
    { value: "12", suffix: "h", label: "Standard Turnaround" },
    { value: SITE_CLAIMS.revisions.value, label: "Unlimited Revisions" },
    { value: SITE_CLAIMS.formats.value, label: "Machine Formats" },
  ];

  const row = [...live, ...policy].slice(0, 4);
  const hasLive = live.length > 0;

  return (
    <AnimatedSection className="pb-0 pt-6 md:pt-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F3460] p-8 sm:p-10 md:p-14">
          {/* Glow orb */}
          <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[300px] w-[300px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl" />

          <div className="relative z-10">
            <div className="mb-10 text-center sm:mb-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <span
                  className={
                    hasLive
                      ? "h-1.5 w-1.5 animate-pulse rounded-full bg-[#16A34A]"
                      : "h-1.5 w-1.5 rounded-full bg-white/50"
                  }
                />
                {hasLive ? "Operations Live" : "Published Policy"}
              </span>
              <h2 className="mb-3 font-syne text-2xl font-bold text-white md:text-4xl">
                Built on Trust & Speed
              </h2>
              <p className="mx-auto max-w-md text-sm text-white/70">
                Every order backed by real guarantees. No hidden terms. No surprises.
              </p>
            </div>

            {/* Big numbers row — live counts first, published policy fills the rest */}
            <div className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-6 sm:mb-12 sm:gap-8 md:grid-cols-4">
              {row.map((stat) => (
                <TrustStat
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              ))}
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
