"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/asset-url";

export type ShowcaseItem = {
  id: string;
  title: string;
  serviceKey: string;
  nicheSlug: string | null;
  description: string | null;
  tags: string[];
  afterImageKey: string | null;
  beforeImageKey: string | null;
  isFeatured: boolean;
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART: "Vector Art",
  CUSTOM_PATCHES: "Custom Patches",
  VECTOR_REDRAW: "Vector Art",
  COLOR_SEPARATION: "Color Separation",
  DTF_SCREEN_PRINT: "DTF / Screen Print",
};

const SERVICE_ACCENTS: Record<
  string,
  { badge: string; grad: string; glow: string }
> = {
  EMBROIDERY_DIGITIZING: {
    badge:
      "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/[0.12] dark:text-indigo-200",
    grad:
      "from-indigo-100 via-white to-slate-100 dark:from-indigo-950 dark:via-indigo-900/60 dark:to-[#060d1a]",
    glow: "from-indigo-500/20 to-violet-500/10",
  },
  VECTOR_ART: {
    badge:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/[0.12] dark:text-violet-200",
    grad:
      "from-violet-100 via-white to-slate-100 dark:from-violet-950 dark:via-violet-900/60 dark:to-[#060d1a]",
    glow: "from-violet-500/20 to-fuchsia-500/10",
  },
  VECTOR_REDRAW: {
    badge:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/[0.12] dark:text-violet-200",
    grad:
      "from-violet-100 via-white to-slate-100 dark:from-violet-950 dark:via-violet-900/60 dark:to-[#060d1a]",
    glow: "from-violet-500/20 to-fuchsia-500/10",
  },
  CUSTOM_PATCHES: {
    badge:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/[0.12] dark:text-amber-200",
    grad:
      "from-amber-100 via-white to-slate-100 dark:from-amber-950 dark:via-amber-900/50 dark:to-[#060d1a]",
    glow: "from-amber-500/20 to-orange-500/10",
  },
  COLOR_SEPARATION: {
    badge:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/[0.12] dark:text-emerald-200",
    grad:
      "from-emerald-100 via-white to-slate-100 dark:from-emerald-950 dark:via-emerald-900/50 dark:to-[#060d1a]",
    glow: "from-emerald-500/20 to-teal-500/10",
  },
  DTF_SCREEN_PRINT: {
    badge:
      "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/[0.12] dark:text-blue-200",
    grad:
      "from-blue-100 via-white to-slate-100 dark:from-blue-950 dark:via-blue-900/50 dark:to-[#060d1a]",
    glow: "from-blue-500/20 to-cyan-500/10",
  },
};

const DEFAULT_ACCENT = {
  badge:
    "border-slate-300 bg-white/70 text-slate-600 dark:border-white/15 dark:bg-white/[0.07] dark:text-white/60",
  grad:
    "from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-900/60 dark:to-[#060d1a]",
  glow: "from-slate-500/10 to-slate-500/5",
};

const MACHINE_FEATURES = [
  {
    icon: "🧵",
    title: "15-Head Machines",
    desc: "Commercial embroidery production ready for apparel, caps, and patches.",
  },
  {
    icon: "🎯",
    title: "Proof-First Workflow",
    desc: "Clients review clean JPG/PNG proofs before final production files.",
  },
  {
    icon: "⚡",
    title: "Fast Turnaround",
    desc: "Rush-ready process for urgent digitizing, vector, and patch artwork.",
  },
  {
    icon: "🔁",
    title: "Free Revisions",
    desc: "Revision-friendly workflow until the artwork is production-ready.",
  },
];

