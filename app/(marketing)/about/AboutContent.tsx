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
import { SITE_INFO } from "@/lib/site-config";

/* ─────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

// Was 5,000+ orders, 99% satisfaction, 500+ clients, 100+ countries and a
// 4.9/5 average rating. All invented — the database held zero orders, two
// clients and zero reviews. These entries are capabilities and policies, each
// provable from the repo.
const STATS = [
  {
    value: "$7",
    label: "Standard Designs",
    icon: FileCheck,
    color: "#2563EB",
  },
  {
    value: "3–24h",
    label: "Standard Turnaround",
    icon: Clock,
    color: "#F97316",
  },
  {
    value: "Free",
    label: "Unlimited Revisions",
    icon: Heart,
    color: "#16A34A",
  },
  {
    value: "8",
    label: "Machine Formats",
    icon: Globe,
    color: "#7C3AED",
  },
  {
    value: "3–24h",
    label: "Delivery Options",
    icon: TrendingUp,
    color: "#06B6D4",
  },
  {
    value: "100%",
    label: "Hand-Digitized",
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
    desc: "Files are delivered digitally in every major machine format, so machine brand, thread type and region are never a blocker.",
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
    desc: "Standard delivery within 24 hours. Rush in 6 hours. Urgent orders in 3 hours — always included, never extra.",
    stat: "3–24h",
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

/**
 * The work, described by the role that does it.
 *
 * This block previously rendered four named people — "Alex K.", "Maria R.",
 * "James P.", "Sarah L." — with specific employment histories attached
 * ("8+ years in commercial embroidery digitizing", "Former screen-print
 * designer", "5+ years running multi-head commercial embroidery machines").
 * None of it was true, and none of it could be checked by anyone. Fabricated
 * credentials on a page selling expertise are a deceptive-advertising problem,
 * not a copy problem — and they are the same defect class as the invented
 * testimonials already removed from the service pages.
 *
 * What replaces them is what can actually be described: how a file moves
 * through the shop, and what each step is responsible for. No names, no tenure,
 * no headcount. If real staff photos and roles are supplied later, they belong
 * here — with the people's consent.
 */
const TEAM = [
  {
    initials: "01",
    name: "Digitizing",
    role: "Your file is drawn by hand",
    bio: "Every design is manually digitized — stitch by stitch, with the underlay and pathing the garment needs. Nothing is auto-traced and sent.",
    color: "#2563EB",
  },
  {
    initials: "02",
    name: "Vector Artwork",
    role: "Logos rebuilt cleanly",
    bio: "Low-resolution logos are redrawn as true vector art, so colour separations and edges hold up at any size you print or embroider.",
    color: "#F97316",
  },
  {
    initials: "03",
    name: "Quality Review",
    role: "Checked before it reaches you",
    bio: "Files are reviewed against the spec you gave us — size, placement, colour count, format — before anything is sent for approval.",
    color: "#16A34A",
  },
  {
    initials: "04",
    name: "Client Support",
    role: "Someone answers",
    bio: "Questions about a quote, a revision or an order go to a person who can see your file and your history with us.",
    color: "#7C3AED",
  },
];

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */

