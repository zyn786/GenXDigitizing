"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Upload, Check, Star, Clock, Shield, Zap, Layers, Download, Eye, Palette, Ruler, ImageOff } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
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
  testimonials: { name: string; company: string; text: string }[];
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
    if (!data.portfolioSlug) { setPortfolioLoading(false); return; }
    fetchPortfolio(data.portfolioSlug)
      .then((res) => setPortfolioItems(res.items))
      .catch(() => {})
      .finally(() => setPortfolioLoading(false));
  }, [data.portfolioSlug]);

  const filteredPortfolio = activeSub
    ? portfolioItems.filter(i => i.tags?.includes(activeSub))
    : portfolioItems;

  return (
    <>
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative text-center pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 px-4 sm:px-6">
        <GradientOrb color={data.color} size={340} className="top-[-120px] left-1/2 -translate-x-1/2 opacity-12" />
        <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ background: `${data.color}15`, color: data.color, border: `1px solid ${data.color}25` }}>
          {data.emoji} Professional Service
        </span>
        <h1 className="font-syne text-[clamp(30px,7vw,56px)] leading-[1.1] mb-3">
          <span className="block font-light tracking-wide">Real Digitizers.</span>
          <span className="block font-bold tracking-tight bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FBBF24] bg-clip-text text-transparent">
            No Auto-Trace.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--txt2)] max-w-2xl mx-auto mb-2">{data.subtitle}</p>
        <p className="text-sm text-[var(--txt3)] max-w-xl mx-auto mb-6">{data.description}</p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link href="/contact">
            <Button variant="grad" size="lg" rightIcon={<Upload size={16} />}>{data.cta.text}</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg" rightIcon={<ArrowRight size={16} />}>View Pricing</Button>
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-5 text-xs text-[var(--txt3)]">
          <span className="flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> From ${data.startingPrice}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {data.turnaround}</span>
          <span className="flex items-center gap-1"><Download size={12} /> {data.formats}</span>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Why Choose Our {data.title}?</h2>
              <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">Professional-quality results backed by real guarantees.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {data.benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border3)] transition-all">
                  <span className="text-2xl flex-shrink-0">{b.icon}</span>
                  <div>
                    <h3 className="font-syne font-bold text-sm mb-0.5">{b.title}</h3>
                    <p className="text-xs text-[var(--txt2)] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── PORTFOLIO ─────────────────────────────── */}
      {data.portfolioSlug && (
        <section className="py-10 sm:py-14 bg-[var(--surface)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
            <AnimatedSection>
              <div className="text-center mb-8">
                <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Our {data.title} Work</h2>
                <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">Real projects from our production workflow — stitch-perfect results, every time.</p>
              </div>
              {portfolioLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[var(--border3)] border-t-[var(--txt3)] rounded-full animate-spin" />
                </div>
              ) : filteredPortfolio.length === 0 ? (
                <p className="text-center text-sm text-[var(--txt3)] py-10">Portfolio samples coming soon. <Link href="/portfolio" className="underline" style={{ color: data.color }}>View full portfolio →</Link></p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPortfolio.slice(0, 6).map((item) => {
                      const img = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1) || item.images?.[0];
                      return (
                        <button key={item.id} onClick={() => setSelectedItem(item)} className="group rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border3)] transition-all duration-300 hover:shadow-lg cursor-pointer w-full text-left bg-transparent p-0 border-solid">
                          <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${data.color}10, ${data.color}05)` }}>
                            {img ? (
                              <Image src={img.url} alt={img.alt || item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-3xl opacity-30">{data.emoji}</div>
                            )}
                            <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10" style={{ background: `${data.color}20`, color: data.color, border: `1px solid ${data.color}30` }}>{item.category?.name || "Work"}</span>
                          </div>
                          <div className="p-4">
                            <h3 className="font-syne font-bold text-sm mb-1 group-hover:text-[var(--txt)] text-[var(--txt2)] transition-colors">{item.title}</h3>
                            <p className="text-xs text-[var(--txt3)] line-clamp-2">{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-center mt-8">
                    <Link href={`/portfolio?category=${data.portfolioSlug}`}>
                      <Button variant="outline" size="md" rightIcon={<ArrowRight size={14} />}>View Full Portfolio</Button>
                    </Link>
                  </div>
                </>
              )}
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── PRICING ─────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-[var(--surface)]">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Simple, No-Surprise Pricing</h2>
            <p className="text-sm text-[var(--txt2)] mb-6">Starting from ${data.startingPrice}. Free revisions. Free formats. Fast turnaround.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Free Revisions", icon: Shield },
                { label: "All Formats", icon: Download },
                { label: "Fast Delivery", icon: Zap },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <Icon size={16} className="text-[#16A34A]" />
                    <span className="text-[11px] font-semibold text-[var(--txt)]">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/pricing">
              <Button variant="grad" size="md" rightIcon={<ArrowRight size={14} />}>View Full Pricing</Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">What Our Clients Say</h2>
              <p className="text-sm text-[var(--txt2)]">Real feedback from professionals who trust us</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {data.testimonials.map((t) => (
                <div key={t.name} className="bg-[var(--surface)] rounded-2xl p-4 sm:p-5 border border-[var(--border)]">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#F59E0B" stroke="none" />)}
                  </div>
                  <p className="text-sm text-[var(--txt2)] leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
                  <p className="text-xs font-semibold text-[var(--txt)]">{t.name} — {t.company}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── GUARANTEE ──────────────────────────────── */}
      <SewOutGuarantee variant="banner" />

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-[var(--surface)]">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {data.faqs.map((f, i) => (
                <details key={i} className="group bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[var(--txt)] cursor-pointer hover:bg-[var(--elevated)] transition-colors list-none">
                    {f.q}
                    <span className="text-[var(--txt3)] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--txt2)] leading-relaxed">{f.a}</div>
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
        <div className="max-w-[700px] mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Start Your {data.title} Today</h2>
              <p className="text-sm text-[var(--txt2)]">Upload your design. Get a free quote. Pay when satisfied.</p>
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
