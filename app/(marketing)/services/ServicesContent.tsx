"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  RefreshCw,
  FileText,
  Shirt,
  PenTool,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { fetchPortfolio } from "@/components/portfolio/data";
import type { PortfolioItem } from "@/components/portfolio/data";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import Image from "next/image";

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
      "Fine-detail embroidered patches with vibrant thread colors. Merit badges, tactical, name, and club patches — professional finish, durable construction.",
    features: [
      "Merit, tactical, PVC, name & club patches",
      "Vibrant thread color matching",
      "Iron-on, sew-on & Velcro backing",
      "High-density fine detail work",
      "Bulk discounts from 20%",
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
function PortfolioThumb({ item, onClick }: { item: PortfolioItem; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1);
  const firstImage = thumbnail || item.images?.[0];

  return (
    <button
      onClick={onClick}
      className="group block w-full cursor-pointer border-none bg-transparent p-0 text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--elevated)] transition-all duration-200 group-hover:border-[var(--border3)]">
        {firstImage && !imgError ? (
          <Image
            src={firstImage.url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">
            {item.category?.emoji || "✦"}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
          <p className="truncate text-[10px] font-semibold text-white sm:text-xs">{item.title}</p>
          <p className="text-[9px] text-white/60 sm:text-[10px]">
            {item.stitches
              ? `${(item.stitches / 1000).toFixed(1)}k stitches`
              : item.colors
                ? `${item.colors} colors`
                : "—"}
          </p>
        </div>
      </div>
    </button>
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
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

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
    <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative px-4 pb-4 pt-12 text-center sm:px-6 sm:pb-6 sm:pt-16 md:pt-20">
        <GradientOrb
          color="#2563EB"
          size={400}
          className="left-1/2 top-[-120px] -translate-x-1/2 opacity-20"
        />
        <GradientOrb color="#F97316" size={280} className="right-[5%] top-[10%] opacity-10" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]"
        >
          Our Services
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 font-syne text-[clamp(32px,7vw,64px)] font-bold leading-[1.08] sm:mb-5"
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
          className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--txt2)] sm:text-lg"
        >
          Professional digitizing, vector redraws, and custom patch design — built for serious
          embroidery businesses.
        </motion.p>
      </section>

      {/* ── BROWSE BY SERVICE ──────────────────────────── */}
      <section className="pb-8 pt-6 sm:pb-10 sm:pt-8">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-6 text-center sm:mb-8">
              <h2 className="mb-2 font-syne text-xl font-bold sm:text-2xl md:text-3xl">
                Browse Services by Category
              </h2>
              <p className="mx-auto max-w-lg text-sm text-[var(--txt2)]">
                Specialized digitizing for every garment type, material, and application.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
              {[
                {
                  emoji: "🧵",
                  label: "Embroidery Digitizing",
                  href: "/services/embroidery-digitizing",
                  color: "#2563EB",
                },
                {
                  emoji: "🧢",
                  label: "Cap Digitizing",
                  href: "/services/cap-digitizing",
                  color: "#F97316",
                },
                {
                  emoji: "👕",
                  label: "Left Chest",
                  href: "/services/left-chest-digitizing",
                  color: "#06B6D4",
                },
                {
                  emoji: "🧥",
                  label: "Jacket Back",
                  href: "/services/jacket-back-digitizing",
                  color: "#DC2626",
                },
                {
                  emoji: "🎩",
                  label: "3D Puff",
                  href: "/services/3d-puff-digitizing",
                  color: "#7C3AED",
                },
                {
                  emoji: "✨",
                  label: "Logo Digitizing",
                  href: "/services/logo-digitizing",
                  color: "#2563EB",
                },
                {
                  emoji: "✏️",
                  label: "Vector Conversion",
                  href: "/services/vector-art-conversion",
                  color: "#F97316",
                },
                {
                  emoji: "🏷️",
                  label: "Custom Patches",
                  href: "/services/custom-patches",
                  color: "#16A34A",
                },
                {
                  emoji: "🧣",
                  label: "Beanies",
                  href: "/services/beanies-digitizing",
                  color: "#DC2626",
                },
                {
                  emoji: "🪣",
                  label: "Towels",
                  href: "/services/towels-digitizing",
                  color: "#06B6D4",
                },
                { emoji: "🎒", label: "Bags", href: "/services/bags-digitizing", color: "#8B5CF6" },
                {
                  emoji: "👔",
                  label: "Uniforms",
                  href: "/services/uniforms-digitizing",
                  color: "#2563EB",
                },
                {
                  emoji: "⚽",
                  label: "Sportswear",
                  href: "/services/sportswear-digitizing",
                  color: "#F97316",
                },
                {
                  emoji: "🏢",
                  label: "Corporate Apparel",
                  href: "/services/corporate-apparel-digitizing",
                  color: "#1E3A5F",
                },
              ].map((svc) => (
                <Link
                  key={svc.href}
                  href={svc.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] hover:shadow-lg sm:p-4"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl sm:h-12 sm:w-12 sm:text-2xl"
                    style={{ background: `${svc.color}12`, border: `2px solid ${svc.color}25` }}
                  >
                    {svc.emoji}
                  </div>
                  <span className="text-center text-[11px] font-semibold leading-tight text-[var(--txt)] group-hover:text-[var(--txt)] sm:text-xs">
                    {svc.label}
                  </span>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── SERVICE SECTIONS (alternating layout) ──────────── */}
      <div className="mx-auto max-w-[1400px] space-y-16 px-5 pb-16 sm:space-y-20 sm:px-6 sm:pb-20 md:space-y-24 md:px-12 md:pb-24">
        {SERVICES.map((svc, i) => {
          const isReversed = i % 2 === 1;
          const IconComp = svc.icon;
          const portfolioForService = portfoliosByCategory[svc.slug] || [];

          return (
            <AnimatedSection key={svc.slug} className="!py-0">
              <div className="space-y-8 sm:space-y-10 md:space-y-12">
                {/* ── Service Detail Row ──────────────────────── */}
                <div
                  className={`grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16 ${
                    isReversed ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Content side */}
                  <div
                    className={`text-center sm:text-left ${isReversed ? "lg:order-2" : "lg:order-1"}`}
                  >
                    {/* Icon badge */}
                    <div
                      className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-2xl sm:mx-0 sm:mb-5 sm:h-14 sm:w-14 sm:text-3xl"
                      style={{
                        background: `${svc.color}12`,
                        border: `2px solid ${svc.color}25`,
                      }}
                    >
                      {svc.emoji}
                    </div>

                    <h2
                      className="mb-1.5 font-syne text-xl font-bold leading-[1.15] sm:mb-2 sm:text-3xl md:text-4xl"
                      style={{ color: svc.color }}
                    >
                      {svc.title}
                    </h2>

                    <p className="mb-2 text-sm font-medium text-[var(--txt2)] sm:mb-3 sm:text-lg">
                      {svc.subtitle}
                    </p>

                    <p className="mb-6 text-sm leading-relaxed text-[var(--txt2)] sm:mb-8">
                      {svc.description}
                    </p>

                    {/* Features list */}
                    <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
                      {svc.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start justify-center gap-2 text-xs text-[var(--txt2)] sm:justify-start sm:gap-3 sm:text-sm"
                        >
                          <span
                            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
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
                      <p className="mb-4 text-sm text-[var(--txt2)]">
                        Starting from{" "}
                        <strong className="text-[var(--txt)]">${priceMap[svc.slug]}</strong>
                      </p>
                    )}

                    {/* CTA buttons */}
                    <div className="flex flex-nowrap justify-center gap-2 sm:justify-start sm:gap-3">
                      <Link href="/pricing">
                        <Button
                          variant="grad"
                          size="md"
                          className="lg:size-lg"
                          rightIcon={<ArrowRight size={15} />}
                        >
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
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--elevated)]">
                      {portfolioForService[0]?.images?.[0] ? (
                        <Image
                          src={portfolioForService[0].images[0].url}
                          alt={svc.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="p-8 text-center">
                          <div
                            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                            style={{
                              background: `linear-gradient(135deg, ${svc.color}, ${svc.color}CC)`,
                              boxShadow: `0 12px 32px ${svc.color}30`,
                            }}
                          >
                            {svc.emoji}
                          </div>
                          <p className="mt-4 text-sm text-[var(--txt3)]">Sample coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Portfolio Preview for this Service ────────── */}
                {portfolioForService.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between sm:mb-5">
                      <div>
                        <h3 className="font-syne text-base font-bold text-[var(--txt)] sm:text-xl">
                          Recent {svc.title} Work
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--txt3)] sm:mt-1 sm:text-sm">
                          Real projects from our portfolio
                        </p>
                      </div>
                      <Link href="/portfolio" className="ml-2 flex-shrink-0">
                        <Button
                          variant="ghost2"
                          size="sm"
                          className="text-xs"
                          rightIcon={<ArrowRight size={12} />}
                        >
                          View All
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
                      {portfolioForService.map((item) => (
                        <PortfolioThumb
                          key={item.id}
                          item={item}
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between services */}
                {i < SERVICES.length - 1 && <div className="border-t border-[var(--border)]" />}
              </div>
            </AnimatedSection>
          );
        })}
      </div>

      {/* ── ALWAYS FREE (Green Box) ────────────────────────── */}
      <section className="py-0">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16A34A] via-[#15803D] to-[#14532D] p-6 sm:rounded-3xl sm:p-10 md:p-14">
            <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[300px] w-[300px] rounded-full bg-[#4ADE80] opacity-[0.10] blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 text-center sm:mb-10">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Always Included
                </span>
                <h2 className="mb-2 font-syne text-2xl font-bold text-white md:text-4xl">
                  Free With Every Order
                </h2>
                <p className="mx-auto max-w-md text-sm text-white/70">
                  No hidden fees. No surprises. Everything below comes standard.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
                {[
                  ["🔄", "Format Conversion", "Always FREE"],
                  ["♾️", "Unlimited Revisions", "Always FREE"],
                  ["⚡", "Rush 6h Delivery", "Always FREE"],
                  ["🔥", "Urgent 3h Delivery", "Always FREE"],
                ].map(([emoji, label, status], i) => (
                  <div
                    key={label}
                    className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-5 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl md:p-6"
                  >
                    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4ADE80] to-[#16A34A]" />
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#16A34A]/20 bg-[#F0FDF4] text-2xl">
                      {emoji}
                    </div>
                    <div className="mb-1 text-sm font-bold text-[var(--txt)]">{label}</div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#16A34A]/20 bg-[#16A34A]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
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
      <section className="sm:py-18 py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/90 p-8 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)] sm:rounded-[36px] sm:p-12 md:p-16">
            <GradientOrb
              color="#2563EB"
              size={260}
              className="-top-24 left-1/2 -translate-x-1/2 opacity-20"
            />

            <div className="relative z-10">
              <h2 className="mb-4 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                Ready to Start Your Project?
              </h2>
              <p className="mx-auto mb-6 max-w-2xl text-base text-[var(--txt2)] sm:mb-8 sm:text-lg">
                Professional embroidery services with free revisions, fast delivery, and all formats
                included.
              </p>
              <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
                <Link href="/pricing">
                  <Button
                    variant="grad"
                    size="md"
                    className="lg:size-lg"
                    rightIcon={<ArrowRight size={15} />}
                  >
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
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
