"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Zap, RefreshCw, FileText, Shirt, PenTool } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { fetchPortfolio } from "@/components/portfolio/data";
import type { PortfolioItem } from "@/components/portfolio/data";

/* ── Service definitions (no pricing displayed) ──────────── */
const SERVICES = [
  {
    slug: "digitizing",
    emoji: "🧵",
    title: "Embroidery Digitizing",
    subtitle: "Stitch-Perfect Files for Every Machine",
    description:
      "Professional digitizing for caps, left chest, jacket backs, and 3D puff. Any artwork — logos, sketches, illustrations — converted into clean, machine-ready stitch files.",
    features: [
      "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — all formats",
      "Precision stitch paths, density & underlay",
      "3D puff with structural underlay",
      "Cap digitizing with curve compensation",
      "Small text optimization at any size",
      "Free unlimited revisions",
      "Rush 6h / Urgent 3h — always free",
    ],
    color: "#2563EB",
    grad: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    icon: Shirt,
  },
  {
    slug: "vector",
    emoji: "✏️",
    title: "Vector Redraw",
    subtitle: "Crisp, Scalable Vector Art from Any Source",
    description:
      "Low-res JPGs, hand sketches, and old artwork converted into clean vector files. Perfect for screen printing, DTF, heat transfer, and large-format production.",
    features: [
      "AI, SVG, EPS, PDF, CDR — all formats",
      "Manual redraw by experienced artists",
      "Logo recreation from photos or scans",
      "Gradients, shading & complex illustrations",
      "Typography cleanup & font matching",
      "Print-ready with color separations",
      "Free revisions & format conversions",
    ],
    color: "#F97316",
    grad: "linear-gradient(135deg, #F97316, #EA580C)",
    icon: PenTool,
  },
  {
    slug: "patches",
    emoji: "🏷️",
    title: "Patch Design",
    subtitle: "Custom Embroidered Patches for Brands & Teams",
    description:
      "Fine-detail embroidered patches with vibrant thread colors. Merit badges, tactical, name, and club patches — professional finish, durable construction. 500+ patches up to 50% off.",
    features: [
      "Merit, tactical, PVC, name & club patches",
      "Vibrant thread color matching",
      "Iron-on, sew-on & Velcro backing",
      "High-density fine detail work",
      "500+ patches — save up to 50%",
      "Bulk order discounts available",
      "Digital preview before production",
      "Free revisions & fast turnaround",
    ],
    color: "#16A34A",
    grad: "linear-gradient(135deg, #16A34A, #15803D)",
    icon: FileText,
  },
];

