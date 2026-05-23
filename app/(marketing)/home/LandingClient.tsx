"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useSpring, useTransform, useInView } from "framer-motion";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { PortfolioPreview } from "@/components/portfolio/PortfolioPreview";
import { FreeDesignsPreview } from "@/components/free-designs/FreeDesignsPreview";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) spring.set(to);
  }, [inView, to, spring]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// ── Rotating Embroidery Showcase Carousel ──────────────────
const SHOWCASE_SLIDES = [
  {
    id: "cap",
    emoji: "🧢",
    gifUrl: "https://res.cloudinary.com/djoixgojj/image/upload/v1779207170/jacket-embroidery_ycfnqh.webp",
    product: "Premium Structured Cap",
    title: "Puff 3D Logo Cap",
    client: "Streetwear Brand",
    stitches: "6,400 stitches",
    colors: "3 colors",
    density: 92,
    clientTag: "100%",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
    accentGlow: "rgba(37,99,235,0.3)",
  },
  {
    id: "polo",
    emoji: "👕",
    gifUrl: "https://res.cloudinary.com/djoixgojj/image/upload/v1779204050/cap-embroidery_sjxoep.webp",
    product: "Hello Kitty Logo",
    title: "Shirt Left Chest",
    client: "Fan Apparel",
    stitches: "4,200 stitches",
    colors: "8 colors",
    density: 78,
    clientTag: "100%",
    bgGradient: "linear-gradient(135deg, #1a1a1a 0%, #2d1a0a 50%, #1a1410 100%)",
    accentGlow: "rgba(249,115,22,0.3)",
  },
  {
    id: "jacket",
    emoji: "🧥",
    gifUrl: "https://res.cloudinary.com/djoixgojj/image/upload/v1779204050/shirt-embroidery_bisqry.webp",
    product: "Premium Jacket Back",
    title: "Full Back Club",
    client: "Fan Apparel",
    stitches: "34,400 stitches",
    colors: "12 colors",
    density: 95,
    clientTag: "100%",
    bgGradient: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d2137 100%)",
    accentGlow: "rgba(37,99,235,0.25)",
  },
];

function EmbroideryCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % SHOWCASE_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const slide = SHOWCASE_SLIDES[current];

  return (
    <div
      className="relative flex items-start justify-center lg:h-[540px] pt-8 lg:pt-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${slide.accentGlow}08, transparent 70%)`,
        }}
      />

      {/* Mobile: GIF only — auto-sized to image */}
      <div className="relative z-20 w-full max-w-[360px] sm:max-w-[440px] lg:hidden mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{ background: slide.bgGradient }}
          >
            {slide.gifUrl ? (
              <img src={slide.gifUrl} alt={slide.product} className="w-full h-auto" />
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center text-6xl">{slide.emoji}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop: full card with stats */}
      <div className="hidden lg:block relative z-20 w-[520px] h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-[var(--bg)]/90 backdrop-blur-xl rounded-3xl
              shadow-[0_8px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]
              p-7 border border-[var(--border)]"
          >
          <div
            className="relative h-72 rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
            style={{ background: slide.bgGradient }}
          >
            <div className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,#fff 2px,#fff 3px),repeating-linear-gradient(45deg,transparent,transparent 3px,#fff 3px,#fff 4px)`,
                backgroundSize: "6px 6px, 6px 6px, 12px 12px",
              }}
            />
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 text-center w-full h-full flex flex-col items-center justify-center">
              {slide.gifUrl ? (
                <img src={slide.gifUrl} alt={slide.product} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-7xl mb-1">{slide.emoji}</div>
              )}
            </motion.div>
            <div className="absolute top-0 left-[15%] w-16 h-full bg-gradient-to-b from-white/10 to-transparent rotate-12 pointer-events-none z-20" />
            <div className="absolute top-3 left-3 z-20">
              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md text-white/90 border border-white/15 bg-white/10">{slide.clientTag}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center text-white text-sm font-bold shadow-[0_4px_12px_rgba(37,99,235,0.3)]">✦</div>
            <div>
              <div className="text-[14px] font-bold text-[var(--txt)]">{slide.title}</div>
              <div className="text-[11px] text-[var(--txt3)]">{slide.client} · {slide.stitches}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-[var(--txt3)] w-24">Stitch density</span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--elevated2)] overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#F97316]"
                initial={{ width: "0%" }} animate={{ width: `${slide.density}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }} />
            </div>
            <span className="text-[10px] font-bold text-[var(--txt)]">{slide.density}%</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--txt3)]">Turnaround</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] font-semibold border border-[#16A34A]/20">⚡ Standard 6h-12h</span>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`tags-${slide.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:block"
        >
          <motion.div
            initial={{ x: 30, y: -10 }}
            animate={{ x: 0, y: [-8, -12, -8], rotate: [0, 1, 0] }}
            transition={{
              x: { duration: 0.5, delay: 0.1 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute z-30 top-[10%] right-[4%] bg-white
              rounded-2xl shadow-lg px-4 py-3
              border border-gray-100 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
              <span className="text-[#2563EB] text-sm">🏢</span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--txt)]">{slide.client}</div>
              <div className="text-[10px] text-[var(--txt3)]">{slide.colors}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, y: 20 }}
            animate={{ x: 0, y: [0, -6, 0], rotate: [0, -1, 0] }}
            transition={{
              x: { duration: 0.5, delay: 0.2 },
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute z-30 bottom-[22%] left-[2%] bg-white
              rounded-2xl shadow-lg px-4 py-3
              border border-gray-100 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
              <span className="text-[#F97316] text-sm">🧵</span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--txt)]">{slide.product}</div>
              <div className="text-[10px] text-[var(--txt3)]">{slide.title}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 15, y: 15 }}
            animate={{ x: 0, y: [0, -5, 0], rotate: [0, 1, 0] }}
            transition={{
              x: { duration: 0.5, delay: 0.3 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute z-30 bottom-[28%] right-[8%] bg-white
              rounded-2xl shadow-lg px-4 py-3
              border border-gray-100 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#16A34A]/10 flex items-center justify-center">
              <span className="text-[#16A34A] text-sm">📐</span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--txt)]">{slide.stitches}</div>
              <div className="text-[10px] text-[var(--txt3)]">{slide.density}% density</div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="hidden lg:flex absolute bottom-1 left-1/2 -translate-x-1/2 z-40 gap-0.5">
        {SHOWCASE_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === current ? 20 : 7,
              height: 7,
              background: i === current
                ? "linear-gradient(90deg, #2563EB, #F97316)"
                : "var(--elevated2)",
              boxShadow: i === current ? "0 0 6px rgba(37,99,235,0.4)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Rotating Service Text ────────────────────────────────
const SERVICES_ROTATE = [
  {
    id: "digitizing",
    label: "Embroidery Digitizing",
    icon: "🧵",
    gradient: "from-[#2563EB] via-[#7C3AED] to-[#F97316]",
    glow: "rgba(37,99,235,0.3)",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
  },
  {
    id: "vector",
    label: "Vector Art",
    icon: "✏️",
    gradient: "from-[#2563EB] via-[#7C3AED] to-[#F97316]",
    glow: "rgba(249,115,22,0.3)",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
  },
  {
    id: "patches",
    label: "Patch Design",
    icon: "🏷️",
    gradient: "from-[#2563EB] via-[#7C3AED] to-[#F97316]",
    glow: "rgba(22,163,74,0.3)",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.2)",
  },
];

function RotatingServiceText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SERVICES_ROTATE.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const svc = SERVICES_ROTATE[index];

  return (
    <div className="mb-4 sm:mb-6 h-[70px] sm:h-[90px] md:h-[110px] flex items-center justify-center lg:justify-start">
      <AnimatePresence mode="wait">
        <motion.div
          key={svc.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center"
        >
          <span
            className={`font-syne font-extrabold text-[clamp(24px,7vw,62px)] leading-[1.1] bg-gradient-to-r ${svc.gradient} bg-clip-text text-transparent`}
          >
            {svc.label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TestimonialSlider({ testimonials }: { testimonials: any[] }) {
  return (
    <div>
      {/* Drag-to-scroll track */}
      <div className="relative">
        <div
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-2 px-1 cursor-grab active:cursor-grabbing"
        >
          {testimonials.map((t: any, i: number) => (
            <div
              key={i}
              className="w-[82vw] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 snap-start"
            >
            <div className="bg-[var(--surface)] border border-[var(--border)]
              rounded-2xl p-4 sm:p-5 h-full hover:border-[var(--border3)] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} className={si < t.stars ? "text-[#F97316]" : "text-[var(--border2)]"}>★</span>
                  ))}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 font-medium">
                  ✓ Verified
                </span>
              </div>
              <p className="text-sm text-[var(--txt2)] leading-relaxed mb-4 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#F97316]
                  flex items-center justify-center text-sm font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-[var(--txt3)]">{t.company} · {t.country} · {t.date}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}

interface LandingProps {
  services: any[];
  process: any[];
  testimonials: any[];
  faqs: any[];
  floatingCards: { title: string; label: string; icon: string }[];
  beforeAfter: { source: { url: string; label: string }; output: { url: string; label: string } };
}

export function LandingClient({ services, process, testimonials, faqs, floatingCards, beforeAfter }: LandingProps) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-hidden">
      {/* ── HERO — Apple-style premium ──────────────────── */}
      <section className="relative min-h-0 flex items-center overflow-hidden pb-6 sm:pb-10 lg:pb-0">
        <GradientOrb color="#2563EB" size={700} className="-top-[25%] -left-[15%]" style={{ opacity: 0.15 }} />
        <GradientOrb color="#F97316" size={500} className="-bottom-[15%] right-[0%]" style={{ opacity: 0.1 }} />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 w-full pt-4 sm:pt-6">
          {/* Floating cards ticker — aligned with content */}
          <div className="relative overflow-hidden mb-2 sm:mb-3 -mx-4 sm:-mx-6 md:mx-0">
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{ background: "linear-gradient(90deg, var(--bg), transparent)" }} />
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{ background: "linear-gradient(270deg, var(--bg), transparent)" }} />
            <div className="flex gap-3 animate-marquee w-max py-0.5 sm:py-1 px-4 sm:px-6 md:px-0">
              {[...floatingCards, ...floatingCards, ...floatingCards, ...floatingCards].map((card, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg
                    bg-[var(--elevated)]/80 border border-[var(--border2)] whitespace-nowrap"
                >
                  <span className="text-lg">{card.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-[var(--txt)] leading-tight">{card.title}</div>
                    <div className="text-[11px] text-[var(--txt3)] leading-tight">{card.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center">

            {/* ── LEFT: Content ──────────────────────────── */}
            <div className="relative z-10 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 mb-6 text-xs sm:text-sm font-medium text-[#2563EB] bg-[#2563EB]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#2563EB]/20"
              >
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                500+ clients · ★ 4.9 rating · 4hr-12hr delivery
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="font-syne font-extrabold text-[clamp(36px,8vw,68px)] leading-[1.05] mb-4 sm:mb-5 -tracking-[0.02em] text-[var(--txt)]"
              >
                Your Trusted Source For
              </motion.h1>

              <RotatingServiceText />

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm sm:text-base text-[var(--txt2)] leading-relaxed mt-4 mb-3 sm:mb-6 max-w-[480px] mx-auto lg:mx-0"
              >
                Professional embroidery digitizing from{" "}
                <strong className="text-[#F97316] font-semibold">$7</strong>.
                Delivered in 3–24 hours with free revisions, free formats, and free rush turnaround.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-2 sm:gap-3 flex-nowrap mb-4 sm:mb-6 justify-center lg:justify-start"
              >
                <Link href="/client/new-order">
                  <Button variant="grad" size="lg" className="shadow-[0_4px_20px_rgba(37,99,235,0.25)] text-base px-6 py-3">
                    Start Your Order →
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="ghost" size="lg">
                    View Portfolio
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost2" size="lg" className="hidden sm:inline-flex">
                    Get Quote
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 sm:gap-x-8 gap-y-2 text-xs sm:text-sm text-[var(--txt3)]"
              >
                <span>✓ 3–24h delivery</span>
                <span>✓ Free revisions</span>
                <span>✓ All formats</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-sm font-medium">
                  💳 Pay only when satisfied
                </span>
              </motion.div>
            </div>

            {/* ── RIGHT: Rotating 3D Showcase Carousel ──────── */}
            <EmbroideryCarousel />
          </div>
        </div>
      </section>

      {/* ── OPERATIONAL TRUST STRIP ─────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/3 via-transparent to-[#F97316]/3" />
          <div className="relative z-10">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Operations Live
              </span>
              <h2 className="font-syne font-extrabold text-2xl sm:text-3xl mb-2">Built on Trust & Speed</h2>
              <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">Every order backed by real guarantees. No hidden terms. No surprises.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { icon: "⚡", value: "3–24h",  label: "Average Delivery", sub: "Rush in 6h, urgent in 3h" },
                { icon: "🔄", value: "1.2",    label: "Avg Revisions", sub: "98% first-pass approval" },
                { icon: "💬", value: "< 1hr",  label: "Response Time", sub: "Support 7 days a week" },
                { icon: "⭐", value: "4.9/5",  label: "Client Rating", sub: "500+ verified reviews" },
                { icon: "🛡️", value: "100%",   label: "Satisfaction Guarantee", sub: "Free revisions until perfect" },
                { icon: "🌍", value: "100+",   label: "Countries Served", sub: "5,000+ orders delivered" },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-2xl bg-[var(--bg)]/60 border border-[var(--border)] lift">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-syne font-bold text-lg sm:text-xl mb-0.5" style={{ color: "var(--txt)" }}>
                    {s.value}
                  </div>
                  <div className="text-2xs font-semibold text-[var(--txt2)] mb-0.5">{s.label}</div>
                  <div className="text-2xs text-[var(--txt3)]">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO PREVIEW ─────────────────────────────────── */}
      <PortfolioPreview />

      {/* ── FREE DESIGNS PREVIEW ──────────────────────────── */}
      <FreeDesignsPreview />

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <AnimatedSection id="process" className="py-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative bg-gradient-to-br from-[#F97316] via-[#EA580C] to-[#9A3412] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden">
            {/* Glow orb */}
            <div className="absolute -top-[20%] -left-[10%] w-[300px] h-[300px] rounded-full bg-[#FBBF24] opacity-[0.10] blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs
                  font-semibold uppercase tracking-wider mb-4
                  bg-white/15 text-white border border-white/20">
                  How It Works
                </span>
                <h2 className="font-syne font-extrabold text-2xl md:text-4xl text-white mb-2">
                  Order in Minutes, Delivered Fast
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {process.map((step: any, i: number) => {
                  const phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];
                  return (
                    <motion.div
                      key={step.n}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="relative text-center bg-white rounded-2xl p-5 sm:p-6 shadow-lg
                        hover:shadow-xl transition-all duration-300"
                    >
                      {/* Connector arrow — between cards on lg+ */}
                      {i < process.length - 1 && (
                        <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10
                          w-6 h-6 rounded-full bg-[#F97316] text-white items-center justify-center text-xs font-bold shadow-md">
                          →
                        </div>
                      )}

                      <div className="font-syne font-extrabold text-xs tracking-[0.2em] uppercase mb-3 text-[#F97316]">
                        {phases[i]}
                      </div>
                      <div className="w-[52px] h-[52px] rounded-full mx-auto mb-3
                        bg-[#FFF7ED] border-2 border-[#F97316]/30 flex items-center justify-center text-[22px]">
                        {step.icon}
                      </div>
                      <h3 className="font-syne font-bold text-base mb-1.5 text-[var(--txt)]">{step.title}</h3>
                      <p className="text-sm text-[var(--txt2)] leading-relaxed">{step.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <AnimatedSection id="services" className="py-16 md:py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <SectionHeading
            label="Services"
            title="Everything You Need,"
            gradientTitle="One Platform"
            description="Embroidery digitizing, vector art, patch design — all with free revisions and lightning-fast delivery."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((svc: any) => (
              <div
                key={svc.title}
                className="relative bg-[var(--surface)] rounded-2xl p-5 sm:p-6 md:p-8 overflow-hidden
                  transition-all duration-400 ease-out
                  hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]
                  border border-[var(--border)] hover:border-[var(--border3)] group"
              >
                <GradientOrb color={svc.color} size={160} className="-top-10 -right-10" />

                <div className="text-[40px] mb-4">{svc.emoji}</div>
                <h3
                  className="font-syne font-bold text-xl mb-2.5 bg-clip-text text-transparent"
                  style={{ backgroundImage: svc.grad }}
                >
                  {svc.title}
                </h3>
                <p className="text-sm text-[var(--txt2)] leading-relaxed mb-6">{svc.desc}</p>

                <div className="flex flex-col gap-1.5 mb-5">
                  {svc.tiers.map((t: any) => (
                    <div
                      key={t.size}
                      className="flex justify-between items-center px-3 py-2
                        bg-[var(--border)] rounded-lg border"
                      style={{ borderColor: `${svc.color}12` }}
                    >
                      <span className="text-xs text-[var(--txt2)]">{t.size}</span>
                      <span className="font-syne font-extrabold text-lg" style={{ color: svc.color }}>
                        {t.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 flex-wrap mb-5">
                  {["♾️ Free Revisions", "🔄 Free Formats"].map((b) => (
                    <span
                      key={b}
                      className="text-[11px] px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${svc.color}12`,
                        color: svc.color,
                        borderColor: `${svc.color}25`,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <Link href="/register" className="w-full">
                  <Button variant="grad" size="md" className="w-full justify-center"
                    style={{ background: svc.grad }}>
                    Order {svc.title.split(" ")[0]} →
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Free services banner */}
          <div className="mt-7 bg-gradient-to-r from-[#16A34A]/5 to-[#2563EB]/5
            border border-[#16A34A]/15 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6 flex-wrap">
              {[
                ["🔄", "Format Conversion", "Always FREE"],
                ["♾️", "Unlimited Revisions", "Always FREE"],
                ["⚡", "Rush 6h", "Always FREE"],
                ["🔥", "Urgent 3h", "Always FREE"],
              ].map(([emoji, label, status]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--txt)]">{label}</div>
                    <div className="text-[11px] text-[#16A34A] font-bold">{status}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/register">
              <Button variant="cyan" size="sm">Start Free →</Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* ── ALWAYS FREE ──────────────────────────────────────── */}
      <AnimatedSection className="py-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative bg-gradient-to-br from-[#16A34A] via-[#15803D] to-[#14532D] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden">
            {/* Glow orb */}
            <div className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] rounded-full bg-[#4ADE80] opacity-[0.10] blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs
                  font-semibold uppercase tracking-wider mb-4
                  bg-white/15 text-white border border-white/20">
                  Always Included
                </span>
                <h2 className="font-syne font-extrabold text-2xl md:text-4xl text-white mb-2">
                  Free With Every Order
                </h2>
                <p className="text-white/70 text-sm max-w-md mx-auto">
                  No hidden fees. No surprises. Everything below comes standard.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  ["🔄", "Format Conversion", "Always FREE"],
                  ["♾️", "Unlimited Revisions", "Always FREE"],
                  ["⚡", "Rush 6h Delivery", "Always FREE"],
                  ["🔥", "Urgent 3h Delivery", "Always FREE"],
                ].map(([emoji, label, status], i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-lg
                      hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4ADE80] to-[#16A34A]" />
                    <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border-2 border-[#16A34A]/20 flex items-center justify-center text-2xl mb-4">
                      {emoji}
                    </div>
                    <div className="text-sm font-bold text-[var(--txt)] mb-1">{label}</div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                      {status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── FROM ARTWORK TO STITCH FILE ──────────────────────── */}
      <section className="pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-10">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
              bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4">
              From artwork to stitch file
            </span>
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl md:text-4xl mb-3 leading-[1.15]">
              Better trims, fills, and stitch paths.
            </h2>
            <p className="text-[var(--txt2)] text-sm max-w-lg mx-auto">
              Every file is built with correct underlay, optimized stitch density, clean routing, and production logic for commercial embroidery machines.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {[
              { emoji: "🧵", label: "Machine-ready stitch paths" },
              { emoji: "🎯", label: "Before / after proofing" },
              { emoji: "✨", label: "Clean trims & routing" },
              { emoji: "⚡", label: "Commercial embroidery flow" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#2563EB]/20 transition-all duration-300"
              >
                <span className="text-2xl mb-2">{item.emoji}</span>
                <span className="text-xs font-medium text-[var(--txt2)]">{item.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Source → Output visual */}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider px-4 pt-4 pb-2">Source</div>
                <div className="aspect-[3/2] flex items-center justify-center bg-[var(--elevated)] mx-2 mb-2 rounded-lg overflow-hidden">
                  <img
                    src={beforeAfter.source.url}
                    alt="Original artwork"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-[var(--txt3)] px-4 pb-4 text-center">{beforeAfter.source.label}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#F97316] flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0 rotate-90 sm:rotate-0">
                →
              </div>
              <div className="flex-1 bg-gradient-to-br from-[#2563EB]/5 to-[#F97316]/5 border border-[#2563EB]/20 rounded-2xl overflow-hidden">
                <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider px-4 pt-4 pb-2">Output</div>
                <div className="aspect-[3/2] flex items-center justify-center bg-[var(--elevated)]/50 mx-2 mb-2 rounded-lg overflow-hidden">
                  <img
                    src={beforeAfter.output.url}
                    alt="Digitized result"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-[var(--txt3)] px-4 pb-4 text-center">{beforeAfter.output.label}</div>
              </div>
            </div>
            <p className="text-xs text-[var(--txt2)] mt-4 text-center">
              JPG/PNG approval before final files — better trims, fills, and stitch paths.
            </p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <AnimatedSection className="py-16 md:py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <SectionHeading
            label="Testimonials"
            labelColor="green"
            title="Loved by"
            gradientTitle="500+ Clients"
          />

          {/* Testimonials Slider */}
          <TestimonialSlider testimonials={testimonials} />
        </div>
      </AnimatedSection>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <AnimatedSection className="py-0">
        <div className="max-w-[780px] mx-auto px-4 sm:px-6">
          <SectionHeading
            label="FAQ"
            title="Common Questions"
          />

          <div className="flex flex-col gap-2">
            {faqs.map((faq: any, i: number) => (
              <motion.div
                key={i}
                className="bg-[var(--surface)] border rounded-xl overflow-hidden transition-colors"
                style={{
                  borderColor: openFAQ === i
                    ? "rgba(37,99,235,0.3)"
                    : "var(--border)",
                }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full px-5 py-4 flex justify-between items-center
                    bg-transparent border-none cursor-pointer text-left"
                >
                  <span
                    className="text-sm font-semibold transition-colors"
                    style={{ color: openFAQ === i ? "#2563EB" : "var(--txt)" }}
                  >
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: openFAQ === i ? 45 : 0 }}
                    className="text-[#2563EB] text-xl flex-shrink-0 ml-4"
                  >
                    +
                  </motion.span>
                </button>
                {openFAQ === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-[var(--txt2)] leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <AnimatedSection className="py-16 md:py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative bg-gradient-to-br from-[#2563EB]/10 to-[#F97316]/5
            border border-[#2563EB]/20 rounded-2xl sm:rounded-3xl px-6 py-12 sm:py-16 md:p-16 lg:p-20 text-center overflow-hidden">
            <GradientOrb color="#2563EB" size={400} className="-top-[30%] left-[20%]" />
            <GradientOrb color="#F97316" size={300} className="-bottom-[20%] right-[15%]" />

            <div className="relative z-10">
              <div className="text-[56px] mb-4">🧵</div>
              <h2 className="font-syne font-extrabold text-[clamp(32px,4vw,56px)] mb-4 leading-[1.08]">
                Ready to get started?
              </h2>
              <p className="text-lg text-[var(--txt2)] mb-10 max-w-[480px] mx-auto leading-relaxed">
                From <strong className="text-[#F97316]">$7</strong> per design.
                Free revisions. Free formats. Delivered in hours.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/client/new-order">
                  <Button variant="grad" size="lg" className="shadow-[0_4px_20px_rgba(37,99,235,0.25)] text-base px-6 py-3">
                    Start Your Order →
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="ghost" size="lg">
                    View Portfolio
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost2" size="lg">
                    Get Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

    </div>
  );
}