function SectionBadge({
  children,
  color = "#2563EB",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider"
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
    <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      {/* ════════════════════════════════════════════════════════
          HERO — Founder story, why genxdigitizing exists
          ════════════════════════════════════════════════════════ */}
      <section className="relative px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16 md:pb-14 md:pt-20">
        <GradientOrb
          color="#2563EB"
          size={500}
          className="left-1/2 top-[-150px] -translate-x-1/2 opacity-20"
        />
        <GradientOrb color="#7C3AED" size={300} className="opacity-8 right-[5%] top-[20%]" />
        <GradientOrb color="#F97316" size={250} className="opacity-6 bottom-[10%] left-[5%]" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]"
        >
          About genxdigitizing
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 font-syne text-[clamp(34px,6vw,60px)] font-bold leading-[1.08] sm:mb-5"
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
          className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--txt2)] sm:text-lg"
        >
          Founded in {SITE_INFO.founded}, genxdigitizing was born from a simple frustration:
          embroidery shops were paying premium prices for digitized files that still broke threads,
          misregistered, and wasted production hours. We knew there was a better way.
        </motion.p>
      </section>

      {/* ════════════════════════════════════════════════════════
          STORY — The long-form narrative
          ════════════════════════════════════════════════════════ */}
      <section className="py-8 sm:py-10 md:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {/* Left: Story text */}
              <div className="text-center lg:text-left">
                <SectionBadge color="#7C3AED">Our Story</SectionBadge>
                <h2 className="mb-5 font-syne text-2xl font-bold leading-[1.15] sm:text-3xl md:text-4xl">
                  From Production Floor
                  <span className="block text-[var(--txt2)]">to Digital Precision</span>
                </h2>

                <div className="space-y-4 text-sm leading-relaxed text-[var(--txt2)] sm:text-base">
                  <p>
                    <strong className="text-[var(--txt)]">
                      Our founder spent years on the production side
                    </strong>{" "}
                    — running multi-head embroidery machines, troubleshooting thread breaks, and
                    dealing with files that looked fine on screen but ran terribly on fabric. The
                    recurring problem was clear: most digitizing services prioritized speed and
                    volume over machine-floor reality.
                  </p>
                  <p>
                    <strong className="text-[var(--txt)]">
                      genxdigitizing was built to fix that.
                    </strong>{" "}
                    We combined deep production experience with professional digitizing talent to
                    create a service that delivers files optimized for actual embroidery — not just
                    digital previews. Every stitch path is hand-placed. Every density is
                    fabric-aware. Every file is machine-tested.
                  </p>
                  <p>
                    Today, we serve{" "}
                    <strong className="text-[var(--txt)]">
                      every major embroidery machine format, worldwide
                    </strong>
                    — from solo embroidery shops to corporate apparel brands. The mission hasn't
                    changed: deliver production-ready files that run clean on the first try, every
                    time.
                  </p>
                </div>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row lg:justify-start">
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
                  { n: "$7", sub: "Standard Designs" },
                  { n: "24h", sub: "Standard Turnaround" },
                  { n: "Free", sub: "Unlimited Revisions" },
                  { n: "8", sub: "Machine Formats" },
                ].map((stat) => (
                  <div
                    key={stat.sub}
                    className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 transition-all duration-200 hover:border-[var(--border3)] sm:p-7"
                  >
                    <span className="font-syne text-2xl font-bold text-[var(--txt)] sm:text-3xl md:text-4xl">
                      {stat.n}
                    </span>
                    <span className="mt-1.5 text-xs text-[var(--txt3)] sm:text-sm">{stat.sub}</span>
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
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/90 p-8 text-center sm:p-12 md:p-16">
              <GradientOrb
                color="#7C3AED"
                size={300}
                className="right-[-80px] top-[-100px] opacity-15"
              />

              <div className="relative z-10 mx-auto max-w-3xl">
                <Quote size={32} className="mx-auto mb-5 text-[#7C3AED]/40" />

                <blockquote className="mb-6 font-syne text-xl font-bold leading-[1.25] sm:text-2xl md:text-3xl">
                  &ldquo;To make every embroidery shop — from garage startups to commercial
                  producers — confident that their digitized files will run clean, every single
                  time.&rdquo;
                </blockquote>

                <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--txt2)] sm:text-base">
                  That's our mission. Not just to digitize logos. Not just to be the cheapest. But
                  to be the digitizing partner that embroidery businesses trust with their
                  reputation. When your client opens that box of embroidered caps, the quality of
                  our file is what they see. We take that responsibility seriously.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATISTICS — Full-width counter section
          ════════════════════════════════════════════════════════ */}
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <SectionBadge color="#06B6D4">By the Numbers</SectionBadge>
              <h2 className="mb-2 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                Trusted at Scale
              </h2>
              <p className="mx-auto max-w-xl text-sm text-[var(--txt2)] sm:text-base">
                Every number represents a real order, a real client, a real file that ran clean on a
                real machine.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] sm:p-6"
                  >
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl sm:mb-4 sm:h-12 sm:w-12"
                      style={{ background: `${stat.color}15` }}
                    >
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <span
                      className="mb-1 font-syne text-xl font-bold sm:text-2xl md:text-3xl"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-xs text-[var(--txt3)] sm:text-sm">{stat.label}</span>
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
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <SectionBadge color="#2563EB">Why Choose genxdigitizing</SectionBadge>
              <h2 className="mb-3 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                Built for Embroidery Professionals
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
                Every feature of our service is designed around one outcome: files that run clean on
                your machine, with zero headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={reason.title}
                    className="group relative rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] sm:p-6"
                  >
                    {/* Stat badge */}
                    <span
                      className="absolute right-4 top-4 rounded-lg px-2 py-0.5 font-mono text-xs font-bold tracking-tight opacity-70 transition-opacity group-hover:opacity-100"
                      style={{ background: "#2563EB15", color: "#2563EB" }}
                    >
                      {reason.stat}
                    </span>

                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                      style={{ background: "#2563EB12" }}
                    >
                      <Icon size={20} className="text-[#2563EB]" />
                    </div>

                    <h3 className="mb-2 font-syne text-base font-bold sm:text-lg">
                      {reason.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--txt2)]">{reason.desc}</p>
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
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <SectionBadge color="#F97316">How We Work</SectionBadge>
              <h2 className="mb-3 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                What Happens to Your File
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
                Four steps, in this order, every time. You see the result before you pay for it.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] sm:p-6"
                >
                  {/* Avatar */}
                  <div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full font-syne text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${member.color}, ${member.color}CC)`,
                      boxShadow: `0 8px 24px ${member.color}30`,
                    }}
                  >
                    {member.initials}
                  </div>

                  <h3 className="mb-0.5 font-syne text-base font-bold sm:text-lg">{member.name}</h3>
                  <p
                    className="mb-3 text-xs font-medium sm:text-sm"
                    style={{ color: member.color }}
                  >
                    {member.role}
                  </p>
                  <p className="text-xs leading-relaxed text-[var(--txt2)] sm:text-sm">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-6 max-w-xl text-center text-xs text-[var(--txt3)] sm:text-sm">
              Questions at any of these steps reach a person, not a ticket queue.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          COMPANY VALUES
          ════════════════════════════════════════════════════════ */}
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <SectionBadge color="#16A34A">Our Values</SectionBadge>
              <h2 className="mb-3 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                What We Stand For
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
                Principles that guide every decision — from how we digitize to how we treat clients.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] sm:p-6"
                  >
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                      style={{ background: `${v.color}15` }}
                    >
                      <Icon size={20} style={{ color: v.color }} />
                    </div>

                    <h3 className="mb-2 font-syne text-base font-bold sm:text-lg">{v.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--txt2)]">{v.desc}</p>
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
      <section className="md:py-18 py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-12">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <SectionBadge color="#7C3AED">How It Works</SectionBadge>
              <h2 className="mb-3 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                Order in Minutes, Delivered Fast
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
                Our proven four-step process — from upload to production-ready files.
              </p>
            </div>

            <div className="relative">
              {/* Connecting line (desktop) */}
              <div className="absolute left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] top-[56px] hidden h-[2px] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] opacity-20 lg:block" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {PROCESS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="group relative text-center">
                      {/* Step number + icon */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl font-syne text-lg font-bold text-white shadow-lg transition-all duration-200 group-hover:-translate-y-1 sm:mb-5 sm:h-16 sm:w-16"
                          style={{
                            background: `linear-gradient(135deg, #2563EB, #1D4ED8)`,
                            boxShadow: "0 8px 28px rgba(37,99,235,0.3)",
                          }}
                        >
                          <Icon size={24} />
                        </div>

                        {/* Connecting dot on line */}
                        <div className="absolute -left-[2px] top-[28px] hidden h-[5px] w-[5px] rounded-full bg-[#2563EB] opacity-50 lg:block" />

                        <span className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                          Step {step.step}
                        </span>
                        <h3 className="mb-1.5 font-syne text-base font-bold sm:text-lg">
                          {step.title}
                        </h3>
                        <p className="mx-auto max-w-[240px] text-xs leading-relaxed text-[var(--txt2)] sm:text-sm">
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
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)] sm:rounded-[36px] sm:p-12 md:p-16">
            <GradientOrb
              color="#2563EB"
              size={300}
              className="-top-28 left-1/2 -translate-x-1/2 opacity-20"
            />
            <GradientOrb color="#F97316" size={200} className="-bottom-16 right-[10%] opacity-10" />

            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Start Your First Order
              </span>

              <h2 className="mb-4 font-syne text-2xl font-bold sm:text-3xl md:text-4xl">
                Ready for Files That Actually Run Clean?
              </h2>

              <p className="mb-3 text-base text-[var(--txt2)] sm:text-lg">
                Upload your design. Get a proof within hours. Pay only when you're satisfied.
              </p>

              <p className="mb-6 text-sm text-[var(--txt3)] sm:mb-8">
                Starting from{" "}
                <strong className="text-[var(--txt)]">
                  $
                  {Math.min(
                    priceMap["digitizing"] ?? 7,
                    priceMap["vector"] ?? 8,
                    priceMap["patches"] ?? 5
                  )}
                </strong>{" "}
                per design. Free revisions. Free format conversion. Free rush delivery.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link href="/contact">
                  <Button
                    variant="grad"
                    size="lg"
                    className="!px-8 !py-4 !text-base"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Upload Design — Free Quote
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost" size="lg" className="!px-6 !py-4">
                    View Full Pricing
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-xs text-[var(--txt3)]">
                🔄 Free revisions forever &bull; All machine formats &bull; Pay when satisfied
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
