import Link from "next/link";
import { ArrowRight, BadgeCheck, BadgeIcon, ImageIcon, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DbItem = {
  id: string;
  title: string;
  serviceKey: string;
  description: string | null;
  tags: string[];
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

const ACCENTS = [
  "from-indigo-500/18 via-violet-500/10 to-blue-500/8",
  "from-emerald-500/18 via-teal-500/10 to-cyan-500/8",
  "from-amber-500/18 via-orange-500/10 to-yellow-500/8",
  "from-blue-500/18 via-cyan-500/10 to-indigo-500/8",
  "from-rose-500/18 via-pink-500/10 to-violet-500/8",
  "from-purple-500/18 via-fuchsia-500/10 to-indigo-500/8",
];

const STATIC_ITEMS = [
  {
    title: "Cap Front Clean-Up",
    category: "Embroidery Digitizing",
    badge: "3D Puff",
    note: "Sharper lettering, cleaner satin direction, and proof-first communication.",
    accent: "from-indigo-500/18 via-violet-500/10 to-blue-500/8",
  },
  {
    title: "Restaurant Brand Rebuild",
    category: "Vector Art",
    badge: "Logo Redraw",
    note: "Scalable logo conversion for apparel, signage, and print-ready production use.",
    accent: "from-emerald-500/18 via-teal-500/10 to-cyan-500/8",
  },
  {
    title: "Morale Patch Set",
    category: "Custom Patches",
    badge: "Embroidered",
    note: "Structured patch planning with approval-ready previews and production detail.",
    accent: "from-amber-500/18 via-orange-500/10 to-yellow-500/8",
  },
  {
    title: "Small Text Uniform Mark",
    category: "Embroidery Digitizing",
    badge: "Left Chest",
    note: "Precision digitizing for difficult readability constraints on smaller garment placements.",
    accent: "from-blue-500/18 via-cyan-500/10 to-indigo-500/8",
  },
  {
    title: "Print Artwork Cleanup",
    category: "Vector Art",
    badge: "Print-Ready",
    note: "Production-ready vector cleanup for apparel and promo print workflows.",
    accent: "from-rose-500/18 via-pink-500/10 to-violet-500/8",
  },
  {
    title: "PVC Patch Concept",
    category: "Custom Patches",
    badge: "PVC",
    note: "Premium patch concept presentation ready for approval and production flow.",
    accent: "from-purple-500/18 via-fuchsia-500/10 to-indigo-500/8",
  },
];

export function PortfolioPreviewGrid({
  dbItems,
}: {
  dbItems?: DbItem[] | null;
}) {
  const items =
    dbItems && dbItems.length > 0
      ? dbItems.map((item, index) => ({
          id: item.id,
          title: item.title,
          category: SERVICE_LABELS[item.serviceKey] ?? item.serviceKey,
          badge: item.tags[0] ?? (item.isFeatured ? "Featured" : "Portfolio"),
          note:
            item.description ??
            "Production-ready artwork prepared with clean specs, proofing, and delivery workflow.",
          featured: item.isFeatured,
          accent: ACCENTS[index % ACCENTS.length],
        }))
      : STATIC_ITEMS.map((item) => ({
          id: item.title,
          title: item.title,
          category: item.category,
          badge: item.badge,
          note: item.note,
          featured: false,
          accent: item.accent,
        }));

  const featuredItem = items[0];
  const remainingItems = items.slice(1);

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-16">
      <PortfolioPreviewBackground />

      <div className="page-shell relative z-10">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Portfolio Preview
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl md:text-5xl">
              Real production-style examples,
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                made easy to understand.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7">
              Preview embroidery digitizing, vector conversion, and patch-ready
              work through a clean proof-first presentation.
            </p>
          </div>

          <Link
            href="/portfolio"
            className="inline-flex min-h-[40px] w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-300 dark:text-slate-950 dark:hover:bg-indigo-200 sm:text-sm"
          >
            View full portfolio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Digitizing", "Vector", "Patches", "Proofs", "Production-ready"].map(
            (label) => (
              <span
                key={label}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-white/50"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                {label}
              </span>
            ),
          )}
        </div>

        {featuredItem && (
          <Card className="group mb-5 overflow-hidden rounded-[1.6rem] border border-indigo-500/20 bg-white/82 shadow-xl shadow-indigo-500/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/15 dark:border-indigo-400/20 dark:bg-white/[0.055] dark:shadow-black/25 sm:rounded-[2rem]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[280px] overflow-hidden p-5 sm:p-6 lg:min-h-[360px]">
                <PortfolioVisual
                  title={featuredItem.title}
                  category={featuredItem.category}
                  accent={featuredItem.accent}
                  large
                />
              </div>

              <div className="relative flex flex-col justify-center border-t border-slate-200 p-5 dark:border-white/10 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-300">
                    Featured
                  </Badge>

                  <Badge className="rounded-full border-slate-200 bg-white/70 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/45">
                    {featuredItem.badge}
                  </Badge>
                </div>

                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                  {featuredItem.category}
                </div>

                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
                  {featuredItem.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                  {featuredItem.note}
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {["Proof", "Clean file", "Ready output"].map((label) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.045] dark:text-white/50"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {remainingItems.map((item, index) => (
            <PortfolioPreviewCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioPreviewCard({
  item,
  index,
}: {
  item: {
    id: string;
    title: string;
    category: string;
    badge: string;
    note: string;
    featured: boolean;
    accent: string;
  };
  index: number;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065] sm:rounded-[1.75rem] lg:rounded-[2rem]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-70 dark:from-white/[0.06]" />

      <CardHeader className="relative z-10 space-y-3 p-5 pb-3 sm:p-6 sm:pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            {item.category}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {item.featured && (
              <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-300">
                Featured
              </Badge>
            )}

            <Badge className="rounded-full border-slate-200 bg-white/70 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/45">
              {item.badge}
            </Badge>
          </div>
        </div>

        <CardTitle className="line-clamp-1 text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
          {item.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
        <PortfolioVisual
          title={item.title}
          category={item.category}
          accent={item.accent}
          index={index}
        />

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-white/55">
          {item.note}
        </p>
      </CardContent>
    </Card>
  );
}

function PortfolioVisual({
  title,
  category,
  accent,
  index = 0,
  large = false,
}: {
  title: string;
  category: string;
  accent: string;
  index?: number;
  large?: boolean;
}) {
  const initials = title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={[
        "relative flex overflow-hidden rounded-[1.25rem] border border-slate-200 bg-gradient-to-br dark:border-white/10 sm:rounded-[1.5rem]",
        accent,
        large ? "min-h-[250px] lg:h-full" : "aspect-[4/3]",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px] opacity-30 dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)]" />

      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-500/15 blur-2xl" />

      <svg
        className="absolute inset-0 h-full w-full opacity-45"
        viewBox="0 0 400 300"
        fill="none"
      >
        <path
          d="M32 210 C90 108 148 252 210 145 C265 52 326 148 374 92"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 10"
          className="text-indigo-500/45 dark:text-indigo-300/35"
        />
        <path
          d="M28 82 C96 32 142 118 202 72 C266 24 304 92 372 52"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 10"
          className="text-violet-500/35 dark:text-violet-300/30"
        />
      </svg>

      <div className="relative z-10 flex w-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-white/45">
            <ImageIcon className="h-3.5 w-3.5" />
            Proof preview
          </div>

          <BadgeIcon className="h-5 w-5 text-indigo-600/55 dark:text-indigo-300/45" />
        </div>

        <div className="mx-auto my-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/45 bg-white/70 text-3xl font-black text-indigo-700 shadow-xl shadow-indigo-500/10 backdrop-blur dark:border-white/10 dark:bg-white/[0.07] dark:text-indigo-300 sm:h-28 sm:w-28">
          {large ? "🧵" : initials || "GX"}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/45 bg-white/55 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.045]">
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                Before
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-300/70 dark:bg-white/15" />
              <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-slate-300/60 dark:bg-white/10" />
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10">
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">
                After
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-indigo-500/45 dark:bg-indigo-300/35" />
              <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-indigo-500/30 dark:bg-indigo-300/20" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/40">
              {category}
            </div>

            <div className="text-[10px] font-black text-slate-400 dark:text-white/30">
              #{String(index + 1).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioPreviewBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
    </div>
  );
}