/* ── Portfolio thumbnail for service sections ────────────── */
function PortfolioThumb({ item }: { item: PortfolioItem }) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1);
  const firstImage = thumbnail || item.images?.[0];

  return (
    <Link href="/portfolio" className="group block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--elevated)] border border-[var(--border)] group-hover:border-[var(--border3)] transition-all duration-200">
        {firstImage && !imgError ? (
          <img
            src={firstImage.url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
            {item.category?.emoji || "✦"}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
          <p className="text-white text-[10px] sm:text-xs font-semibold truncate">{item.title}</p>
          <p className="text-white/60 text-[9px] sm:text-[10px]">
            {item.stitches ? `${(item.stitches / 1000).toFixed(1)}k stitches` : item.colors ? `${item.colors} colors` : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}

interface ServiceTier {
  id: string;
  category: string;
  label: string;
  size_desc: string;
  price: number;
  est_hours: string;
  is_big_design: boolean;
  is_active: boolean;
  sort_order: number;
}

/* ── Main Services Content ───────────────────────────────── */
export function ServicesContent({ tiers }: { tiers: ServiceTier[] }) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // Compute starting price per category
  const priceMap: Record<string, number> = {};
  for (const t of tiers) {
    if (!priceMap[t.category] || t.price < priceMap[t.category]) {
      priceMap[t.category] = t.price;
    }
  }

  useEffect(() => {
    fetchPortfolio()
      .then((data) => setPortfolioItems(data.items))
      .catch(() => {});
  }, []);

  const categorySlugs = ["digitizing", "vector", "patches"];
  const portfoliosByCategory: Record<string, PortfolioItem[]> = {};
  for (const slug of categorySlugs) {
    portfoliosByCategory[slug] = portfolioItems
      .filter((item) => item.category?.slug === slug)
      .slice(0, 5);
  }

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative text-center pt-12 sm:pt-16 md:pt-20 pb-4 sm:pb-6 px-4 sm:px-6">
        <GradientOrb color="#2563EB" size={400} className="top-[-120px] left-1/2 -translate-x-1/2 opacity-20" />
        <GradientOrb color="#F97316" size={280} className="top-[10%] right-[5%] opacity-10" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
            bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4"
        >
          Our Services
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-syne font-bold text-[clamp(32px,7vw,64px)] leading-[1.08] mb-4 sm:mb-5"
        >
          Premium Embroidery
          <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Production Services
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-[var(--txt2)] max-w-2xl mx-auto leading-relaxed"
        >
          Professional digitizing, vector redraws, and custom patch design — built for serious embroidery businesses.
        </motion.p>
      </section>

      {/* ── BROWSE BY SERVICE ──────────────────────────── */}
      <section className="pt-6 sm:pt-8 pb-8 sm:pb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="font-syne font-bold text-xl sm:text-2xl md:text-3xl mb-2">Browse Services by Category</h2>
              <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">Specialized digitizing for every garment type, material, and application.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {[
                { emoji: "🧵", label: "Embroidery Digitizing", href: "/services/embroidery-digitizing", color: "#2563EB" },
                { emoji: "🧢", label: "Cap Digitizing", href: "/services/cap-digitizing", color: "#F97316" },
                { emoji: "👕", label: "Left Chest", href: "/services/left-chest-digitizing", color: "#06B6D4" },
                { emoji: "🧥", label: "Jacket Back", href: "/services/jacket-back-digitizing", color: "#DC2626" },
                { emoji: "🎩", label: "3D Puff", href: "/services/3d-puff-digitizing", color: "#7C3AED" },
                { emoji: "✨", label: "Logo Digitizing", href: "/services/logo-digitizing", color: "#2563EB" },
                { emoji: "✏️", label: "Vector Conversion", href: "/services/vector-art-conversion", color: "#F97316" },
                { emoji: "🏷️", label: "Custom Patches", href: "/services/custom-patches", color: "#16A34A" },
                { emoji: "🧣", label: "Beanies", href: "/services/beanies-digitizing", color: "#DC2626" },
                { emoji: "🪣", label: "Towels", href: "/services/towels-digitizing", color: "#06B6D4" },
                { emoji: "🎒", label: "Bags", href: "/services/bags-digitizing", color: "#8B5CF6" },
                { emoji: "👔", label: "Uniforms", href: "/services/uniforms-digitizing", color: "#2563EB" },
                { emoji: "⚽", label: "Sportswear", href: "/services/sportswear-digitizing", color: "#F97316" },
                { emoji: "🏢", label: "Corporate Apparel", href: "/services/corporate-apparel-digitizing", color: "#1E3A5F" },
              ].map((svc) => (
                <Link
                  key={svc.href}
                  href={svc.href}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border3)] hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl" style={{ background: `${svc.color}12`, border: `2px solid ${svc.color}25` }}>
                    {svc.emoji}
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[var(--txt)] text-center leading-tight group-hover:text-[var(--txt)]">{svc.label}</span>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── SERVICE SECTIONS (alternating layout) ──────────── */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12 pb-16 sm:pb-20 md:pb-24 space-y-16 sm:space-y-20 md:space-y-24">
        {SERVICES.map((svc, i) => {
          const isReversed = i % 2 === 1;
          const IconComp = svc.icon;
          const portfolioForService = portfoliosByCategory[svc.slug] || [];

          return (
            <AnimatedSection key={svc.slug} className="!py-0">
              <div className="space-y-8 sm:space-y-10 md:space-y-12">
                {/* ── Service Detail Row ──────────────────────── */}
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center ${
                    isReversed ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Content side */}
                  <div className={`text-center sm:text-left ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                    {/* Icon badge */}
                    <div
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-5 mx-auto sm:mx-0"
                      style={{
                        background: `${svc.color}12`,
                        border: `2px solid ${svc.color}25`,
                      }}
                    >
                      {svc.emoji}
                    </div>

                    <h2
                      className="font-syne font-bold text-xl sm:text-3xl md:text-4xl mb-1.5 sm:mb-2 leading-[1.15]"
                      style={{ color: svc.color }}
                    >
                      {svc.title}
                    </h2>

                    <p className="text-sm sm:text-lg text-[var(--txt2)] mb-2 sm:mb-3 font-medium">
                      {svc.subtitle}
                    </p>

                    <p className="text-sm text-[var(--txt2)] leading-relaxed mb-6 sm:mb-8">
                      {svc.description}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                      {svc.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--txt2)] justify-center sm:justify-start">
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                            style={{ background: `${svc.color}15`, color: svc.color }}
                          >
                            <Check size={12} />
                          </span>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* DB price hint */}
                    {priceMap[svc.slug] && (
                      <p className="text-sm text-[var(--txt2)] mb-4">
                        Starting from <strong className="text-[var(--txt)]">${priceMap[svc.slug]}</strong>
                      </p>
                    )}

                    {/* CTA buttons */}
                    <div className="flex flex-nowrap gap-2 sm:gap-3 justify-center sm:justify-start">
                      <Link href="/pricing">
                        <Button variant="grad" size="md" className="lg:size-lg" rightIcon={<ArrowRight size={15} />}>
                          View Pricing
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button variant="ghost" size="md" className="lg:size-lg">
                          Get Pricing Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Artwork/Image side */}
                  <div className={`hidden sm:block ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center bg-[var(--elevated)] border border-[var(--border)]">
                      {portfolioForService[0]?.images?.[0] ? (
                        <img
                          src={portfolioForService[0].images[0].url}
                          alt={svc.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto"
                            style={{
                              background: `linear-gradient(135deg, ${svc.color}, ${svc.color}CC)`,
                              boxShadow: `0 12px 32px ${svc.color}30`,
                            }}
                          >
                            {svc.emoji}
                          </div>
                          <p className="text-sm text-[var(--txt3)] mt-4">Sample coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Portfolio Preview for this Service ────────── */}
                {portfolioForService.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <div>
                        <h3 className="font-syne font-bold text-base sm:text-xl text-[var(--txt)]">
                          Recent {svc.title} Work
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--txt3)] mt-0.5 sm:mt-1">
                          Real projects from our portfolio
                        </p>
                      </div>
                      <Link href="/portfolio" className="flex-shrink-0 ml-2">
                        <Button variant="ghost2" size="sm" className="text-xs" rightIcon={<ArrowRight size={12} />}>
                          View All
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                      {portfolioForService.map((item) => (
                        <PortfolioThumb key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between services */}
                {i < SERVICES.length - 1 && (
                  <div className="border-t border-[var(--border)]" />
                )}
              </div>
            </AnimatedSection>
          );
        })}
      </div>

      {/* ── ALWAYS FREE (Green Box) ────────────────────────── */}
      <section className="py-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative bg-gradient-to-br from-[#16A34A] via-[#15803D] to-[#14532D] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden">
            <div className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] rounded-full bg-[#4ADE80] opacity-[0.10] blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs
                  font-semibold uppercase tracking-wider mb-4
                  bg-white/15 text-white border border-white/20">
                  Always Included
                </span>
                <h2 className="font-syne font-bold text-2xl md:text-4xl text-white mb-2">
                  Free With Every Order
                </h2>
                <p className="text-white/70 text-sm max-w-md mx-auto">
                  No hidden fees. No surprises. Everything below comes standard.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {[
                  ["🔄", "Format Conversion", "Always FREE"],
                  ["♾️", "Unlimited Revisions", "Always FREE"],
                  ["⚡", "Rush 6h Delivery", "Always FREE"],
                  ["🔥", "Urgent 3h Delivery", "Always FREE"],
                ].map(([emoji, label, status], i) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center bg-white rounded-2xl p-5 md:p-6 shadow-lg
                      hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4ADE80] to-[#16A34A]" />
                    <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border-2 border-[#16A34A]/20 flex items-center justify-center text-2xl mb-4">
                      {emoji}
                    </div>
                    <div className="text-sm font-bold text-[var(--txt)] mb-1">{label}</div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section className="py-16 sm:py-18 md:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 sm:p-12 md:p-16 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)] backdrop-blur-xl">
            <GradientOrb color="#2563EB" size={260} className="-top-24 left-1/2 -translate-x-1/2 opacity-20" />

            <div className="relative z-10">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-4">
                Ready to Start Your Project?
              </h2>
              <p className="text-base sm:text-lg text-[var(--txt2)] max-w-2xl mx-auto mb-6 sm:mb-8">
                Professional embroidery services with free revisions, fast delivery, and all formats included.
              </p>
              <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
                <Link href="/pricing">
                  <Button variant="grad" size="md" className="lg:size-lg" rightIcon={<ArrowRight size={15} />}>
                    View Pricing
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" size="md" className="lg:size-lg">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