const PLACEHOLDER_ITEMS: ShowcaseItem[] = [
  {
    id: "ph1",
    title: "Left Chest Logo",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "left-chest-logo",
    description: "Clean satin-stitch left chest embroidery for premium apparel.",
    tags: ["Left Chest", "Logo"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph2",
    title: "Jacket Back Hero Design",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "jacket-back",
    description: "Large multi-color jacket back digitizing with polished detail.",
    tags: ["Jacket Back", "Large"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: true,
  },
  {
    id: "ph3",
    title: "Logo Vector Redraw",
    serviceKey: "VECTOR_ART",
    nicheSlug: "jpg-to-vector",
    description: "Clean vector redraw from rough raster artwork.",
    tags: ["Vector", "Print"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph4",
    title: "3D Puff Cap Logo",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "3d-puff",
    description: "Foam-backed 3D puff embroidery for structured cap fronts.",
    tags: ["3D Puff", "Cap"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph5",
    title: "Embroidered Badge Patch",
    serviceKey: "CUSTOM_PATCHES",
    nicheSlug: "embroidered-patches",
    description: "Merrowed border badge patch with production-ready finish.",
    tags: ["Patch", "Badge"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph6",
    title: "Full Back Jacket Design",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "full-back",
    description: "Detailed full-back digitizing with smooth fills and trims.",
    tags: ["Full Back", "Multi-Color"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph7",
    title: "Hat Crown Embroidery",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "cap-hat-logo",
    description: "Structured crown embroidery for caps and hats.",
    tags: ["Cap", "Crown"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
  {
    id: "ph8",
    title: "DTF Print-Ready Art",
    serviceKey: "VECTOR_ART",
    nicheSlug: "print-ready-artwork",
    description: "DTF and screen-print ready vector artwork.",
    tags: ["DTF", "Print"],
    afterImageKey: null,
    beforeImageKey: null,
    isFeatured: false,
  },
];

function canonicalKey(key: string) {
  return key === "VECTOR_REDRAW" ? "VECTOR_ART" : key;
}

function getS3Url(key: string | null): string | null {
  if (!key) return null;

  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return null;

  return assetUrl(key);
}

export function ProductionShowcaseClient({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = React.useState("ALL");

  const pool = React.useMemo(
    () => (items.length > 0 ? items : PLACEHOLDER_ITEMS),
    [items],
  );

  const displayItems = React.useMemo(() => {
    if (active === "ALL") return pool;
    return pool.filter((item) => canonicalKey(item.serviceKey) === active);
  }, [pool, active]);

  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; label: string }[] = [
      { key: "ALL", label: "All" },
    ];

    for (const item of pool) {
      const key = canonicalKey(item.serviceKey);

      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          key,
          label: SERVICE_LABELS[key] ?? key,
        });
      }
    }

    return list;
  }, [pool]);

  const loopItems = React.useMemo(
    () => [...displayItems, ...displayItems],
    [displayItems],
  );

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28">
      <ProductionBackground />

      <div className="page-shell relative z-10">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-4xl text-center md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Our Work
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
            Real stitch quality.
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
              Clean vector artwork.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base">
            See how rough artwork becomes production-ready embroidery, custom
            patches, vector files, and print-ready artwork.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/portfolio"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
            >
              View Portfolio
            </Link>
          </div>
        </div>

        {/* Trust pills */}
        <div className="mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-2">
          {MACHINE_FEATURES.map((feature) => (
            <span
              key={feature.title}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
              {feature.title}
            </span>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mx-auto mb-8 flex max-w-5xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center md:overflow-visible">
            {categories.map((category) => {
              const isActive = active === category.key;

              return (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(category.key)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300",
                    isActive
                      ? "border-indigo-500/30 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:border-indigo-400/40 dark:bg-indigo-400/15 dark:text-indigo-100"
                      : "border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300 hover:text-slate-950 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-white/45 dark:hover:border-white/20 dark:hover:text-white/75",
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Phone */}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {displayItems.map((item, index) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              priority={index < 2}
              className="w-[84vw] shrink-0 snap-center"
              mobile
            />
          ))}
        </div>

        {/* Desktop */}
        <div className="gx-marquee hidden overflow-hidden md:block md:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div
            key={active}
            className={cn(
              "gx-marquee-track flex w-max gap-5 py-4",
              displayItems.length <= 3 && "gx-marquee-track-static",
            )}
          >
            {loopItems.map((item, index) => (
              <ShowcaseCard
                key={`${item.id}-${index}`}
                item={item}
                priority={index < 4}
                isDuplicate={index >= displayItems.length}
                className="w-[22rem] shrink-0 xl:w-[24rem]"
              />
            ))}
          </div>
        </div>

        {/* Feature cards: desktop/tablet only */}
        <div className="mt-10 hidden gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4">
          {MACHINE_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/[0.14] dark:hover:shadow-black/20"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl dark:border-white/[0.08] dark:bg-white/[0.06]">
                {feature.icon}
              </div>

              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                {feature.title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-white/48">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes gx-marquee-x {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes gx-thread-drift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0.45;
          }
          100% {
            transform: translate3d(18px, -16px, 0) rotate(2deg);
            opacity: 0.85;
          }
        }

        @keyframes gx-stitch-dash {
          to {
            stroke-dashoffset: -220;
          }
        }

        @keyframes gx-node-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.45);
            opacity: 0.85;
          }
        }

        .gx-marquee-track {
          animation: gx-marquee-x 42s linear infinite;
          will-change: transform;
        }

        .gx-marquee:hover .gx-marquee-track,
        .gx-marquee:focus-within .gx-marquee-track {
          animation-play-state: paused;
        }

        .gx-marquee-track-static {
          animation: none;
          transform: none;
        }

        .gx-thread-drift {
          animation: gx-thread-drift 7s ease-in-out infinite alternate;
        }

        .gx-stitch-dash {
          stroke-dasharray: 10 12;
          animation: gx-stitch-dash 16s linear infinite;
        }

        .gx-node-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: gx-node-pulse 3.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .gx-marquee-track,
          .gx-thread-drift,
          .gx-stitch-dash,
          .gx-node-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function ShowcaseCard({
  item,
  className,
  priority = false,
  isDuplicate = false,
  mobile = false,
}: {
  item: ShowcaseItem;
  className?: string;
  priority?: boolean;
  isDuplicate?: boolean;
  mobile?: boolean;
}) {
  const [showBefore, setShowBefore] = React.useState(false);

  const afterUrl = getS3Url(item.afterImageKey);
  const beforeUrl = getS3Url(item.beforeImageKey);
  const hasBoth = Boolean(afterUrl && beforeUrl);

  const key = canonicalKey(item.serviceKey);
  const accent = SERVICE_ACCENTS[key] ?? DEFAULT_ACCENT;
  const label = SERVICE_LABELS[key] ?? item.serviceKey;
  const href = item.nicheSlug ? `/portfolio/${item.nicheSlug}` : "/portfolio";

  return (
    <article
      aria-hidden={isDuplicate || undefined}
      className={cn("group/card relative", className)}
    >
      {item.isFeatured && (
        <div
          className={cn(
            "pointer-events-none absolute -inset-1 rounded-[1.7rem] bg-gradient-to-br opacity-0 blur-xl transition duration-500 group-hover/card:opacity-100",
            accent.glow,
          )}
        />
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white/70 shadow-sm shadow-slate-950/5 backdrop-blur transition-all duration-300 dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/20",
          mobile
            ? "h-[360px]"
            : "h-[335px] group-hover/card:z-20 group-hover/card:-translate-y-2 group-hover/card:scale-[1.035] group-hover/card:border-slate-300 group-hover/card:shadow-2xl group-hover/card:shadow-slate-950/15 dark:group-hover/card:border-white/[0.22] dark:group-hover/card:shadow-black/45",
        )}
      >
        <Link
          href={href}
          tabIndex={isDuplicate ? -1 : undefined}
          className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#050814]"
          aria-label={`View portfolio case: ${item.title}`}
        >
          <div className="relative h-full overflow-hidden rounded-[1.7rem]">
            {afterUrl ? (
              <>
                <Image
                  src={afterUrl}
                  alt={item.title}
                  fill
                  priority={priority}
                  draggable={false}
                  className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
                  sizes="(max-width: 640px) 84vw, (max-width: 1024px) 22rem, 24rem"
                />

                {beforeUrl && (
                  <div
                    className={cn(
                      "absolute inset-0 transition-[clip-path] duration-500 ease-out",
                      showBefore
                        ? "[clip-path:inset(0_0_0_0)]"
                        : "[clip-path:inset(0_100%_0_0)] md:group-hover/card:[clip-path:inset(0_50%_0_0)]",
                    )}
                  >
                    <Image
                      src={beforeUrl}
                      alt={`Before: ${item.title}`}
                      fill
                      draggable={false}
                      className="object-cover"
                      sizes="(max-width: 640px) 84vw, (max-width: 1024px) 22rem, 24rem"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", accent.grad)}>
                <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-36 w-36 rounded-full border border-slate-300/60 bg-white/35 shadow-inner dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="absolute inset-6 rounded-full border border-dashed border-slate-400/60 dark:border-white/15" />
                    <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-300/80 bg-white/50 shadow-sm dark:border-white/10 dark:bg-white/[0.04]" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-[0.14] dark:opacity-[0.08]">
                      ✦
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />

            <div className="absolute left-4 right-4 top-4 z-[4] flex items-start justify-between gap-2">
              {item.isFeatured ? (
                <span className="rounded-full border border-amber-400/35 bg-amber-400/[0.18] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-100 shadow-sm backdrop-blur">
                  Featured
                </span>
              ) : (
                <span />
              )}

              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide shadow-sm backdrop-blur",
                  accent.badge,
                )}
              >
                {label}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-[4] p-5">
              <h3 className="line-clamp-1 text-lg font-black leading-snug text-white">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/64">
                  {item.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-3">
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.13] px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <span className="ml-auto inline-flex items-center text-[11px] font-bold uppercase tracking-widest text-white/80">
                  View
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {hasBoth && (
          <button
            type="button"
            tabIndex={isDuplicate ? -1 : undefined}
            aria-pressed={showBefore}
            onClick={() => setShowBefore((value) => !value)}
            className="absolute left-5 top-16 z-[5] rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur transition hover:bg-black/70"
          >
            {showBefore ? "Show After" : "Show Before"}
          </button>
        )}
      </div>
    </article>
  );
}

function ProductionBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_45%,rgba(99,102,241,0.16),transparent_58%),radial-gradient(ellipse_42%_36%_at_85%_20%,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_36%_52%_at_55%_92%,rgba(59,130,246,0.09),transparent_55%)] dark:bg-[radial-gradient(ellipse_60%_55%_at_15%_50%,rgba(99,102,241,0.16),transparent_58%),radial-gradient(ellipse_44%_38%_at_85%_22%,rgba(139,92,246,0.11),transparent_55%),radial-gradient(ellipse_36%_52%_at_55%_92%,rgba(59,130,246,0.08),transparent_55%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.09)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_78%_78%_at_50%_50%,black_25%,transparent_72%)] dark:bg-[radial-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)]" />

      <ProductionSvgAtmosphere />
    </>
  );
}

function ProductionSvgAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <svg
        className="gx-thread-drift absolute -left-20 top-16 hidden h-64 w-[42rem] opacity-70 dark:opacity-50 md:block"
        viewBox="0 0 680 260"
        fill="none"
      >
        <path
          d="M20 160 C120 40 210 240 320 120 C430 0 520 210 660 82"
          stroke="url(#threadGradientOne)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="gx-stitch-dash"
          d="M20 160 C120 40 210 240 320 120 C430 0 520 210 660 82"
          stroke="rgba(99,102,241,0.55)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="threadGradientOne"
            x1="20"
            y1="0"
            x2="660"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute right-4 top-10 hidden h-72 w-72 opacity-50 dark:opacity-35 md:block"
        viewBox="0 0 280 280"
        fill="none"
      >
        <path
          d="M48 188 C72 76 170 56 218 108 C254 146 202 218 120 204"
          stroke="rgba(99,102,241,0.35)"
          strokeWidth="1.5"
        />
        {[48, 120, 218].map((x, index) => (
          <circle
            key={x}
            className="gx-node-pulse"
            style={{ animationDelay: `${index * 0.5}s` }}
            cx={x}
            cy={index === 0 ? 188 : index === 1 ? 204 : 108}
            r="5"
            fill="#6366f1"
          />
        ))}
        <path
          d="M48 188 L28 204 M48 188 L68 172 M120 204 L98 224 M120 204 L143 184 M218 108 L240 92 M218 108 L196 124"
          stroke="rgba(15,23,42,0.35)"
          strokeWidth="1"
          className="dark:stroke-white/30"
        />
      </svg>

      <svg
        className="absolute bottom-8 left-6 hidden h-56 w-56 rotate-[-10deg] opacity-45 dark:opacity-30 lg:block"
        viewBox="0 0 240 240"
        fill="none"
      >
        <path
          d="M120 22 L185 48 L214 114 L191 183 L120 218 L49 183 L26 114 L55 48 Z"
          stroke="rgba(245,158,11,0.48)"
          strokeWidth="2"
        />
        <path
          className="gx-stitch-dash"
          d="M120 39 L173 60 L197 115 L178 171 L120 200 L62 171 L43 115 L67 60 Z"
          stroke="rgba(245,158,11,0.55)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}