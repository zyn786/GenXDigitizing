"use client";

import { motion } from "framer-motion";
import { Shield, RefreshCw, MessageCircle, FileCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

/* ═════════════════════════════════════════════════════════════
   PRODUCTION-READY GUARANTEE — risk reversal policies
   ═════════════════════════════════════════════════════════════ */
const GUARANTEES = [
  {
    icon: FileCheck,
    title: "Absolute Design Accuracy Guarantee",
    desc: "Every stitch path is manually digitized to match your artwork with surgical precision. If the sew-out doesn't match your approved proof, we re-digitize at zero cost — no questions, no limits.",
    color: "#2563EB",
  },
  {
    icon: RefreshCw,
    title: "Free Unlimited Design Revisions",
    desc: "Not satisfied with the stitch angles? Need density adjustments for a specific fabric? We revise until the file runs clean on your specific machine. Unlimited revisions. No expiration. No upcharge.",
    color: "#10B981",
  },
  {
    icon: MessageCircle,
    title: "Direct Digitizer Communication Access",
    desc: "Skip the support queue. Every order includes direct access to the digitizer working on your file. Discuss technical requirements, fabric specifications, and machine setup directly — no middlemen, no delays.",
    color: "#F59E0B",
  },
  {
    icon: Shield,
    title: "Machine-Run Tested Before Delivery",
    desc: "Every production file is test-sewn on a Brother PR1050X or Tajima TFMX-IIC before you receive it. We verify stitch density, underlay correctness, trim logic, and registration. You get a file that's proven to run — not a file we hope will run.",
    color: "#7C3AED",
  },
];

/* ═════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function ProductionGuarantee() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F59E0B]/10 text-[#92400E] border border-[#F59E0B]/20 mb-4">
            <Shield size={12} />
            Production-Ready Guarantee
          </span>
          <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3 tracking-tight">
            Zero risk.
            <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
              Production-grade output.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--txt2)] max-w-[640px] mx-auto">
            Every order is backed by ironclad risk reversals that protect your production schedule, your budget, and your reputation.
          </p>
        </div>

        {/* Guarantee cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-[960px] mx-auto mb-8 sm:mb-10">
          {GUARANTEES.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="relative bg-white rounded-2xl border border-[var(--border)] p-6 sm:p-7
                hover:border-[var(--border3)] transition-colors duration-200
                shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
            >
              {/* Accent top bar */}
              <div
                className="absolute top-0 left-6 right-6 h-[3px] rounded-b"
                style={{ background: g.color }}
              />

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 mt-1"
                style={{ background: `${g.color}12`, color: g.color }}
              >
                <g.icon size={22} />
              </div>

              {/* Title */}
              <h3 className="font-jakarta font-bold text-base mb-2 text-[var(--txt)]">{g.title}</h3>

              {/* Description */}
              <p className="text-sm text-[var(--txt2)] leading-relaxed">{g.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA card */}
        <div className="max-w-[960px] mx-auto bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-center text-white">
          <Shield size={28} className="mx-auto mb-3 opacity-80" />
          <h3 className="font-jakarta font-bold text-xl sm:text-2xl mb-2">
            Ready to test our accuracy?
          </h3>
          <p className="text-white/80 text-sm sm:text-base mb-5 max-w-[480px] mx-auto">
            Upload your first logo. If the sew-out doesn&apos;t run clean on your machine, you don&apos;t pay. Simple as that.
          </p>
          <Link
            href="/client/new-order"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
              bg-white text-[#2563EB] hover:bg-white/95
              shadow-[0_4px_14px_rgba(0,0,0,0.15)]
              active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Upload Your First File — Risk Free
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
