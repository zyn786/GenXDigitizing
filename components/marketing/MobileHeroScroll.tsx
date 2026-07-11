"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Upload, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";

/* ── Device + accessibility detection ──────────── */
function usePrefs() {
  const [state, setState] = useState({ tier: "high" as "high" | "low", reduced: false, mounted: false });
  useEffect(() => {
    const mem = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    const tier = (mem && mem <= 3) || cores <= 3 ? "low" : "high";
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setState({ tier, reduced: mq.matches, mounted: true });
    const h = (e: MediaQueryListEvent) => setState((s) => ({ ...s, reduced: e.matches }));
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return state;
}

/* ── Constants ─────────────────────────────────── */
const ROTATING_WORDS = ["Just Quality.", "No Auto-Trace.", "Pure Craft."];
const SERVICE_CARDS = [
  { emoji: "🧵", title: "Embroidery Digitizing", label: "DST / PES Ready" },
  { emoji: "✏️", title: "Vector Artwork", label: "AI / EPS / SVG" },
  { emoji: "🏷️", title: "Custom Patches", label: "Merrow / PVC / Woven" },
  { emoji: "🧢", title: "3D Puff Caps", label: "Raised Stitch Finish" },
  { emoji: "🧥", title: "Jacket Back", label: "Stitch Finish" },
  { emoji: "👕", title: "Left Chest", label: "Small Logo Digitizing" },
];

/* ── Simple version (reduced motion) ───────────── */
function SimpleHero() {
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="relative h-[100dvh] flex flex-col items-center justify-center bg-black text-white px-4">
        <div className="absolute inset-0 z-0">
          <Image src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,f_auto,w_600/v1781040748/hero-bg-desktop_ogydtd.jpg" alt="" fill className="object-cover" priority unoptimized sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/75" />
        </div>
        {/* Marquee — full width, outside content wrapper */}
        <div className="w-full overflow-hidden mb-3 pt-6 relative z-10">
          <div className="flex gap-2 animate-marquee w-max">
            {[...SERVICE_CARDS, ...SERVICE_CARDS].map((card, i) => (
              <div key={`${card.title}-${i}`} className="flex items-center gap-2 bg-white/15 border border-white/10 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                <span className="text-base">{card.emoji}</span>
                <div><div className="text-[10px] font-semibold text-white whitespace-nowrap">{card.title}</div><div className="text-[8px] text-white/40 whitespace-nowrap">{card.label}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-center w-full max-w-[500px]">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 mb-3 text-[11px] font-medium bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-white">
            <span className="font-bold">{SITE_STATS.avgRating}</span>
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} fill="#F59E0B" stroke="none" />)}
            <span className="text-white/25">|</span>
            <span>{fmtPlus(SITE_STATS.ordersCompleted)} Orders</span>
            <span className="text-white/25">|</span>
            <span className="text-[#4ADE80] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />Free Revisions</span>
          </div>
          <h1 className="font-syne text-[clamp(38px,10vw,66px)] leading-[1.08] mb-3 text-white">
            <span className="block font-light tracking-wide">Real Digitizers.</span>
            <span className="relative block font-bold tracking-tight" style={{ minHeight: "1.1em" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="block bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FBBF24] bg-clip-text text-transparent"
                  style={{ backgroundSize: "200% auto", animation: "gradient-shimmer 3s ease-in-out infinite" } as React.CSSProperties}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="text-[13px] text-white/80 mb-5 px-2">Every file hand-digitized by experienced professionals. Clean sew-outs. Zero thread breaks.</p>
          <div className="flex flex-row gap-2 w-full mb-3 px-0">
            <Link href="/upload" className="flex-1"><Button variant="grad" size="md" className="w-full !rounded-2xl !font-bold !text-sm !py-3" rightIcon={<Upload size={14} />}>Get Free Quote</Button></Link>
            <a href="https://wa.me/18302102135" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="grad" size="md" className="w-full !rounded-2xl !font-semibold !text-sm !py-3 !bg-[#25D366] hover:!bg-[#22C55E]" rightIcon={
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              }>WhatsApp</Button>
            </a>
          </div>
          <p className="text-[11px] text-white/50">✓ Free quote · ✓ No payment required · ✓ Pay only after preview approval</p>
        </div>
      </div>
    </div>
  );
}

/* ── Full scroll version ───────────────────────── */
export function MobileHeroScroll() {
  const { tier, reduced, mounted } = usePrefs();
  const isLowEnd = tier === "low";

  // Device-agnostic: use vh for scroll range
  const SCROLL_RANGE = typeof window !== "undefined" ? window.innerHeight : 800;
  const { scrollY } = useScroll();
  const p = useTransform(scrollY, [0, SCROLL_RANGE], [0, 1], { clamp: true });

  // Background fades to transparent as user scrolls
  const bgAlpha = useTransform(p, [0, 0.7], [1, 0.04]);

  // Bottom edge blend
  const bottomFadeAlpha = useTransform(p, [0.05, 0.35], [0, 1]);

  // Rotating words
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;
  if (reduced) return <SimpleHero />;

  return (
    <div className="relative overflow-x-hidden">
      {/* ══════ HERO ══════ */}
      <div className="relative z-10 h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background video + poster */}
        <motion.div className="absolute inset-0" style={{ opacity: bgAlpha }}>
          <Image
            src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,f_auto,w_600/v1781040748/hero-bg-desktop_ogydtd.jpg"
            alt="" fill className="object-cover" priority unoptimized sizes="100vw"
          />
          {!isLowEnd && (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              muted loop playsInline autoPlay
              poster="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,so_0,w_600/v1781040748/hero-bg-desktop_ogydtd.jpg"
              width={1080} height={1920}
            >
              <source src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:good,w_750/v1781040746/hero-bg-mobile_yz4bkh.webm" type="video/webm" />
              <source src="https://res.cloudinary.com/djoixgojj/video/upload/vc_h264,q_auto:good,w_750/v1781040746/hero-bg-mobile_yz4bkh.mp4" type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />
        </motion.div>

        {/* Bottom fade — appears on scroll */}
        <motion.div
          className="absolute bottom-0 inset-x-0 h-[10%] z-[5] pointer-events-none"
          style={{ opacity: bottomFadeAlpha, background: "linear-gradient(to bottom, transparent, var(--bg, #0f0f0f))" }}
        />

        {/* Content — always visible, no fade */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-8 w-full max-w-[500px] mx-auto">
          {/* Service cards */}
          <div className="w-screen -mx-4 overflow-hidden mb-2 pt-8">
            <div className="flex gap-2 animate-marquee w-max pl-4">
              {[...SERVICE_CARDS, ...SERVICE_CARDS].map((card, i) => (
                <div key={`${card.title}-${i}`} className="flex items-center gap-2 bg-white/15 border border-white/10 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                  <span className="text-base flex-shrink-0">{card.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white whitespace-nowrap">{card.title}</div>
                    <div className="text-[8px] text-white/40 whitespace-nowrap">{card.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust bar */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 mt-2 mb-3 text-[11px] font-medium bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-white">
            <span className="flex items-center gap-0.5">
              <span className="font-bold">{SITE_STATS.avgRating}</span>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} fill="#F59E0B" stroke="none" />)}
            </span>
            <span className="text-white/25">|</span>
            <span className="text-white/85"><span className="font-semibold">{fmtPlus(SITE_STATS.ordersCompleted)}</span> Orders</span>
            <span className="text-white/25">|</span>
            <span className="text-[#4ADE80] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />Free Revisions</span>
          </div>

          {/* Heading */}
          <h1 className="font-syne text-[clamp(38px,10vw,66px)] leading-[1.08] mb-3 text-white">
            <span className="block font-light tracking-wide">Real Digitizers.</span>
            <span className="relative block font-bold tracking-tight" style={{ minHeight: "1.1em" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={isLowEnd ? { opacity: 0, y: 12 } : { opacity: 0, y: 16, filter: "blur(3px)" }}
                  animate={isLowEnd ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={isLowEnd ? { opacity: 0, y: -12 } : { opacity: 0, y: -16, filter: "blur(3px)" }}
                  transition={{ duration: isLowEnd ? 0.2 : 0.35, ease: "easeInOut" }}
                  className="block bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FBBF24] bg-clip-text text-transparent"
                  style={{ backgroundSize: "200% auto", animation: "gradient-shimmer 3s ease-in-out infinite" } as React.CSSProperties}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* CTA buttons */}
          <div className="flex flex-row gap-2 w-full mb-3">
            <Link href="/register" className="flex-1">
              <Button variant="grad" size="md" className="w-full !h-[44px] !rounded-2xl !font-semibold !text-sm !bg-white/10 hover:!bg-white/20 !border !border-white/20 !text-white">Sign Up / Login</Button>
            </Link>
            <a href="https://wa.me/18302102135" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="grad" size="md" className="w-full !h-[44px] !rounded-2xl !font-semibold !text-sm !bg-[#25D366] hover:!bg-[#22C55E]" rightIcon={
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              }>WhatsApp</Button>
            </a>
          </div>

          {/* Reassurance */}
          <p className="text-[11px] text-white/50">
            ✓ Free quote · ✓ No payment required · ✓ Pay only after preview approval
          </p>
        </div>
      </div>
    </div>
  );
}
