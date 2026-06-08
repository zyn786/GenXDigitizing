"use client";

import Link from "next/link";
import { ArrowRight, Upload, Check, Star, Clock, Shield, Zap, Layers, Download } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";

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
  benefits: { icon: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  testimonials: { name: string; company: string; text: string }[];
  cta: { text: string; href: string };
}

export function ServicePageTemplate({ data }: { data: ServicePageData }) {
  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative text-center pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 px-4 sm:px-6">
        <GradientOrb color={data.color} size={340} className="top-[-120px] left-1/2 -translate-x-1/2 opacity-12" />
        <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ background: `${data.color}15`, color: data.color, border: `1px solid ${data.color}25` }}>
          {data.emoji} Professional Service
        </span>
        <h1 className="font-syne font-bold text-[clamp(30px,7vw,56px)] leading-[1.06] mb-3">{data.title}</h1>
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

      {/* ── PRICING ─────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-[var(--surface)]">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2">Simple, Transparent Pricing</h2>
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

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <div className="relative overflow-hidden rounded-3xl border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 sm:p-12 shadow-[0_0_60px_rgba(37,99,235,0.1)]">
            <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-3">{data.cta.text}</h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] mb-6 max-w-md mx-auto">
              Professional service. Free revisions. Fast turnaround. Pay when satisfied.
            </p>
            <Link href={data.cta.href}>
              <Button variant="grad" size="lg" rightIcon={<Upload size={16} />}>Upload Design — Free Quote</Button>
            </Link>
            <p className="text-[11px] text-[var(--txt3)] mt-4">♾️ Free revisions · 🔄 All formats · ⚡ 3–24h delivery · 💳 Pay when satisfied</p>
          </div>
        </div>
      </section>
    </div>
  );
}
