"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Upload,
  Check,
  Star,
  Clock,
  Shield,
  Zap,
  Layers,
  Download,
  Eye,
  Palette,
  Ruler,
  ImageOff,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { fetchPortfolio } from "@/components/portfolio/data";
import type { PortfolioItem } from "@/components/portfolio/data";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import { ContactForm } from "@/app/(marketing)/contact/ContactForm";
import { FreeSampleBanner } from "@/components/marketing/FreeSampleBanner";
import { SewOutGuarantee } from "@/components/marketing/SewOutGuarantee";

export interface ServicePageData {
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;
  keywords: string[];
  startingPrice: number;
  formats: string;
  turnaround: string;
  shortName?: string; // e.g. "Digitizing", "Vector Art", "Patches" — for "The Art of Perfect ___" heading
  benefits: { icon: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  // Was required; the fabricated arrays were stripped from all 15 service
  // pages. Optional so the pages keep type-checking. Re-add only with real
  // data from the `reviews` table.
  testimonials?: { name: string; company: string; text: string }[];
  portfolioSlug?: string;
  portfolioTag?: string;
  cta: { text: string; href: string };
}

export function ServicePageTemplate({ data }: { data: ServicePageData }) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeSub] = useState<string | null>(data.portfolioTag || null);

  useEffect(() => {
    if (!data.portfolioSlug) {
      setPortfolioLoading(false);
      return;
    }
    fetchPortfolio(data.portfolioSlug)
      .then((res) => setPortfolioItems(res.items))
      .catch(() => {})
      .finally(() => setPortfolioLoading(false));
  }, [data.portfolioSlug]);

  const filteredPortfolio = activeSub
    ? portfolioItems.filter((i) => i.tags?.includes(activeSub))
    : portfolioItems;

  return (
    <>
      <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
        {/* ── HERO ────────────────────────────────────── */}
        <section className="relative px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16 md:pt-20">
          <GradientOrb
            color={data.color}
            size={340}
            className="opacity-12 left-1/2 top-[-120px] -translate-x-1/2"
          />
          <span
            className="mb-4 inline-flex rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: `${data.color}15`,
              color: data.color,
              border: `1px solid ${data.color}25`,
            }}
          >
            {data.emoji} Professional Service
          </span>
          <h1 className="mb-3 font-syne text-[clamp(30px,7vw,56px)] leading-[1.1]">
            <span className="block font-bold tracking-tight">{data.title}</span>
            <span className="block font-light tracking-wide text-[var(--txt2)]">
              {data.shortName}
            </span>
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-base text-[var(--txt2)] sm:text-lg">
            {data.subtitle}
          </p>
          <p className="mx-auto mb-6 max-w-xl text-sm text-[var(--txt3)]">{data.description}</p>
          <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link href="/contact">
              <Button variant="grad" size="lg" rightIcon={<Upload size={16} />}>
                {data.cta.text}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight size={16} />}>
                View Pricing
              </Button>
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-[var(--txt3)]">
            <span className="flex items-center gap-1">
              <Check size={12} className="text-[#16A34A]" /> From ${data.startingPrice}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {data.turnaround}
            </span>
            <span className="flex items-center gap-1">
              <Download size={12} /> {data.formats}
            </span>
          </div>
        </section>

        {/* ── BENEFITS ────────────────────────────────── */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-12">
            <AnimatedSection>
              <div className="mb-8 text-center">
                <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl">
                  Why Choose Our {data.title}?
                </h2>
                <p className="mx-auto max-w-lg text-sm text-[var(--txt2)]">
                  Professional-quality results backed by real guarantees.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {data.benefits.map((b) => (
                  <div
                    key={b.title}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--border3)]"
                  >
                    <span className="flex-shrink-0 text-2xl">{b.icon}</span>
                    <div>
                      <h3 className="mb-0.5 font-syne text-sm font-bold">{b.title}</h3>
                      <p className="text-xs leading-relaxed text-[var(--txt2)]">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── PORTFOLIO ─────────────────────────────── */}
        {data.portfolioSlug && (
          <section className="bg-[var(--surface)] py-10 sm:py-14">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
              <AnimatedSection>
                <div className="mb-8 text-center">
                  <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl">
                    Our {data.title} Work
                  </h2>
                  <p className="mx-auto max-w-lg text-sm text-[var(--txt2)]">
                    Real projects from our production workflow — stitch-perfect results, every time.
                  </p>
                </div>
                {portfolioLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border3)] border-t-[var(--txt3)]" />
                  </div>
                ) : filteredPortfolio.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--txt3)]">
                    Portfolio samples coming soon.{" "}
                    <Link href="/portfolio" className="underline" style={{ color: data.color }}>
                      View full portfolio →
                    </Link>
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredPortfolio.slice(0, 6).map((item) => {
                        const img =
                          item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1) ||
                          item.images?.[0];
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-solid border-[var(--border)] bg-[var(--bg)] bg-transparent p-0 text-left transition-all duration-300 hover:border-[var(--border3)] hover:shadow-lg"
                          >
                            <div
                              className="relative aspect-[4/3] overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${data.color}10, ${data.color}05)`,
                              }}
                            >
                              {img ? (
                                <Image
                                  src={img.url}
                                  alt={img.alt || item.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-3xl opacity-30">
                                  {data.emoji}
                                </div>
                              )}
                              <span
                                className="absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  background: `${data.color}20`,
                                  color: data.color,
                                  border: `1px solid ${data.color}30`,
                                }}
                              >
                                {item.category?.name || "Work"}
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="mb-1 font-syne text-sm font-bold text-[var(--txt2)] transition-colors group-hover:text-[var(--txt)]">
                                {item.title}
                              </h3>
                              <p className="line-clamp-2 text-xs text-[var(--txt3)]">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-8 flex justify-center">
                      <Link href={`/portfolio?category=${data.portfolioSlug}`}>
                        <Button variant="outline" size="md" rightIcon={<ArrowRight size={14} />}>
                          View Full Portfolio
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* ── PRICING ─────────────────────────────────── */}
        <section className="bg-[var(--surface)] py-10 sm:py-14">
          <div className="mx-auto max-w-[600px] px-4 text-center sm:px-6">
            <AnimatedSection>
              <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl">
                Simple, No-Surprise Pricing
              </h2>
              <p className="mb-6 text-sm text-[var(--txt2)]">
                Starting from ${data.startingPrice}. Free revisions. Free formats. Fast turnaround.
              </p>
              <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Free Revisions", icon: Shield },
                  { label: "All Formats", icon: Download },
                  { label: "Fast Delivery", icon: Zap },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"
                    >
                      <Icon size={16} className="text-[#16A34A]" />
                      <span className="text-[11px] font-semibold text-[var(--txt)]">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/pricing">
                <Button variant="grad" size="md" rightIcon={<ArrowRight size={14} />}>
                  View Full Pricing
                </Button>
              </Link>
            </AnimatedSection>
          </div>
        </section>

        {/* ── TESTIMONIALS — REMOVED ──────────────────────
          This block rendered invented quotes on all fifteen service pages:
          "Marcus Rivera", "Sarah Kim", "David Chen", "Linda Martinez",
          "James Okafor", "Priya Mehta", "Angela Foster", "Tomás Rivera",
          "James T." — none of them real customers, all shown with five stars.
          The `testimonials` arrays have been stripped from every service page.

          Do not re-add fabricated quotes here. When the `reviews` table has
          published rows, render those instead. */}

        {/* ── GUARANTEE ──────────────────────────────── */}
        <SewOutGuarantee variant="banner" />

        {/* ── FAQ ─────────────────────────────────────── */}
        <section className="bg-[var(--surface)] py-10 sm:py-14">
          <div className="mx-auto max-w-[720px] px-4 sm:px-6">
            <AnimatedSection>
              <div className="mb-8 text-center">
                <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-2">
                {data.faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[var(--txt)] transition-colors hover:bg-[var(--elevated)]">
                      {f.q}
                      <span className="text-[var(--txt3)] transition-transform group-open:rotate-180">
                        ▼
                      </span>
                    </summary>
                    <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--txt2)]">
                      {f.a}
                    </div>
                  </details>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── FREE SAMPLE BANNER ────────────────────── */}
        <FreeSampleBanner />

        {/* ── ORDER FORM ────────────────────────────── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[700px] px-4 sm:px-6">
            <AnimatedSection>
              <div className="mb-8 text-center">
                <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl">
                  Start Your {data.title} Today
                </h2>
                <p className="text-sm text-[var(--txt2)]">
                  Upload your design. Get a free quote. Pay when satisfied.
                </p>
              </div>
              <ContactForm />
            </AnimatedSection>
          </div>
        </section>
      </div>

      {/* Portfolio Modal — opens on same page */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
