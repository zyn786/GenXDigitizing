"use client";

import { motion } from "framer-motion";
import { TrendingDown, Clock, Wrench, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

/* ═════════════════════════════════════════════════════════════
   ENTERPRISE B2B TESTIMONIALS — metrics over praise
   ═════════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    metric: "Reduced thread break downtime by 40%",
    context: "across 6-head Barudan production line",
    quote:
      "Before GenX, we were stopping 3-4 times per run to trim and re-thread. Their optimized stitch paths and clean trim routing cut our machine stops nearly in half. That's 40% more production hours per week.",
    name: "Michael Torres",
    role: "Production Manager",
    company: "Precision Stitch Co., Texas",
    country: "USA",
    stat: "40%",
    statLabel: "Downtime Reduction",
    color: "#2563EB",
  },
  {
    metric: "Flawless 15-file batch delivered in 6 hours",
    context: "urgent order for 500-unit corporate apparel run",
    quote:
      "Submitted 15 left chest logos at 11pm for a morning production deadline. All 15 files were in my inbox by 5am. Zero revisions needed. Loaded straight into the Tajima and ran clean on every single unit.",
    name: "Sarah Henderson",
    role: "Operations Director",
    company: "BrandMark Apparel, UK",
    country: "UK",
    stat: "15/15",
    statLabel: "First-Run Success",
    color: "#10B981",
  },
  {
    metric: "Scaled from 200 to 1,200 orders/month",
    context: "without adding in-house digitizing staff",
    quote:
      "We used to have two in-house digitizers who couldn't keep up with demand. GenX now handles our full overflow — 800+ files per month — with better consistency than our internal team. We scaled output 6x without hiring.",
    name: "David Park",
    role: "CEO",
    company: "ThreadLogic Manufacturing, Korea",
    country: "Korea",
    stat: "6×",
    statLabel: "Output Scale",
    color: "#F59E0B",
  },
];

/* ═════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function EnterpriseTestimonials() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[var(--elevated)]/40">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20 mb-4">
            Enterprise Results
          </span>
          <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3 tracking-tight">
            Measurable outcomes,
            <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
              not generic praise
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--txt2)] max-w-[640px] mx-auto">
            Real production metrics from embroidery shops, apparel manufacturers, and print businesses running our files daily.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-[var(--border)] p-6 sm:p-7 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
            >
              {/* Big stat */}
              <div className="mb-5">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: `${t.color}10`, color: t.color, border: `1px solid ${t.color}25` }}
                >
                  {t.stat}
                  <span className="font-normal text-[11px] opacity-70">{t.statLabel}</span>
                </div>
              </div>

              {/* Metric headline */}
              <blockquote className="mb-3">
                <p className="font-jakarta font-bold text-base sm:text-lg leading-snug text-[var(--txt)]">
                  &ldquo;{t.metric}&rdquo;
                </p>
                <p className="text-xs text-[var(--txt3)] mt-1">{t.context}</p>
              </blockquote>

              {/* Full quote */}
              <p className="text-sm text-[var(--txt2)] leading-relaxed mb-5 flex-1">
                {t.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}dd)` }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--txt)]">{t.name}</div>
                  <div className="text-[11px] text-[var(--txt3)]">
                    {t.role}, {t.company}
                  </div>
                </div>
                <div className="ml-auto text-[10px] font-medium text-[var(--txt3)] uppercase">
                  {t.country}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/client/new-order"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
              bg-[#10B981] text-white hover:bg-[#059669]
              shadow-[0_4px_14px_rgba(16,185,129,0.25)]
              active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Get Your Production Metrics
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
