"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/asset-url";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Look-up tables ────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART:            "Vector Art",
  CUSTOM_PATCHES:        "Custom Patches",
  VECTOR_REDRAW:         "Vector Art",
  COLOR_SEPARATION:      "Color Separation",
  DTF_SCREEN_PRINT:      "DTF / Screen Print",
};

const SERVICE_ACCENTS: Record<string, { badge: string; grad: string }> = {
  EMBROIDERY_DIGITIZING: {
    badge: "border-indigo-400/30 bg-indigo-400/[0.12] text-indigo-300",
    grad:  "from-indigo-950 via-indigo-900/60 to-[#060d1a]",
  },
  VECTOR_ART: {
    badge: "border-violet-400/30 bg-violet-400/[0.12] text-violet-300",
    grad:  "from-violet-950 via-violet-900/60 to-[#060d1a]",
  },
  VECTOR_REDRAW: {
    badge: "border-violet-400/30 bg-violet-400/[0.12] text-violet-300",
    grad:  "from-violet-950 via-violet-900/60 to-[#060d1a]",
  },
  CUSTOM_PATCHES: {
    badge: "border-amber-400/30 bg-amber-400/[0.12] text-amber-300",
    grad:  "from-amber-950 via-amber-900/50 to-[#060d1a]",
  },
  COLOR_SEPARATION: {
    badge: "border-emerald-400/30 bg-emerald-400/[0.12] text-emerald-300",
    grad:  "from-emerald-950 via-emerald-900/50 to-[#060d1a]",
  },
  DTF_SCREEN_PRINT: {
    badge: "border-blue-400/30 bg-blue-400/[0.12] text-blue-300",
    grad:  "from-blue-950 via-blue-900/50 to-[#060d1a]",
  },
};

const DEFAULT_ACCENT = {
  badge: "border-white/15 bg-white/[0.07] text-white/55",
  grad:  "from-slate-900 via-slate-900/60 to-[#060d1a]",
};

const MACHINE_FEATURES = [
  { icon: "🧵", title: "15-Head Machines",    desc: "Commercial embroidery machines running 24/7." },
  { icon: "🎯", title: "Proof-First Workflow", desc: "Production proof before the first stitch." },
  { icon: "⚡", title: "24 hr Turnaround",    desc: "Rush and same-day options available." },
  { icon: "🔁", title: "Free Revisions",      desc: "Included until you're fully satisfied." },
];

