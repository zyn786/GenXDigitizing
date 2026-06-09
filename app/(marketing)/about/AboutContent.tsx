"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  RefreshCw,
  Shield,
  Globe,
  Clock,
  Star,
  Users,
  Target,
  Heart,
  Eye,
  Handshake,
  TrendingUp,
  Upload,
  FileCheck,
  Pencil,
  Download,
  Quote,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { SITE_STATS, SITE_INFO, fmt, fmtPlus } from "@/lib/site-config";

/* ─────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const STATS = [
  {
    value: fmtPlus(SITE_STATS.ordersCompleted),
    label: "Orders Completed",
    icon: FileCheck,
    color: "#2563EB",
  },
  {
    value: `${SITE_STATS.satisfactionRate}%`,
    label: "Client Satisfaction",
    icon: Heart,
    color: "#16A34A",
  },
  {
    value: `${SITE_STATS.avgDeliveryHours}h`,
    label: "Avg. Delivery Time",
    icon: Clock,
    color: "#F97316",
  },
  {
    value: fmtPlus(SITE_STATS.clientsServed),
    label: "Clients Worldwide",
    icon: Globe,
    color: "#7C3AED",
  },
  {
    value: fmtPlus(SITE_STATS.countriesServed),
    label: "Countries Served",
    icon: TrendingUp,
    color: "#06B6D4",
  },
  {
    value: `${SITE_STATS.avgRating}/5`,
    label: "Average Rating",
    icon: Star,
    color: "#EAB308",
  },
];

const VALUES = [
  {
    icon: Eye,
    title: "Obsessive Quality",
    desc: "Every file is manually digitized, machine-tested, and reviewed before delivery. We treat every order like it's going on our own machine.",
    color: "#2563EB",
  },
  {
    icon: Handshake,
    title: "Radical Transparency",
    desc: "No hidden fees. No bait-and-switch pricing. You see the proof, you approve it, you pay. Simple as that.",
    color: "#16A34A",
  },
  {
    icon: Zap,
    title: "Speed Without Compromise",
    desc: "Fast turnaround means nothing if the file runs poorly. We optimize for clean sew-outs first, speed second.",
    color: "#F97316",
  },
  {
    icon: Heart,
    title: "Client-First Culture",
    desc: "Unlimited free revisions isn't marketing speak — it's how we work. Your file isn't done until it runs right on your machine.",
    color: "#DC2626",
  },
  {
    icon: RefreshCw,
    title: "Continuous Learning",
    desc: "Every fabric, machine, and design teaches us something. We refine our process constantly based on real production feedback.",
    color: "#7C3AED",
  },
  {
    icon: Globe,
    title: "Global Standards, Local Care",
    desc: "Serving clients in 100+ countries means understanding different machine brands, thread types, and regional preferences.",
    color: "#06B6D4",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Upload Your Design",
    desc: "Share your logo, sketch, or artwork. Tell us the size, placement, and machine format you need.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Manual Digitizing",
    desc: "Our digitzers hand-place every stitch path, adjust density for your fabric, and optimize for clean sew-outs.",
    icon: Pencil,
  },
  {
    step: "03",
    title: "Proof & Approve",
    desc: "You review the digitized proof. Need changes? Request unlimited free revisions until it's perfect.",
    icon: FileCheck,
  },
  {
    step: "04",
    title: "Download & Produce",
    desc: "Receive production-ready files in your machine format. Load, sew, and ship your orders.",
    icon: Download,
  },
];

const REASONS = [
  {
    icon: Clock,
    title: "3–24h Turnaround",
    desc: "Standard delivery within 12 hours. Rush in 6 hours. Urgent orders in 3 hours — always included, never extra.",
    stat: "3–12h avg",
  },
  {
    icon: Pencil,
    title: "100% Manual Digitizing",
    desc: "No auto-tracing software. Every stitch path is hand-placed by experienced digitzers who understand fabric behavior and machine mechanics.",
    stat: "Manual only",
  },
  {
    icon: RefreshCw,
    title: "Unlimited Free Revisions",
    desc: "Not satisfied? We revise until you are. No revision caps. No extra charges. Files run clean or we keep working.",
    stat: "Unlimited",
  },
  {
    icon: Shield,
    title: "Machine-Tested Quality",
    desc: "Every file goes through quality review. Stitch paths checked. Density verified. Format validated. Only then does it reach your inbox.",
    stat: "100% checked",
  },
  {
    icon: Globe,
    title: "All Machine Formats",
    desc: "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — you name it. Free format conversion on every order.",
    stat: "8+ formats",
  },
  {
    icon: Sparkles,
    title: "Pay When Satisfied",
    desc: "Review your proof first. Pay only when you're happy with the digitized file. Zero risk to your business.",
    stat: "Risk-free",
  },
];

const TEAM = [
  {
    initials: "AK",
    name: "Alex K.",
    role: "Lead Digitizer",
    bio: "8+ years in commercial embroidery digitizing. Specializes in 3D puff, cap digitizing, and complex jacket backs.",
    color: "#2563EB",
  },
  {
    initials: "MR",
    name: "Maria R.",
    role: "Senior Vector Artist",
    bio: "Former screen-print designer turned vector specialist. Handles complex logo rebuilds and color separations.",
    color: "#F97316",
  },
  {
    initials: "JP",
    name: "James P.",
    role: "Quality Control Lead",
    bio: "Reviews every file before delivery. 5+ years running multi-head commercial embroidery machines in production shops.",
    color: "#16A34A",
  },
  {
    initials: "SL",
    name: "Sarah L.",
    role: "Client Success Manager",
    bio: "First point of contact for new clients. Ensures clear communication, accurate specs, and on-time delivery.",
    color: "#7C3AED",
  },
];

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */

function SectionBadge({ children, color = "#2563EB" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────── */

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

export function AboutContent({ tiers }: { tiers: ServiceTier[] }) {
  // Compute starting prices
  const priceMap: Record<string, number> = {};
  for (const t of tiers) {
    if (!priceMap[t.category] || t.price < priceMap[t.category]) {
      priceMap[t.category] = t.price;
    }
  }

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ════════════════════════════════════════════════════════
          HERO — Founder story, why genxdigitizing exists
          ════════════════════════════════════════════════════════ */}
      <section className="relative text-center pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-20 md:pb-14 px-4 sm:px-6">
        <GradientOrb color="#2563EB" size={500} className="top-[-150px] left-1/2 -translate-x-1/2 opacity-20" />
        <GradientOrb color="#7C3AED" size={300} className="top-[20%] right-[5%] opacity-8" />
        <GradientOrb color="#F97316" size={250} className="bottom-[10%] left-[5%] opacity-6" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
            bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-5"
        >
          About genxdigitizing
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-syne font-bold text-[clamp(34px,6vw,60px)] leading-[1.08] mb-4 sm:mb-5"
        >
          We Make Your Logo
          <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Machine-Ready
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-[var(--txt2)] max-w-3xl mx-auto leading-relaxed"
        >
          Founded in {SITE_INFO.founded}, genxdigitizing was born from a simple frustration: embroidery shops were paying
          premium prices for digitized files that still broke threads, misregistered, and wasted production hours.
          We knew there was a better way.
        </motion.p>
      </section>

      {/* ════════════════════════════════════════════════════════
          STORY — The long-form narrative
          ════════════════════════════════════════════════════════ */}
      <section className="py-8 sm:py-10 md:py-14">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left: Story text */}
              <div className="text-center lg:text-left">
                <SectionBadge color="#7C3AED">Our Story</SectionBadge>
                <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-5 leading-[1.15]">
                  From Production Floor
                  <span className="block text-[var(--txt2)]">to Digital Precision</span>
                </h2>

                <div className="space-y-4 text-sm sm:text-base text-[var(--txt2)] leading-relaxed">
                  <p>
                    <strong className="text-[var(--txt)]">Our founder spent years on the production side</strong> —
                    running multi-head embroidery machines, troubleshooting thread breaks, and dealing with files
                    that looked fine on screen but ran terribly on fabric. The recurring problem was clear: most
                    digitizing services prioritized speed and volume over machine-floor reality.
                  </p>
                  <p>
                    <strong className="text-[var(--txt)]">genxdigitizing was built to fix that.</strong> We combined deep
                    production experience with professional digitizing talent to create a service that delivers
                    files optimized for actual embroidery — not just digital previews. Every stitch path is
                    hand-placed. Every density is fabric-aware. Every file is machine-tested.
                  </p>
                  <p>
                    Today, we serve{" "}
                    <strong className="text-[var(--txt)]">
                      {fmtPlus(SITE_STATS.clientsServed)} clients across {fmtPlus(SITE_STATS.countriesServed)} countries
                    </strong>
                    — from solo embroidery shops to corporate apparel brands. The mission hasn't changed: deliver
                    production-ready files that run clean on the first try, every time.
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/services">
                    <Button variant="grad" size="lg" rightIcon={<ArrowRight size={15} />}>
                      Explore Our Services
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="ghost" size="lg">
                      Get a Free Quote
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: Visual / Stats mini-grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { n: fmtPlus(SITE_STATS.ordersCompleted), sub: "Orders Delivered" },
                  { n: `${SITE_STATS.satisfactionRate}%`, sub: "Satisfaction Rate" },
                  { n: `${SITE_STATS.avgDeliveryHours}h`, sub: "Avg. Turnaround" },
                  { n: `${SITE_STATS.avgRating}/5`, sub: "Client Rating" },
                ].map((stat) => (
                  <div
                    key={stat.sub}
                    className="flex flex-col items-center justify-center bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 hover:border-[var(--border3)] transition-all duration-200"
                  >
                    <span className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--txt)]">
                      {stat.n}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--txt3)] mt-1.5">{stat.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MISSION
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-[#7C3AED]/15 bg-gradient-to-br from-[#7C3AED]/8 via-[#2563EB]/5 to-[#F97316]/5 p-8 sm:p-12 md:p-16 text-center">
              <GradientOrb color="#7C3AED" size={300} className="top-[-100px] right-[-80px] opacity-15" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <Quote size={32} className="mx-auto text-[#7C3AED]/40 mb-5" />

                <blockquote className="font-syne font-bold text-xl sm:text-2xl md:text-3xl leading-[1.25] mb-6">
                  &ldquo;To make every embroidery shop — from garage startups to commercial producers —
                  confident that their digitized files will run clean, every single time.&rdquo;
                </blockquote>

                <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto leading-relaxed">
                  That's our mission. Not just to digitize logos. Not just to be the cheapest. But to be the
                  digitizing partner that embroidery businesses trust with their reputation. When your client
                  opens that box of embroidered caps, the quality of our file is what they see. We take that
                  responsibility seriously.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATISTICS — Full-width counter section
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-10">
              <SectionBadge color="#06B6D4">By the Numbers</SectionBadge>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-2">
                Trusted at Scale
              </h2>
              <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
                Every number represents a real order, a real client, a real file that ran clean on a real machine.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center text-center bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200"
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                      style={{ background: `${stat.color}15` }}
                    >
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <span
                      className="font-syne font-bold text-xl sm:text-2xl md:text-3xl mb-1"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--txt3)]">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY CLIENTS CHOOSE US
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-10">
              <SectionBadge color="#2563EB">Why Choose genxdigitizing</SectionBadge>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3">
                Built for Embroidery Professionals
              </h2>
              <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto">
                Every feature of our service is designed around one outcome: files that run clean on your machine,
                with zero headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={reason.title}
                    className="group relative bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Stat badge */}
                    <span
                      className="absolute top-4 right-4 text-xs font-bold font-mono tracking-tight px-2 py-0.5 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#2563EB15", color: "#2563EB" }}
                    >
                      {reason.stat}
                    </span>

                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "#2563EB12" }}
                    >
                      <Icon size={20} className="text-[#2563EB]" />
                    </div>

                    <h3 className="font-syne font-bold text-base sm:text-lg mb-2">{reason.title}</h3>
                    <p className="text-sm text-[var(--txt2)] leading-relaxed">{reason.desc}</p>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MEET THE TEAM
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-10">
              <SectionBadge color="#F97316">Our Team</SectionBadge>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3">
                The People Behind Your Files
              </h2>
              <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto">
                Real digitzers. Real artists. Real quality specialists. No outsourcing black boxes — every
                team member is trained, vetted, and dedicated to embroidery quality.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="group bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 text-center hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl sm:text-3xl font-syne font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${member.color}, ${member.color}CC)`,
                      boxShadow: `0 8px 24px ${member.color}30`,
                    }}
                  >
                    {member.initials}
                  </div>

                  <h3 className="font-syne font-bold text-base sm:text-lg mb-0.5">{member.name}</h3>
                  <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: member.color }}>
                    {member.role}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--txt2)] leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>

            {/* Team note */}
            <p className="text-center text-xs sm:text-sm text-[var(--txt3)] mt-6 max-w-xl mx-auto">
              This is our core leadership team. Behind them: a network of vetted digitzers and artists who
              share genxdigitizing quality standards. Every file passes through senior review before delivery.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          COMPANY VALUES
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-10">
              <SectionBadge color="#16A34A">Our Values</SectionBadge>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3">
                What We Stand For
              </h2>
              <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto">
                Principles that guide every decision — from how we digitize to how we treat clients.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="group bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200"
                  >
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${v.color}15` }}
                    >
                      <Icon size={20} style={{ color: v.color }} />
                    </div>

                    <h3 className="font-syne font-bold text-base sm:text-lg mb-2">{v.title}</h3>
                    <p className="text-sm text-[var(--txt2)] leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PROCESS TIMELINE
          ════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-18">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-10">
              <SectionBadge color="#7C3AED">How It Works</SectionBadge>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3">
                Order in Minutes, Delivered Fast
              </h2>
              <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto">
                Our proven four-step process — refined across {fmtPlus(SITE_STATS.ordersCompleted)} orders.
              </p>
            </div>

            <div className="relative">
              {/* Connecting line (desktop) */}
              <div className="hidden lg:block absolute top-[56px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-[2px] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] opacity-20" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {PROCESS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="relative text-center group">
                      {/* Step number + icon */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 text-white font-syne font-bold text-lg shadow-lg group-hover:-translate-y-1 transition-all duration-200"
                          style={{
                            background: `linear-gradient(135deg, #2563EB, #1D4ED8)`,
                            boxShadow: "0 8px 28px rgba(37,99,235,0.3)",
                          }}
                        >
                          <Icon size={24} />
                        </div>

                        {/* Connecting dot on line */}
                        <div className="hidden lg:block absolute top-[28px] -left-[2px] w-[5px] h-[5px] rounded-full bg-[#2563EB] opacity-50" />

                        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-2">
                          Step {step.step}
                        </span>
                        <h3 className="font-syne font-bold text-base sm:text-lg mb-1.5">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-[var(--txt2)] leading-relaxed max-w-[240px] mx-auto">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — Conversion section
          ════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 sm:p-12 md:p-16 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)] backdrop-blur-xl">
            <GradientOrb color="#2563EB" size={300} className="-top-28 left-1/2 -translate-x-1/2 opacity-20" />
            <GradientOrb color="#F97316" size={200} className="-bottom-16 right-[10%] opacity-10" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 bg-white/15 text-white border border-white/20">
                Start Your First Order
              </span>

              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-4">
                Ready for Files That Actually Run Clean?
              </h2>

              <p className="text-base sm:text-lg text-[var(--txt2)] mb-3">
                Upload your design. Get a proof within hours. Pay only when you're satisfied.
              </p>

              <p className="text-sm text-[var(--txt3)] mb-6 sm:mb-8">
                Starting from{" "}
                <strong className="text-[var(--txt)]">
                  ${Math.min(priceMap["digitizing"] ?? 7, priceMap["vector"] ?? 8, priceMap["patches"] ?? 5)}
                </strong>{" "}
                per design. Free revisions. Free format conversion. Free rush delivery.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/contact">
                  <Button variant="grad" size="lg" className="!px-8 !py-4 !text-base" rightIcon={<ArrowRight size={16} />}>
                    Upload Design — Free Quote
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost" size="lg" className="!px-6 !py-4">
                    View Full Pricing
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-[var(--txt3)] mt-5">
                🔄 Free revisions forever &bull; All machine formats &bull; Pay when satisfied
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
