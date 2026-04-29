"use client";

import * as React from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PortfolioItem = {
  id: string;
  title: string;
  serviceKey: string;
  nicheSlug: string | null;
  description: string | null;
  tags: string[];
  isFeatured: boolean;
  beforeImageKey: string | null;
  afterImageKey: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART: "Vector Art",
  CUSTOM_PATCHES: "Custom Patches",
  VECTOR_REDRAW: "Vector Art",
  COLOR_SEPARATION: "Color Separation",
  DTF_SCREEN_PRINT: "DTF / Screen Print",
};

const NICHE_LABELS: Record<string, string> = {
  "left-chest-logo": "Left Chest",
  "cap-hat-logo": "Cap / Hat",
  "large-design": "Large Design",
  "jacket-back": "Jacket Back",
  "3d-puff": "3D Puff",
  "3d-puff-jacket-back": "3D Puff Jacket Back",
  "sleeve": "Sleeve",
  "full-back": "Full Back",
  "jpg-to-vector": "JPG to Vector",
  "print-ready-artwork": "Print Ready",
  "logo-redraw": "Logo Redraw",
  "color-separation": "Color Separation",
  "embroidered-patches": "Embroidered",
  "chenille-patches": "Chenille",
  "pvc-patches": "PVC",
};

const ACCENTS = [
  "from-indigo-500/10 to-violet-500/5",
  "from-emerald-500/10 to-teal-500/5",
  "from-amber-500/10 to-orange-500/5",
  "from-blue-500/10 to-cyan-500/5",
  "from-rose-500/10 to-pink-500/5",
  "from-purple-500/10 to-fuchsia-500/5",
];

const ALL_SERVICES = Object.entries(SERVICE_LABELS).map(([k, v]) => ({ key: k, label: v }));

function getS3Url(key: string | null) {
  if (!key) return null;
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "";
  const region = process.env.NEXT_PUBLIC_S3_REGION ?? "us-east-1";
  if (!bucket) return null;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

type Props = { items: PortfolioItem[] };

export function PortfolioClient({ items }: Props) {
  const [search, setSearch] = React.useState("");
  const [serviceFilter, setServiceFilter] = React.useState("");
  const [nicheFilter, setNicheFilter] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [beforeAfterItem, setBeforeAfterItem] = React.useState<PortfolioItem | null>(null);

  const availableNiches = React.useMemo(() => {
    const niches = new Set<string>();
    for (const item of items) {
      if (item.nicheSlug) niches.add(item.nicheSlug);
    }
    return Array.from(niches);
  }, [items]);

  const filtered = React.useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          (item.nicheSlug && NICHE_LABELS[item.nicheSlug]?.toLowerCase().includes(q))
      );
    }
    if (serviceFilter) result = result.filter((item) => item.serviceKey === serviceFilter);
    if (nicheFilter) result = result.filter((item) => item.nicheSlug === nicheFilter);
    return result;
  }, [items, search, serviceFilter, nicheFilter]);

  const hasFilters = search || serviceFilter || nicheFilter;

  function clearFilters() {
    setSearch("");
    setServiceFilter("");
    setNicheFilter("");
  }

  return (
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell">

        {/* Search & filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search portfolio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm transition ${showFilters ? "border-ring bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {[serviceFilter, nicheFilter].filter(Boolean).length + (search ? 1 : 0)}
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm text-muted-foreground transition hover:text-destructive hover:border-destructive/40"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mb-6 flex flex-wrap gap-3 rounded-[1.75rem] border border-border bg-card/50 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="">All services</option>
                {ALL_SERVICES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            {availableNiches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Niche:</span>
                <select
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  <option value="">All niches</option>
                  {availableNiches.map((n) => (
                    <option key={n} value={n}>{NICHE_LABELS[n] ?? n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        {hasFilters && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filtered.length} of {items.length} portfolio items
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">No matching portfolio items</p>
            <p className="mt-2 text-sm">Try different search terms or clear the filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item, i) => {
              const afterUrl = getS3Url(item.afterImageKey);
              const beforeUrl = getS3Url(item.beforeImageKey);
              const hasImages = !!(afterUrl || beforeUrl);

              return (
                <Card
                  key={item.id}
                  className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80 cursor-pointer"
                  onClick={() => {
                    if (hasImages) setBeforeAfterItem(item);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="section-eyebrow text-[10px]">
                        {SERVICE_LABELS[item.serviceKey] ?? item.serviceKey}
                        {item.nicheSlug && NICHE_LABELS[item.nicheSlug] && (
                          <span className="ml-1 opacity-60">· {NICHE_LABELS[item.nicheSlug]}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.isFeatured && (
                          <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 text-xs text-amber-400">
                            Featured
                          </Badge>
                        )}
                        {item.tags[0] && (
                          <Badge className="rounded-full border-border/80 bg-secondary text-xs text-muted-foreground">
                            {item.tags[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {afterUrl ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-border/60 bg-card">
                        <Image
                          src={afterUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {beforeUrl && (
                          <div className="absolute bottom-2 right-2 rounded-xl border border-white/20 bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                            Before & After ▶
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]} border border-border/60 flex items-center justify-center`}>
                        <span className="text-3xl opacity-30">🧵</span>
                      </div>
                    )}
                    {item.description && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags.length > 1 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.slice(1, 4).map((tag) => (
                          <Badge key={tag} className="rounded-full border-border/50 bg-secondary/60 text-[10px] text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Before / After modal */}
        {beforeAfterItem && (
          <BeforeAfterModal item={beforeAfterItem} onClose={() => setBeforeAfterItem(null)} />
        )}
      </div>
    </section>
  );
}

function BeforeAfterModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const beforeUrl = getS3Url(item.beforeImageKey);
  const afterUrl = getS3Url(item.afterImageKey);
  const [showBefore, setShowBefore] = React.useState(false);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0a0f1e] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            {SERVICE_LABELS[item.serviceKey] ?? item.serviceKey}
          </div>
          <h3 className="mt-1 text-xl font-bold text-white">{item.title}</h3>
        </div>

        {(beforeUrl || afterUrl) && (
          <div>
            {beforeUrl && afterUrl && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setShowBefore(false)}
                  className={`flex-1 rounded-2xl border py-2 text-sm font-medium transition ${!showBefore ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/5 text-white"}`}
                >
                  After
                </button>
                <button
                  onClick={() => setShowBefore(true)}
                  className={`flex-1 rounded-2xl border py-2 text-sm font-medium transition ${showBefore ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/5 text-white"}`}
                >
                  Before
                </button>
              </div>
            )}

            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
              {(showBefore ? beforeUrl : afterUrl) && (
                <Image
                  src={(showBefore ? beforeUrl : afterUrl)!}
                  alt={showBefore ? "Before" : "After"}
                  fill
                  className="object-contain"
                  sizes="672px"
                />
              )}
            </div>
          </div>
        )}

        {item.description && (
          <p className="mt-4 text-sm text-white/60 leading-6">{item.description}</p>
        )}
      </div>
    </div>
  );
}