const PLACEHOLDER_ITEMS: ShowcaseItem[] = [
  { id:"ph1", title:"Left Chest Logo",         serviceKey:"EMBROIDERY_DIGITIZING", nicheSlug:"left-chest-logo",     description:"Clean satin-stitch left chest for apparel",  tags:["Left Chest","Logo"],       afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph2", title:"Jacket Back Hero Print",  serviceKey:"EMBROIDERY_DIGITIZING", nicheSlug:"jacket-back",         description:"Large multi-colour jacket back design",       tags:["Jacket Back","Large"],     afterImageKey:null, beforeImageKey:null, isFeatured:true  },
  { id:"ph3", title:"Logo Vector Redraw",      serviceKey:"VECTOR_ART",            nicheSlug:"jpg-to-vector",       description:"Print-ready vector from raster artwork",      tags:["Vector","DTF"],            afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph4", title:"3D Puff Cap Logo",        serviceKey:"EMBROIDERY_DIGITIZING", nicheSlug:"3d-puff",             description:"Foam-backed 3D puff for cap front",           tags:["3D Puff","Cap"],           afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph5", title:"Embroidered Badge Patch", serviceKey:"CUSTOM_PATCHES",        nicheSlug:"embroidered-patches", description:"Merrowed border badge patch",                 tags:["Patch","Embroidered"],     afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph6", title:"Full Back Jacket Design", serviceKey:"EMBROIDERY_DIGITIZING", nicheSlug:"full-back",           description:"Detailed full back with gradient fill",       tags:["Full Back","Multi-Color"], afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph7", title:"Hat Crown Embroidery",    serviceKey:"EMBROIDERY_DIGITIZING", nicheSlug:"cap-hat-logo",        description:"Structured crown embroidery for caps",        tags:["Cap","Crown"],             afterImageKey:null, beforeImageKey:null, isFeatured:false },
  { id:"ph8", title:"DTF Print-Ready Art",     serviceKey:"VECTOR_ART",            nicheSlug:"print-ready-artwork", description:"DTF / screen-print ready vector file",        tags:["DTF","Print"],             afterImageKey:null, beforeImageKey:null, isFeatured:false },
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

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductionShowcaseClient({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = React.useState("ALL");

  const pool = React.useMemo(
    () => (items.length > 0 ? items : PLACEHOLDER_ITEMS),
    [items],
  );

  const displayItems = React.useMemo(
    () => active === "ALL" ? pool : pool.filter(it => canonicalKey(it.serviceKey) === active),
    [pool, active],
  );

  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; label: string }[] = [{ key: "ALL", label: "All" }];
    for (const it of pool) {
      const k = canonicalKey(it.serviceKey);
      if (!seen.has(k)) { seen.add(k); list.push({ key: k, label: SERVICE_LABELS[k] ?? k }); }
    }
    return list;
  }, [pool]);

  return (
    <section className="relative py-16 md:py-20">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_55%_at_15%_50%,rgba(99,102,241,0.12),transparent_58%),radial-gradient(ellipse_44%_38%_at_85%_22%,rgba(139,92,246,0.09),transparent_55%),radial-gradient(ellipse_36%_52%_at_55%_92%,rgba(59,130,246,0.06),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_78%_78%_at_50%_50%,black_25%,transparent_72%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="section-eyebrow">Our Work</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Production You Can See
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="btn-outline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActive(cat.key)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200",
                  active === cat.key
                    ? "border-indigo-500/40 bg-indigo-500/[0.15] text-indigo-300"
                    : "border-white/[0.09] bg-white/[0.04] text-white/40 hover:border-white/20 hover:text-white/65",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayItems.map(item => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {MACHINE_FEATURES.map(f => (
            <div
              key={f.title}
              className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 backdrop-blur-sm"
            >
              <span className="text-sm">{f.icon}</span>
              <span className="text-[11px] font-semibold text-white/60">{f.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const afterUrl  = getS3Url(item.afterImageKey);
  const beforeUrl = getS3Url(item.beforeImageKey);
  const hasBoth   = Boolean(afterUrl && beforeUrl);
  const key       = canonicalKey(item.serviceKey);
  const accent    = SERVICE_ACCENTS[key] ?? DEFAULT_ACCENT;
  const label     = SERVICE_LABELS[item.serviceKey] ?? item.serviceKey;

  return (
    <div className="group relative">
      {item.isFeatured && (
        <div className="absolute inset-0 scale-105 rounded-[2.25rem] bg-gradient-to-br from-indigo-500/30 to-violet-500/20 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      )}

      <div className="relative h-[320px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:border-white/[0.18] group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.65)]">
        {afterUrl ? (
          <>
            <Image
              src={afterUrl}
              alt={item.title}
              fill
              draggable={false}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {beforeUrl && (
              <div className="absolute inset-0 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:inset(0_50%_0_0)]">
                <Image
                  src={beforeUrl}
                  alt={`Before: ${item.title}`}
                  fill
                  draggable={false}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
            )}
            {hasBoth && (
              <div className="absolute inset-y-0 left-1/2 z-[2] w-px -translate-x-1/2 bg-white/75 opacity-0 shadow-[0_0_14px_rgba(255,255,255,0.65)] transition-opacity duration-300 group-hover:opacity-100" />
            )}
            {hasBoth && (
              <>
                <span className="absolute left-4 top-[45%] z-[3] -translate-y-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">Before</span>
                <span className="absolute right-4 top-[45%] z-[3] -translate-y-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">After</span>
              </>
            )}
          </>
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", accent.grad)}>
            <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl opacity-[0.055]">✦</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute left-4 right-4 top-4 z-[3] flex items-start justify-between gap-2">
          {item.isFeatured
            ? <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.15] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300 backdrop-blur-sm">Featured</span>
            : <span />
          }
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm", accent.badge)}>{label}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-[3] translate-y-1 p-5 transition-transform duration-300 ease-out group-hover:translate-y-0">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-white">{item.title}</h3>
          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-white/50 opacity-0 transition-opacity duration-300 delay-75 group-hover:opacity-100">{item.description}</p>
          )}
          {item.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[10px] text-white/55 backdrop-blur-sm">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
