"use client";

import * as React from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl } from "@/lib/asset-url";

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
  sleeve: "Sleeve",
  "full-back": "Full Back",
  "jpg-to-vector": "JPG to Vector",
  "print-ready-artwork": "Print Ready",
  "logo-redraw": "Logo Redraw",
  "color-separation": "Color Separation",
  "embroidered-patches": "Embroidered",
  "chenille-patches": "Chenille",
  "pvc-patches": "PVC",
};

const PLACEHOLDER_ITEMS: PortfolioItem[] = [
  {
    id: "ph1",
    title: "Left Chest Logo",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "left-chest-logo",
    description:
      "Clean satin-stitch left chest for corporate apparel and uniforms.",
    tags: ["Left Chest", "Logo"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph2",
    title: "Jacket Back Hero Print",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "jacket-back",
    description:
      "Large multi-colour jacket back with density mapping for fleece and twill.",
    tags: ["Jacket Back", "Large"],
    isFeatured: true,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph3",
    title: "Logo Vector Redraw",
    serviceKey: "VECTOR_ART",
    nicheSlug: "jpg-to-vector",
    description: "Print-ready vector rebuilt from low-resolution raster artwork.",
    tags: ["Vector", "DTF"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph4",
    title: "3D Puff Cap Logo",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "3d-puff",
    description: "Foam-backed 3D puff digitizing for cap front placement.",
    tags: ["3D Puff", "Cap"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph5",
    title: "Embroidered Badge Patch",
    serviceKey: "CUSTOM_PATCHES",
    nicheSlug: "embroidered-patches",
    description:
      "Merrowed border badge patch with sew-on backing and full coverage fill.",
    tags: ["Patch", "Embroidered"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph6",
    title: "Full Back Jacket Design",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "full-back",
    description:
      "Detailed full back embroidery with multi-colour fill and gradient blending.",
    tags: ["Full Back", "Multi-Color"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph7",
    title: "Hat Crown Embroidery",
    serviceKey: "EMBROIDERY_DIGITIZING",
    nicheSlug: "cap-hat-logo",
    description: "Structured crown embroidery for fitted and snapback caps.",
    tags: ["Cap", "Crown"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
  {
    id: "ph8",
    title: "DTF Print-Ready Art",
    serviceKey: "VECTOR_ART",
    nicheSlug: "print-ready-artwork",
    description:
      "DTF and screen-print ready vector file with spot-colour separation.",
    tags: ["DTF", "Print"],
    isFeatured: false,
    beforeImageKey: null,
    afterImageKey: null,
  },
];

const ACCENTS = [
  "from-indigo-500/10 to-violet-500/5",
  "from-emerald-500/10 to-teal-500/5",
  "from-amber-500/10 to-orange-500/5",
  "from-blue-500/10 to-cyan-500/5",
  "from-rose-500/10 to-pink-500/5",
  "from-purple-500/10 to-fuchsia-500/5",
];

const ALL_SERVICES = Object.entries(SERVICE_LABELS).map(([key, label]) => ({
  key,
  label,
}));

function getS3Url(key: string | null) {
  if (!key) return null;

  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return null;

  return assetUrl(key);
}

type Props = {
  items: PortfolioItem[];
};

export function PortfolioClient({ items }: Props) {
  const pool = items.length > 0 ? items : PLACEHOLDER_ITEMS;

  const [search, setSearch] = React.useState("");
  const [serviceFilter, setServiceFilter] = React.useState("");
  const [nicheFilter, setNicheFilter] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [beforeAfterItem, setBeforeAfterItem] =
    React.useState<PortfolioItem | null>(null);

  const availableNiches = React.useMemo(() => {
    const niches = new Set<string>();

    for (const item of pool) {
      if (item.nicheSlug) {
        niches.add(item.nicheSlug);
      }
    }

    return Array.from(niches);
  }, [pool]);

  const filtered = React.useMemo(() => {
    let result = pool;

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter((item) => {
        const service = SERVICE_LABELS[item.serviceKey] ?? item.serviceKey;
        const niche = item.nicheSlug ? NICHE_LABELS[item.nicheSlug] : "";

        return (
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          service.toLowerCase().includes(q) ||
          niche?.toLowerCase().includes(q)
        );
      });
    }

    if (serviceFilter) {
      result = result.filter((item) => item.serviceKey === serviceFilter);
    }

    if (nicheFilter) {
      result = result.filter((item) => item.nicheSlug === nicheFilter);
    }

    return result;
  }, [pool, search, serviceFilter, nicheFilter]);

  const hasFilters = Boolean(search || serviceFilter || nicheFilter);

  function clearFilters() {
    setSearch("");
    setServiceFilter("");
    setNicheFilter("");
  }

  return (
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10">
        <div className="mb-6 grid gap-3 md:mb-8 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/60" />

            <input
              type="text"
              placeholder="Search by title, service, tag, or description..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-11 text-sm text-slate-950 shadow-sm outline-none backdrop-blur transition placeholder:text-slate-400 focus:border-indigo-500/35 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/60 dark:focus:border-white/20 dark:focus:bg-white/[0.08] dark:focus:ring-white/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-white/60 dark:hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={[
              "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold shadow-sm backdrop-blur transition md:h-12",
              showFilters
                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200"
                : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/55 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white",
            ].join(" ")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white dark:bg-indigo-300 dark:text-slate-950">
                {[serviceFilter, nicheFilter].filter(Boolean).length +
                  (search ? 1 : 0)}
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-bold text-slate-500 shadow-sm backdrop-blur transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/70 dark:hover:border-red-400/30 dark:hover:bg-red-400/10 dark:hover:text-red-300 md:h-12"
            >
              <X className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] sm:grid-cols-2 md:rounded-[1.75rem]">
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-white/65">
                Service
              </span>

              <select
                aria-label="Filter by service"
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500/35 focus:ring-2 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-[#0b1120] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
              >
                <option value="">All services</option>
                {ALL_SERVICES.map((service) => (
                  <option key={service.key} value={service.key}>
                    {service.label}
                  </option>
                ))}
              </select>
            </label>

            {availableNiches.length > 0 && (
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-white/65">
                  Niche
                </span>

                <select
                  aria-label="Filter by niche"
                  value={nicheFilter}
                  onChange={(event) => setNicheFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500/35 focus:ring-2 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-[#0b1120] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                >
                  <option value="">All niches</option>
                  {availableNiches.map((niche) => (
                    <option key={niche} value={niche}>
                      {NICHE_LABELS[niche] ?? niche}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {hasFilters && (
          <div className="mb-4 text-sm font-medium text-slate-500 dark:text-white/65">
            Showing {filtered.length} of {pool.length} portfolio items
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 py-16 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-lg font-black text-slate-950 dark:text-white">
              No matching portfolio items
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/70">
              Try different search terms or clear the filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {filtered.map((item, index) => {
              const afterUrl = getS3Url(item.afterImageKey);
              const beforeUrl = getS3Url(item.beforeImageKey);
              const hasImages = Boolean(afterUrl || beforeUrl);

              return (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  index={index}
                  afterUrl={afterUrl}
                  beforeUrl={beforeUrl}
                  hasImages={hasImages}
                  onOpen={() => {
                    if (hasImages) {
                      setBeforeAfterItem(item);
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        {beforeAfterItem && (
          <BeforeAfterModal
            item={beforeAfterItem}
            onClose={() => setBeforeAfterItem(null)}
          />
        )}
      </div>
    </section>
  );
}

function PortfolioCard({
  item,
  index,
  afterUrl,
  beforeUrl,
  hasImages,
  onOpen,
}: {
  item: PortfolioItem;
  index: number;
  afterUrl: string | null;
  beforeUrl: string | null;
  hasImages: boolean;
  onOpen: () => void;
}) {
  return (
    <Card
      className={[
        "group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem]",
        hasImages
          ? "cursor-pointer hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065] dark:hover:shadow-black/30"
          : "",
      ].join(" ")}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      tabIndex={hasImages ? 0 : undefined}
      role={hasImages ? "button" : undefined}
      aria-label={hasImages ? `View ${item.title}` : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

      <CardHeader className="relative z-10 space-y-3 p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            {SERVICE_LABELS[item.serviceKey] ?? item.serviceKey}
            {item.nicheSlug && NICHE_LABELS[item.nicheSlug] && (
              <span className="ml-1 text-slate-400 dark:text-white/60">
                · {NICHE_LABELS[item.nicheSlug]}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {item.isFeatured && (
              <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-300">
                Featured
              </Badge>
            )}

            {item.tags[0] && (
              <Badge className="rounded-full border-slate-200 bg-white/70 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/70">
                {item.tags[0]}
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="line-clamp-1 text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
          {item.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 px-4 pb-4 sm:px-5 sm:pb-5">
        {afterUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950 sm:rounded-[1.5rem]">
            <Image
              src={afterUrl}
              alt={item.title}
              fill
              loading={index < 3 ? "eager" : "lazy"}
              priority={index < 3}
              className="object-cover transition-transform duration-500 ease-out md:group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {beforeUrl && (
              <div className="absolute bottom-2 right-2 rounded-xl border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur">
                Before &amp; After
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex aspect-[4/3] items-center justify-center rounded-[1.25rem] border border-slate-200 bg-gradient-to-br ${
              ACCENTS[index % ACCENTS.length]
            } dark:border-white/10 sm:rounded-[1.5rem]`}
          >
            <span className="text-3xl opacity-30">🧵</span>
          </div>
        )}

        {item.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-white/55">
            {item.description}
          </p>
        )}

        {item.tags.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(1, 4).map((tag) => (
              <Badge
                key={tag}
                className="rounded-full border-slate-200 bg-white/70 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/70"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BeforeAfterModal({
  item,
  onClose,
}: {
  item: PortfolioItem;
  onClose: () => void;
}) {
  const beforeUrl = getS3Url(item.beforeImageKey);
  const afterUrl = getS3Url(item.afterImageKey);
  const [showBefore, setShowBefore] = React.useState(false);

  React.useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const activeUrl = showBefore ? beforeUrl : afterUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0f1e] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.7)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 pr-12">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
            {SERVICE_LABELS[item.serviceKey] ?? item.serviceKey}
          </div>

          <h3 className="mt-1 text-lg font-black text-white sm:text-xl">
            {item.title}
          </h3>
        </div>

        {(beforeUrl || afterUrl) && (
          <div>
            {beforeUrl && afterUrl && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowBefore(false)}
                  className={[
                    "rounded-2xl border py-2 text-sm font-bold transition",
                    !showBefore
                      ? "border-white/20 bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  After
                </button>

                <button
                  type="button"
                  onClick={() => setShowBefore(true)}
                  className={[
                    "rounded-2xl border py-2 text-sm font-bold transition",
                    showBefore
                      ? "border-white/20 bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  Before
                </button>
              </div>
            )}

            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              {activeUrl && (
                <Image
                  src={activeUrl}
                  alt={showBefore ? "Before" : "After"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 92vw, 768px"
                />
              )}
            </div>
          </div>
        )}

        {item.description && (
          <p className="mt-4 text-sm leading-6 text-white/60">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}