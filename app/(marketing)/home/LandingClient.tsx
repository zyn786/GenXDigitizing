"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Upload,
  Check,
  Shield,
  Zap,
  GripHorizontal,
  Sparkles,
  Clock,
  RefreshCw,
  Globe,
  FileCheck,
  Heart,
  PenTool,
  Eye,
  Scissors,
  ShoppingCart,
  Layers,
  Download,
  Trophy,
} from "lucide-react";
import { SITE_INFO, SITE_CLAIMS, SITE_CLAIM_LIST } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import {
  TrustStatsSection,
  MIN_LIVE_COUNT,
  type LiveStats,
} from "@/components/shared/TrustStatsSection";
import { SewOutGuarantee } from "@/components/marketing/SewOutGuarantee";
import { MobileHeroScroll } from "@/components/marketing/MobileHeroScroll";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";

import dynamic from "next/dynamic";

const PortfolioPreview = dynamic(
  () =>
    import("@/components/portfolio/PortfolioPreview").then((m) => ({
      default: m.PortfolioPreview,
    })),
  { ssr: false, loading: () => <div className="py-16" /> }
);

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const SERVICE_CARDS = [
  { emoji: "🧵", title: "Embroidery Digitizing", label: "DST / PES Ready" },
  { emoji: "✏️", title: "Vector Artwork", label: "AI / EPS / SVG" },
  { emoji: "🏷️", title: "Custom Patches", label: "Merrow / PVC / Woven" },
  { emoji: "🧢", title: "3D Puff Caps", label: "Raised Stitch Finish" },
  { emoji: "🧥", title: "Jacket Back", label: "Stitch Finish" },
  { emoji: "👕", title: "Left Chest", label: "Small Logo Digitizing" },
];

const SERVICES_GRID = [
  { emoji: "🧢", label: "Cap Digitizing", href: "/services/cap-digitizing" },
  { emoji: "👕", label: "Left Chest", href: "/services/left-chest-digitizing" },
  { emoji: "🧥", label: "Jacket Back", href: "/services/jacket-back-digitizing" },
  { emoji: "🎩", label: "3D Puff", href: "/services/3d-puff-digitizing" },
  { emoji: "🏷️", label: "Patches", href: "/services/custom-patches" },
  { emoji: "✏️", label: "Vector Conversion", href: "/services/vector-art-conversion" },
  { emoji: "🧣", label: "Beanies", href: "/services/beanies-digitizing" },
  { emoji: "🪣", label: "Towels", href: "/services/towels-digitizing" },
  { emoji: "🎒", label: "Bags", href: "/services/bags-digitizing" },
  { emoji: "👔", label: "Uniforms", href: "/services/uniforms-digitizing" },
  { emoji: "⚽", label: "Sportswear", href: "/services/sportswear-digitizing" },
  { emoji: "🏢", label: "Corporate Apparel", href: "/services/corporate-apparel-digitizing" },
];

const WHY_CHOOSE_US = [
  {
    icon: PenTool,
    title: "100% Manual Digitizing",
    desc: "Every stitch path is hand-placed by experienced digitzers. No auto-trace shortcuts. Files optimized for your specific fabric and machine.",
    stat: "Manual only",
    color: "#2563EB",
  },
  {
    icon: Zap,
    title: "3–24 Hour Turnaround",
    desc: "Standard delivery in 24 hours. Rush in 6. Urgent in 3. All speed tiers included at no extra charge — unlike competitors who charge $10+ for rush.",
    stat: "3–24h",
    color: "#F97316",
  },
  {
    icon: RefreshCw,
    title: "Unlimited Free Revisions",
    desc: "Not satisfied? We keep going. No caps. No extra fees. We'll revise until it runs perfectly on your machine.",
    stat: "Unlimited",
    color: "#16A34A",
  },
  {
    icon: Shield,
    title: "Pay When Satisfied",
    desc: "Review your proof first. Approve the quality. Then pay. If we can't get it right after reasonable revisions, full refund — no questions asked.",
    stat: "Risk-free",
    color: "#7C3AED",
  },
  {
    icon: Download,
    title: "Every Format. Zero Cost.",
    desc: "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — you name it. We deliver in whatever format your machines need. Format conversion always free.",
    stat: "8+ formats",
    color: "#06B6D4",
  },
  {
    icon: Heart,
    title: "Machine-Tested Quality",
    desc: "Every file is reviewed by an ex-production-floor QC specialist before delivery. Stitch angles checked. Density verified. Pull compensation dialed in.",
    stat: "100% checked",
    color: "#DC2626",
  },
];

const SEWOUT_SHOWCASE = [
  {
    label: "Cap Embroidery",
    webpUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/cap-embroidery_sjxoep.webp",
    gifUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/cap-embroidery_sjxoep.gif",
    alt: "Professional cap embroidery digitizing result — clean stitch-out on curved cap surface",
  },
  {
    label: "Jacket Back",
    webpUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779207170/jacket-embroidery_ycfnqh.webp",
    gifUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779207170/jacket-embroidery_ycfnqh.gif",
    alt: "Large-format jacket back embroidery — crisp detail on complex design",
  },
  {
    label: "Left Chest",
    webpUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/shirt-embroidery_bisqry.webp",
    gifUrl: null, // no GIF version available
    alt: "Clean left chest logo embroidery on professional shirt",
  },
];

const BEFORE_AFTER_SETS = [
  {
    label: "Digitizing",
    beforeUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1779288234/Before-5_upqe91.webp",
    afterUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1779288234/After-5_hod7v0.webp",
    beforeAlt: "Original artwork before digitizing",
    afterAlt: "Digitized embroidery file with stitch paths",
  },
  {
    label: "Vector Art",
    beforeUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780366590/Artboard_1_ag0ycx.webp",
    afterUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780366590/Artboard_1_2_uhntgw.webp",
    beforeAlt: "Raster image before vector conversion",
    afterAlt: "Clean vector art output",
  },
  {
    label: "Patch Design",
    beforeUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780368066/Untitled-1_ua0tor.webp",
    afterUrl:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780368068/Untitleduu-1_s7qc6c.webp",
    beforeAlt: "Patch concept before digitizing",
    afterAlt: "Production-ready patch file",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Quality",
    manual: "Clean, production-grade stitch paths",
    auto: "Jagged paths, uneven edges",
  },
  {
    feature: "Stitch Pathing",
    manual: "Optimized for fabric type and curve",
    auto: "Generic algorithm, ignores fabric",
  },
  {
    feature: "Density Control",
    manual: "Adjusted per material and design",
    auto: "One-size-fits-all density",
  },
  { feature: "Small Text", manual: "Sharp, readable at 5mm+", auto: "Blurry, often illegible" },
  {
    feature: "Production Reliability",
    manual: "Runs clean, minimal thread breaks",
    auto: "Frequent breaks, registration errors",
  },
  {
    feature: "Trims & Jumps",
    manual: "Minimal, efficient path planning",
    auto: "Excessive, wastes thread and time",
  },
];

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Upload Design",
    desc: "Send your logo or artwork with size and placement details.",
    icon: "📤",
  },
  {
    n: "02",
    title: "We Digitize",
    desc: "Hand-digitized by experienced professionals. Stitch paths, density, underlay — all optimized for your fabric.",
    icon: "✏️",
  },
  {
    n: "03",
    title: "Approve Proof",
    desc: "Review the digitized proof. Request changes or approve it. Unlimited free revisions until perfect.",
    icon: "✅",
  },
  {
    n: "04",
    title: "Download & Sew",
    desc: "Receive production-ready files in your format. Load onto your machine and sew with confidence.",
    icon: "📥",
  },
];

/* ── Hero Headline Variants (for A/B testing) ──────────── */
const HEADLINES = {
  primary: {
    line1: "Real Digitizers.",
    gradient: "Just Quality.",
    sub: "",
    line1Weight: "font-light",
    gradientWeight: "font-bold",
    line1Tracking: "tracking-wide",
    gradientTracking: "tracking-tight",
  },
  altA: {
    line1: "Stop Wasting Production Hours",
    gradient: "on Bad Embroidery Files",
    sub: "Hand-digitized files optimized for your machine and fabric. Free unlimited revisions until it runs perfectly. Starting at $7. Pay only when satisfied.",
  },
  altB: {
    line1: "Your Design,",
    gradient: "Production-Ready by Tomorrow",
    sub: "Professional digitizing for every application: caps, jackets, polos, 3D puff. 3–24h turnaround. All formats included. No minimums.",
  },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function SectionBadge({
  children,
  color = "#2563EB",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {children}
    </span>
  );
}

function InlineCTA({
  text,
  href,
  variant = "ghost",
}: {
  text: string;
  href: string;
  variant?: "grad" | "ghost";
}) {
  return (
    <Link href={href}>
      <Button
        variant={variant}
        size="sm"
        className="rounded-full"
        rightIcon={<ArrowRight size={13} />}
      >
        {text}
      </Button>
    </Link>
  );
}

/* ── Drag-to-compare slider (for BeforeAfterShowcase section) ──── */
function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeAlt,
  afterAlt,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // ResizeObserver avoids forced reflow from offsetWidth read
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    setPosition(Math.max(2, Math.min(98, (x / rect.width) * 100)));
  }, []);

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      dragging.current = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!dragging.current) return;
        updatePosition("touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX);
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    },
    [updatePosition]
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] cursor-col-resize select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--elevated)] shadow-lg sm:rounded-3xl"
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <Image
        src={beforeUrl}
        alt={beforeAlt}
        fill
        className="object-cover"
        draggable={false}
        priority
        sizes="(max-width: 768px) 100vw, 800px"
        unoptimized
      />
      <div
        className="absolute left-0 top-0 h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <Image
          src={afterUrl}
          alt={afterAlt}
          fill
          className="object-cover"
          style={{ maxWidth: "none" }}
          draggable={false}
          priority
          sizes="(max-width: 768px) 100vw, 800px"
          unoptimized
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-[3px] bg-white shadow-md"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--border)] bg-white shadow-lg">
          <GripHorizontal size={15} className="text-[var(--txt3)]" />
        </div>
      </div>
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white">
        Before
      </span>
      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[10px] font-semibold text-white">
        After
      </span>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/95 px-4 py-1.5 text-xs font-semibold text-[var(--txt)] shadow-sm sm:block">
        ← Drag to compare →
      </div>
    </div>
  );
}

/* ── Sew-out GIF showcase (for Hero section) ──────────────────── */

function SewoutGifShowcase({
  webpUrl,
  gifUrl,
  alt,
}: {
  webpUrl: string;
  gifUrl: string | null;
  alt: string;
}) {
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const hasGif = !!gifUrl;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--elevated)] shadow-lg sm:rounded-3xl">
      {/* Static poster (webp) — always shown, fades out when GIF loads */}
      <Image
        src={webpUrl}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${gifLoaded && hasGif ? "opacity-0" : "opacity-100"}`}
        draggable={false}
        fetchPriority="high"
        width={800}
        height={600}
      />

      {/* Animated GIF overlay */}
      {hasGif && !gifError && (
        <Image
          src={gifUrl!}
          alt={`${alt} — animated sew-out`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${gifLoaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
          onLoad={() => setGifLoaded(true)}
          onError={() => setGifError(true)}
          width={800}
          height={600}
        />
      )}

      {/* Badges */}
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-[#16A34A]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
        {hasGif && !gifError ? "Real Sew-Out" : "Finished Result"}
      </span>

      {!hasGif && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
          Static Preview
        </span>
      )}
    </div>
  );
}

const ROTATING_WORDS = ["Just Quality.", "No Auto-Trace.", "Pure Craft."];

function HeroSection({ stats }: { stats?: LiveStats }) {
  const headline = HEADLINES.primary;
  const [wordIndex, setWordIndex] = useState(0);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Desktop sticky CTA — appears on scroll
  const { scrollY } = useScroll();
  const stickyBtnAlpha = useTransform(scrollY, [300, 600], [0, 1], { clamp: true });

  return (
    <section
      className="relative -mt-[100px] flex min-h-screen flex-col items-center justify-center overflow-hidden pb-6 pt-[100px] sm:pb-8"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 z-0">
        {/* Poster image loads immediately; video deferred until idle */}
        <Image
          src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,f_auto,w_600/v1781040748/hero-bg-desktop_ogydtd.jpg"
          alt="Embroidery digitizing service — professional stitch files"
          fill
          className="object-cover"
          priority
          unoptimized
          sizes="100vw"
        />
        {/* Video lazy-loaded after mount — poster image serves as initial paint */}
        <video
          ref={(el) => {
            if (!el || el.hasChildNodes()) return;
            // Defer source loading to idle callback
            const load = () => {
              el.innerHTML = `
                <source src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:good,w_1200/v1781040748/hero-bg-desktop_ogydtd.webm" type="video/webm" media="(min-width: 640px)">
                <source src="https://res.cloudinary.com/djoixgojj/video/upload/vc_h264,q_auto:good,w_1200/v1781040748/hero-bg-desktop_ogydtd.mp4" type="video/mp4" media="(min-width: 640px)">
                <source src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:good,w_750/v1781040746/hero-bg-mobile_yz4bkh.webm" type="video/webm">
                <source src="https://res.cloudinary.com/djoixgojj/video/upload/vc_h264,q_auto:good,w_750/v1781040746/hero-bg-mobile_yz4bkh.mp4" type="video/mp4">
                <track kind="captions" label="English" srcLang="en" default>
              `;
              el.play().catch(() => {});
            };
            if ("requestIdleCallback" in window) requestIdleCallback(load);
            else setTimeout(load, 2000);
          }}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          width={1920}
          height={1080}
          poster="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,so_0,w_1200/v1781040748/hero-bg-desktop_ogydtd.jpg"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/75 sm:from-black/55 sm:via-black/50 sm:to-black/70" />
      </div>

      {/* Service cards slider */}
      <div className="relative z-10 mb-6 w-full sm:mb-8">
        <div className="relative overflow-hidden py-2 sm:pt-6" aria-label="Our services">
          <div className="flex w-max animate-marquee gap-2 sm:gap-3">
            {[...SERVICE_CARDS, ...SERVICE_CARDS, ...SERVICE_CARDS, ...SERVICE_CARDS].map(
              (card, i) => (
                <div
                  key={`${card.title}-${i}`}
                  className="flex min-w-[135px] flex-shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/15 px-2.5 py-1.5 sm:min-w-[220px] sm:gap-3 sm:px-4 sm:py-2.5"
                >
                  <span className="flex-shrink-0 text-base sm:text-xl">{card.emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-semibold text-white sm:text-xs">
                      {card.title}
                    </div>
                    <div className="text-[8px] text-white/40 sm:text-[10px]">{card.label}</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Center-aligned hero content */}
      <div className="relative z-10 mx-auto w-full max-w-[900px] px-4 text-center sm:px-6">
        {/* Mini trust bar */}
        <div className="mb-2.5 inline-flex w-auto max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-medium sm:mb-6 sm:gap-2.5 sm:px-6 sm:py-2.5 sm:text-[13px]">
          <span className="text-white/85">
            <span className="font-bold text-white">{SITE_CLAIMS.price.value}</span> Standard Designs
          </span>
          <span className="text-white/25">|</span>
          <span className="text-white/85">
            <span className="font-semibold text-white">{SITE_CLAIMS.turnaround.value}</span>{" "}
            Turnaround
          </span>
          <span className="hidden text-white/25 sm:inline">|</span>
          <span className="hidden text-white/85 sm:inline">
            <span className="font-semibold text-white">{SITE_CLAIMS.formats.value}</span> Formats
          </span>
          <span className="text-white/25">|</span>
          <span className="flex items-center gap-1 font-semibold text-[#4ADE80]">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#4ADE80]" />
            Free Revisions
          </span>
        </div>

        {/* Headline */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="group mb-3 cursor-default font-syne text-[clamp(34px,8vw,64px)] leading-[1.05] text-white sm:mb-5 sm:text-[clamp(48px,8vw,96px)]"
        >
          <span
            className={`block whitespace-nowrap ${headline.line1Weight || "font-light"} ${headline.line1Tracking || "tracking-wide"}`}
          >
            {headline.line1}
          </span>
          <span className="relative block font-bold tracking-tight" style={{ minHeight: "1.1em" }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(3px)" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="block whitespace-nowrap bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FBBF24] bg-clip-text text-transparent"
                style={
                  {
                    backgroundSize: "200% auto",
                    animation: "gradient-shimmer 3s ease-in-out infinite",
                  } as React.CSSProperties
                }
              >
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        <p className="mx-auto mb-3 max-w-[480px] text-[13px] leading-relaxed text-white/80 sm:mb-8 sm:max-w-[520px] sm:text-base md:text-lg">
          {headline.sub}
        </p>

        {/* Primary CTAs — Upload Design leads, as the business intends.
            This slot used to be "Sign In / Register": the loudest button on the
            page asked a first-time visitor to create an account before they had
            seen a price, and the only Upload action was a pill that faded in
            after the hero. Someone who is ready to buy should not have to sign
            up to ask. Register stays in the header for people who want it. */}
        <div className="mb-3 flex flex-row justify-center gap-2 sm:mb-4 sm:gap-4">
          <Link href="/upload" className="flex-1 sm:flex-none">
            <Button
              variant="grad"
              size="xl"
              className="w-full !rounded-2xl !px-5 !py-3.5 !text-sm !font-bold !shadow-[0_8px_32px_rgba(37,99,235,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:!shadow-[0_12px_40px_rgba(37,99,235,0.55)] sm:w-auto sm:!px-10 sm:!py-4 sm:!text-lg"
              rightIcon={<Upload size={15} className="sm:size-[20px]" />}
            >
              Upload Design — Free
            </Button>
          </Link>
          <a
            href={`https://wa.me/${SITE_INFO.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 no-underline sm:flex-none"
          >
            <Button
              variant="grad"
              size="xl"
              className="w-full !rounded-2xl !border !border-white/25 !bg-white/10 !px-5 !py-3.5 !text-sm !font-semibold !text-white !shadow-none backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:!bg-white/20 sm:w-auto sm:!px-10 sm:!py-4 sm:!text-lg"
              rightIcon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-[15px] w-[15px] fill-current sm:h-[20px] sm:w-[20px]"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
            >
              WhatsApp Us
            </Button>
          </a>
        </div>

        {/* Reassurance strip — hesitation removal */}
        <p className="mb-3 text-center text-[11px] text-white/50 sm:mb-4 sm:text-xs">
          ✓ Free quote · ✓ No payment required · ✓ Pay only after preview approval
        </p>

        {/* Hero stats — 6 separate cards */}
        <div className="mt-5 hidden w-full grid-cols-2 gap-3 sm:mt-6 sm:grid sm:gap-4 md:grid-cols-6">
          {[
            // Was a 4.9/5 rating, 5,000+ orders and 100+ countries — all
            // invented. These are capabilities and published policies, plus a
            // real delivered count when the database actually has one.
            ...(stats?.deliveredOrders && stats.deliveredOrders >= MIN_LIVE_COUNT
              ? [
                  {
                    value: stats.deliveredOrders.toLocaleString(),
                    sub: "Designs delivered",
                    icon: FileCheck,
                  },
                ]
              : [{ value: "100%", sub: "Hand-digitized", icon: Shield }]),
            { value: SITE_CLAIMS.price.value, sub: "Standard designs", icon: Star },
            { value: SITE_CLAIMS.turnaround.value, sub: "Turnaround", icon: Clock },
            { value: SITE_CLAIMS.revisions.value, sub: "Unlimited revisions", icon: RefreshCw },
            { value: SITE_CLAIMS.formats.value, sub: "Machine formats", icon: Globe },
            { value: "3–24h", sub: "Delivery options", icon: FileCheck },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.sub}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/10 p-3 text-center transition-all hover:bg-white/20 sm:p-4"
              >
                <Icon size={16} className="mb-1.5 text-white/50" />
                <span className="font-syne text-sm font-bold text-white sm:text-lg">
                  {stat.value}
                </span>
                <span className="mt-0.5 text-[10px] text-white/40 sm:text-[11px]">{stat.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop sticky CTA — hidden initially, appears on scroll */}
      {portalReady &&
        createPortal(
          <motion.div
            className="pointer-events-none fixed left-0 right-0 top-[120px] z-[999] flex justify-center"
            style={{ opacity: stickyBtnAlpha }}
          >
            <Link href="/upload" className="pointer-events-auto">
              <Button
                variant="grad"
                size="md"
                className="!rounded-2xl !px-8 !py-3 !text-sm !font-bold shadow-[0_8px_32px_rgba(37,99,235,0.45)]"
                rightIcon={<Upload size={14} />}
              >
                Upload Design — Get Free Quote
              </Button>
            </Link>
          </motion.div>,
          document.body
        )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: CLIENT LOGOS
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SECTION 5: BEFORE/AFTER SHOWCASE (dedicated)
   ═══════════════════════════════════════════════════════════════ */

function _DeletedBeforeAfterShowcaseSection() {
  return null;
}
function __unused_before_after() {
  return null;
}
function __unused_body_after() {
  const [activeSet, setActiveSet] = useState(0);
  const current = [] as any;

  const BENEFITS = [
    {
      icon: "🧵",
      title: "Fabric-Aware Paths",
      desc: "Stitch angles and density tuned per material — caps, jackets, polos each get different treatment",
    },
    {
      icon: "🔤",
      title: "Sharp Small Text",
      desc: "Legible lettering at any size. Auto-trace can't handle text under 8mm — we can",
    },
    {
      icon: "⚡",
      title: "Clean Production Runs",
      desc: "Minimal thread breaks, efficient trims, fewer machine stops. Files run right first time",
    },
    {
      icon: "🎯",
      title: "Pixel-Perfect Registration",
      desc: "Every color change and boundary aligned. No gaps. No overlaps. No re-hooping",
    },
  ];

  return (
    <section className="bg-[#FAFAF9] py-12 sm:py-16 md:py-20" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          {/* ── Header ──────────────────────────────── */}
          <div className="mb-6 text-center sm:mb-8 md:mb-10">
            <SectionBadge color="#F97316">Visual Proof</SectionBadge>
            <h2
              id="showcase-heading"
              className="mb-2 mt-3 font-syne text-2xl font-bold leading-[1.15] text-[var(--txt)] sm:mb-3 sm:text-3xl md:text-5xl"
            >
              See the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Difference
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--txt2)]">
              Every file hand-digitized. No auto-trace. No shortcuts. The results speak for
              themselves.
            </p>
          </div>

          {/* ── Mobile layout (below lg) ──────────────── */}
          <div className="space-y-6 lg:hidden">
            {/* Slider — full bleed feel */}
            <div className="-mx-4 sm:mx-0">
              <BeforeAfterSlider
                beforeUrl={current.beforeUrl}
                afterUrl={current.afterUrl}
                beforeAlt={current.beforeAlt}
                afterAlt={current.afterAlt}
              />
            </div>

            {/* Tabs — sticky under slider */}
            <div className="flex justify-center gap-1.5">
              {BEFORE_AFTER_SETS.map((set, i) => (
                <button
                  key={set.label}
                  onClick={() => setActiveSet(i)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border-none px-3.5 py-2 text-[11px] font-semibold transition-all ${
                    activeSet === i
                      ? "bg-[#2563EB] text-white shadow-md"
                      : "border border-[var(--border)] bg-white text-[var(--txt2)] hover:bg-[var(--elevated)]"
                  }`}
                >
                  {set.label === "Digitizing" ? "🧵" : set.label === "Vector Art" ? "✏️" : "🏷️"}
                  {set.label}
                </button>
              ))}
            </div>
            <p className="-mt-4 text-center text-[10px] text-[var(--txt3)]">← Swipe to compare →</p>

            {/* Benefits — compact icon grid */}
            <div>
              <h3 className="mb-3 text-center font-syne text-lg font-bold text-[var(--txt)]">
                Why Digitizing Wins
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BENEFITS.map((b) => (
                  <div
                    key={b.title}
                    className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-white p-3 text-center"
                  >
                    <span className="mb-1 text-lg">{b.icon}</span>
                    <p className="mb-0.5 text-[11px] font-semibold leading-tight text-[var(--txt)]">
                      {b.title}
                    </p>
                    <p className="text-[10px] leading-snug text-[var(--txt3)]">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA — full width */}
            <Link href="/contact" className="block">
              <Button variant="grad" size="md" className="w-full" rightIcon={<Upload size={14} />}>
                Upload Design — See the Proof
              </Button>
            </Link>
            <p className="text-center text-[10px] text-[var(--txt3)]">
              Free revisions · All formats · Pay when satisfied
            </p>
          </div>

          {/* ── Desktop layout (lg+) ──────────────────── */}
          <div className="hidden items-center gap-10 lg:grid lg:grid-cols-2 lg:gap-14">
            {/* Slider + tabs */}
            <div>
              <BeforeAfterSlider
                beforeUrl={current.beforeUrl}
                afterUrl={current.afterUrl}
                beforeAlt={current.beforeAlt}
                afterAlt={current.afterAlt}
              />
              <div className="mt-3.5 flex justify-center gap-1.5">
                {BEFORE_AFTER_SETS.map((set, i) => (
                  <button
                    key={set.label}
                    onClick={() => setActiveSet(i)}
                    className={`cursor-pointer rounded-full border-none px-4 py-2 text-xs font-semibold transition-all ${
                      activeSet === i
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "border border-[var(--border)] bg-white text-[var(--txt2)] hover:bg-[var(--elevated)]"
                    }`}
                  >
                    {set.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-[var(--txt3)]">
                ← Drag the handle to compare before vs after →
              </p>
            </div>

            {/* Text + benefits */}
            <div className="text-left">
              <h3 className="mb-5 font-syne text-2xl font-bold text-[var(--txt)]">
                Why Hand-Digitizing Wins Every Time
              </h3>
              <div className="space-y-3.5">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 text-xl">{b.icon}</span>
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-[var(--txt)]">{b.title}</p>
                      <p className="text-xs leading-relaxed text-[var(--txt2)]">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Link href="/contact">
                  <Button variant="grad" size="md" rightIcon={<Upload size={14} />}>
                    Upload Design — See the Proof
                  </Button>
                </Link>
                <span className="text-[11px] text-[var(--txt3)]">
                  Free revisions · All formats · Pay when satisfied
                </span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4: STATISTICS (CRO-focused, embedded in TrustStatsSection)
   ═══════════════════════════════════════════════════════════════
   Note: TrustStatsSection already handles this. We wrap it with
   positioning to serve as the Statistics section.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SECTION 6: SERVICES
   ═══════════════════════════════════════════════════════════════ */

function _DeletedServicesSection() {
  return null;
}
function __unused_services() {
  return null;
}
function __unused_services_body() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="services-heading">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="services-heading"
          label="What We Digitize"
          title="Every Garment."
          gradientTitle="Every Format."
          description="From standard left chest logos to complex 3D puff caps — we digitize for every application and every machine brand."
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
          {SERVICES_GRID.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB]/30 hover:shadow-md sm:gap-3 sm:p-5"
            >
              <span className="text-2xl sm:text-3xl">{s.emoji}</span>
              <span className="text-xs font-semibold leading-tight text-[var(--txt)] transition-colors group-hover:text-[#2563EB] sm:text-sm">
                {s.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <Link href="/services">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              rightIcon={<ArrowRight size={14} />}
            >
              View All Services
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" size="sm" className="rounded-full">
              Get a Custom Quote →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7: WHY CHOOSE US
   ═══════════════════════════════════════════════════════════════ */

function WhyChooseUsSection() {
  return (
    <section className="bg-[#FAFAF9] py-12 sm:py-16 md:py-20" aria-labelledby="why-us-heading">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="mb-10 text-center sm:mb-12">
            <SectionBadge color="#16A34A">Why Choose genxdigitizing</SectionBadge>
            <h2
              id="why-us-heading"
              className="mb-3 mt-3 font-syne text-3xl font-bold leading-[1.15] text-[var(--txt)] md:text-5xl"
            >
              Built for{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Professional Results
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-sm text-[var(--txt2)] sm:text-base">
              Every feature of our service is designed around one outcome: files that run clean on
              your machine, with zero headaches.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)] sm:p-6"
                >
                  <span
                    className="absolute right-4 top-4 rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight opacity-60 transition-opacity group-hover:opacity-100"
                    style={{ background: `${item.color}12`, color: item.color }}
                  >
                    {item.stat}
                  </span>
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                    style={{ background: `${item.color}12` }}
                  >
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <h3 className="mb-2 font-syne text-base font-bold sm:text-lg">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--txt2)]">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link href="/services">
              <Button variant="grad" size="sm" rightIcon={<ArrowRight size={14} />}>
                Explore All Features
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8: HOW IT WORKS
   ═══════════════════════════════════════════════════════════════ */

function HowItWorksSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20" aria-labelledby="process-heading">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="process-heading"
          label="How It Works"
          title="Order in Minutes,"
          gradientTitle="Delivered Fast"
          description="Your design goes through the same four-step process every time. Simple, fast, reliable."
        />

        {/* Responsive: single DOM, adapts layout via grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-2 lg:grid-cols-4 lg:gap-6">
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={step.n}
              className="relative flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-all duration-200 hover:border-[#2563EB]/20 lg:flex-col lg:gap-0 lg:rounded-2xl lg:p-6 lg:text-center lg:shadow-sm lg:hover:-translate-y-1"
            >
              {/* Desktop arrow connector */}
              {i < PROCESS_STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md lg:flex">
                  →
                </div>
              )}
              {/* Mobile arrow */}
              {i < PROCESS_STEPS.length - 1 && (
                <span className="ml-auto flex-shrink-0 text-[var(--border3)] lg:hidden">↓</span>
              )}
              {/* Step number — desktop only */}
              <div className="mb-3 hidden font-syne text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB] lg:block">
                Step {step.n}
              </div>
              {/* Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-lg lg:mx-auto lg:mb-3 lg:h-[52px] lg:w-[52px] lg:rounded-full lg:border-2 lg:border-[#2563EB]/20 lg:text-[22px]">
                {step.icon}
              </div>
              {/* Text */}
              <div className="min-w-0 lg:w-full">
                <h3 className="font-syne text-xs font-semibold text-[var(--txt)] lg:mb-1.5 lg:text-base lg:font-bold">
                  {step.title}
                </h3>
                <p className="truncate text-[11px] leading-relaxed text-[var(--txt3)] lg:whitespace-normal lg:text-sm lg:text-[var(--txt2)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/contact">
            <Button
              variant="grad"
              size="sm"
              className="rounded-full"
              rightIcon={<Upload size={14} />}
            >
              Start Your First Order
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 9: CASE STUDIES
   ═══════════════════════════════════════════════════════════════ */

function _DeletedCaseStudiesSection() {
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10: REVIEWS / TESTIMONIALS
   ═══════════════════════════════════════════════════════════════ */

// Was TestimonialsSection, rendering six invented reviews — named people at
// named companies in named countries, with a "Verified" badge, for customers
// who never existed. The `reviews` table has always been empty.
//
// Replaced with claims we can prove. To restore real reviews, query the
// `reviews` table (it has stars, text, client_id and an is_published gate) and
// render those instead — and do not reintroduce a hardcoded array here.
function WhyUsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="why-heading">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="mb-10 text-center sm:mb-12">
            <SectionBadge color="#EAB308">Why GenX</SectionBadge>
            <h2
              id="why-heading"
              className="mb-3 mt-3 font-syne text-3xl font-bold leading-[1.15] md:text-5xl"
            >
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Built For Production
              </span>{" "}
              Embroidery
            </h2>
            <p className="mx-auto max-w-xl text-sm text-[var(--txt2)] sm:text-base">
              What you get on every order — before you've placed one.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {SITE_CLAIM_LIST.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center sm:p-6"
              >
                <div className="mb-1.5 font-syne text-3xl font-bold text-[var(--txt)] sm:text-4xl">
                  {c.value}
                </div>
                <div className="text-[11px] text-[var(--txt3)] sm:text-xs">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/portfolio">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                rightIcon={<ArrowRight size={14} />}
              >
                See Our Work
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11: PRICING
   ═══════════════════════════════════════════════════════════════ */

function PricingSection({ tiers }: { tiers: Record<string, { size: string; price: string }[]> }) {
  const plans = [
    {
      name: "Embroidery Digitizing",
      emoji: "🧵",
      desc: "Clean, production-ready stitch files",
      price: "From $7",
      tiers: tiers.digitizing || [],
      gradient: "from-[#2563EB] to-[#1D4ED8]",
    },
    {
      name: "Vector Art Conversion",
      emoji: "✏️",
      desc: "Scalable vectors for print and web",
      price: "From $8",
      tiers: tiers.vector || [],
      gradient: "from-[#F97316] to-[#EA580C]",
    },
    {
      name: "Custom Patches",
      emoji: "🏷️",
      desc: "Embroidered, PVC, woven, leather",
      price: "From $5",
      tiers: tiers.sewout || [],
      gradient: "from-[#16A34A] to-[#15803D]",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="pricing-heading"
          label="Pricing"
          title="Simple,"
          gradientTitle="No-Surprise Pricing"
          description="All plans include free revisions, free format conversion, and free rush delivery. Pay only when satisfied."
        />

        <div className="mx-auto grid max-w-5xl gap-5 sm:gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:p-7"
            >
              <div className="text-center">
                <span className="mb-3 block text-3xl">{plan.emoji}</span>
                <h3 className="mb-1 font-syne text-lg font-bold text-[var(--txt)]">{plan.name}</h3>
                <p className="mb-3 text-xs text-[var(--txt3)]">{plan.desc}</p>
                <div
                  className={`mb-1 bg-gradient-to-r font-syne text-3xl font-bold ${plan.gradient} bg-clip-text text-transparent`}
                >
                  {plan.price}
                </div>
                <p className="mb-5 text-[10px] text-[var(--txt3)]">per design</p>
              </div>
              <div className="mb-6 flex-1 space-y-2">
                {plan.tiers.length > 0 ? (
                  plan.tiers.slice(0, 5).map((t) => (
                    <div
                      key={t.size}
                      className="flex items-center justify-between border-b border-[var(--border)] py-1.5 text-xs last:border-b-0"
                    >
                      <span className="text-[var(--txt2)]">{t.size}</span>
                      <span className="font-semibold text-[var(--txt)]">{t.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-[var(--txt3)]">
                    Starting at {plan.price.toLowerCase()}
                  </p>
                )}
              </div>
              <Link href="/register" className="mt-auto">
                <Button variant="grad" size="sm" className="w-full">
                  Order Now
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--txt3)]">
            Always Included — Free With Every Order
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--txt2)]">
            {[
              "Unlimited revisions",
              "Format conversion",
              "Rush delivery",
              "Machine-tested",
              "Pay when satisfied",
            ].map((f) => (
              <span key={f} className="inline-flex items-center gap-1">
                <Check size={12} className="text-[#16A34A]" />
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-7 text-center">
          <p className="text-sm text-[var(--txt2)]">
            Bulk orders?{" "}
            <Link href="/pricing" className="font-semibold text-[#2563EB] hover:underline">
              See volume discounts
            </Link>{" "}
            · Enterprise?{" "}
            <Link href="/contact" className="font-semibold text-[#2563EB] hover:underline">
              Contact sales
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 12: MANUAL VS AUTO COMPARISON
   ═══════════════════════════════════════════════════════════════ */

function _DeletedManualVsAutoSection() {
  return null;
}
function __unused_manual_vs_auto() {
  return (
    <section className="bg-[#FAFAF9] py-12 sm:py-16 md:py-20" aria-labelledby="comparison-heading">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="comparison-heading"
          label="Quality Comparison"
          title="Manual Digitizing vs"
          gradientTitle="Auto-Tracing Software"
          description="Cheap services use one-click auto-trace. We hand-place every stitch. Here's why it matters for your production floor."
        />

        {/* Mobile: compact cards */}
        <div className="space-y-2 lg:hidden">
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.feature}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
            >
              <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                <div className="bg-[#F0FDF4] p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Check size={12} className="flex-shrink-0 text-[#16A34A]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
                      genxdigitizing
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-snug text-[var(--txt2)]">
                    {row.manual}
                  </p>
                </div>
                <div className="bg-[#FEF2F2] p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-red-400">✕</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                      Auto
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-[var(--txt3)]">{row.auto}</p>
                </div>
              </div>
              <div className="border-t border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--txt2)]">
                  {row.feature}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm lg:block">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-[var(--border)] bg-[var(--elevated)]">
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt2)]">
              Feature
            </div>
            <div className="flex items-center gap-1.5 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#16A34A]">
              <Check size={14} /> genxdigitizing Manual
            </div>
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt3)]">
              Auto-Trace Software
            </div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1.5fr_1fr_1fr] ${i % 2 === 0 ? "bg-white" : "bg-[var(--surface)]"}`}
            >
              <div className="px-6 py-4 text-sm font-semibold text-[var(--txt)]">{row.feature}</div>
              <div className="flex items-center gap-2 px-6 py-4 text-sm text-[var(--txt2)]">
                <Check size={14} className="flex-shrink-0 text-[#16A34A]" />
                {row.manual}
              </div>
              <div className="flex items-center gap-2 px-6 py-4 text-sm text-[var(--txt3)]">
                <span className="flex-shrink-0 font-bold text-red-400">✕</span>
                {row.auto}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="mb-3 text-xs text-[var(--txt3)]">
            Don't risk your production with auto-trace files. See the difference firsthand.
          </p>
          <Link href="/contact">
            <Button variant="grad" size="sm" rightIcon={<Upload size={14} />}>
              Get a Manual-Digitized Sample
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11B: FAQ
   ═══════════════════════════════════════════════════════════════ */

function FAQSection({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const filtered = search.trim()
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <section
      className="border-y border-[var(--border)] bg-[var(--surface)] py-12 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[880px] px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="faq-heading"
          label="FAQ"
          title="Got Questions?"
          gradientTitle="We've Got Answers."
        />

        <div className="relative mx-auto mb-8 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenIndex(null);
            }}
            placeholder="Search questions..."
            className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm text-[var(--txt)] transition-all placeholder:text-[var(--txt3)] focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            aria-label="Search frequently asked questions"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--txt3)]">
            No matches. Try different search or{" "}
            <Link href="/contact" className="text-[#2563EB] hover:underline">
              contact us
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="hover:bg-[var(--elevated)]/50 flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[var(--txt)] transition-colors"
                  aria-expanded={openIndex === i}
                >
                  <span>{f.q}</span>
                  {openIndex === i ? (
                    <ChevronUp size={16} className="flex-shrink-0 text-[var(--txt3)]" />
                  ) : (
                    <ChevronDown size={16} className="flex-shrink-0 text-[var(--txt3)]" />
                  )}
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--txt2)]">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 12: FINAL CTA
   ═══════════════════════════════════════════════════════════════ */

function FinalCTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-[1000px] px-4 text-center sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] p-8 shadow-2xl sm:p-12 md:p-16">
            <GradientOrb
              color="#60A5FA"
              size={350}
              className="-right-[10%] -top-[30%] opacity-10"
            />
            <GradientOrb
              color="#F97316"
              size={250}
              className="opacity-6 -bottom-[20%] -left-[10%]"
            />

            <div className="relative z-10">
              <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ADE80]" />
                Start in Under 2 Minutes
              </span>

              <h2 className="mb-4 font-syne text-3xl font-bold leading-[1.1] text-white sm:text-4xl md:text-5xl">
                Ready for Files That Actually Run Clean?
              </h2>

              <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                Upload your design. Get a proof within hours. Pay only when you're satisfied. No
                risk. No minimums. No surprises.
              </p>

              <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/contact">
                  <Button
                    variant="grad"
                    size="lg"
                    className="w-full !rounded-full !px-8 !py-4 !text-base sm:w-auto"
                    rightIcon={<Upload size={16} />}
                  >
                    Get Free Quote
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="grad"
                    size="lg"
                    className="w-full !rounded-full bg-white !px-8 !py-4 !text-[#2563EB] hover:bg-[#EFF6FF] sm:w-auto"
                  >
                    Create Free Account
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={12} className="text-[#4ADE80]" />
                  Free revisions forever
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={12} className="text-[#4ADE80]" />
                  All machine formats
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={12} className="text-[#4ADE80]" />
                  Pay when satisfied
                </span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  services: any[];
  process: any[];
  // `testimonials` removed — it fed the invented reviews block above. Re-add
  // only when it is backed by real rows from the `reviews` table.
  liveStats?: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    reviewCount: number;
    avgRating?: number | null;
  };
  faqs: { q: string; a: string }[];
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: BEFORE/AFTER VISUAL PROOF
   ═══════════════════════════════════════════════════════════════ */

function BeforeAfterShowcaseSection() {
  const [activeSet, setActiveSet] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const current = BEFORE_AFTER_SETS[activeSet];
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
  }

  function handleDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e);
  }

  useEffect(() => {
    if (!isDragging) return;
    function onMove(e: MouseEvent | TouchEvent) {
      handleMove(e as any);
    }
    function onUp() {
      setIsDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);

  return (
    <section className="py-12 sm:py-16 md:py-20" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          {/* Header */}
          <div className="mb-8 text-center sm:mb-10">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#F97316]">
              Visual Proof
            </span>
            <h2
              id="showcase-heading"
              className="mb-3 font-syne text-[clamp(28px,5vw,48px)] font-bold leading-[1.08] text-[var(--txt)]"
            >
              See the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Difference
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--txt2)] sm:text-base">
              Every file hand-digitized. No auto-trace. No shortcuts. The results speak for
              themselves.
            </p>
          </div>

          {/* Desktop: 2-col layout | Mobile: stacked */}
          <div className="items-start lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 xl:gap-14">
            {/* Left: Slider */}
            <div>
              {/* Tab switcher */}
              <div className="mb-5 flex items-center justify-center gap-2 lg:justify-start">
                {BEFORE_AFTER_SETS.map((set, i) => (
                  <button
                    key={set.label}
                    onClick={() => {
                      setActiveSet(i);
                      setSliderPos(50);
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      i === activeSet
                        ? "bg-[#F97316] text-white shadow-sm"
                        : "border border-[var(--border)] bg-[var(--elevated)] text-[var(--txt2)] hover:text-[var(--txt)]"
                    }`}
                  >
                    {i === 0 ? "🧵" : i === 1 ? "✏️" : "🏷️"} {set.label}
                  </button>
                ))}
              </div>

              {/* Before/After Slider */}
              <div
                ref={containerRef}
                className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl"
                style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
                onMouseDown={handleDown}
                onTouchStart={handleDown}
              >
                <Image
                  src={current.beforeUrl}
                  alt={current.beforeAlt}
                  fill
                  className="object-cover"
                  draggable={false}
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <Image
                    src={current.afterUrl}
                    alt={current.afterAlt}
                    fill
                    className="object-cover"
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
                {/* Handle */}
                <div
                  className="pointer-events-none absolute bottom-0 top-0 w-[3px]"
                  style={{
                    left: `${sliderPos}%`,
                    background:
                      "linear-gradient(180deg, transparent 0%, #F97316 30%, #F97316 70%, transparent 100%)",
                    boxShadow: "0 0 12px rgba(249,115,22,0.5)",
                  }}
                />
                <div
                  className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F97316] shadow-2xl ring-4 ring-white/90">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 5l-4 7 4 7" />
                      <path d="M16 5l4 7-4 7" />
                    </svg>
                  </div>
                </div>
                <span className="absolute left-4 top-4 rounded-lg bg-[#DC2626] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                  Before
                </span>
                <span className="absolute right-4 top-4 rounded-lg bg-[#16A34A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                  After
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
                  }}
                >
                  <div>
                    <p className="font-syne text-sm font-bold leading-tight text-white sm:text-base">
                      {current.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/70 sm:text-xs">
                      Hand-digitized — production-ready quality
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white">
                    {activeSet === 0
                      ? "🧵 Digitizing"
                      : activeSet === 1
                        ? "✏️ Vector Art"
                        : "🏷️ Patches"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-[var(--txt3)] lg:text-left">
                ⟷ Drag the handle to compare before vs after
              </p>
            </div>

            {/* Right: Context — desktop only */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h3 className="mb-4 font-syne text-lg font-bold text-[var(--txt)]">
                  Why Hand-Digitizing Wins
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: "🧵",
                      title: "Clean Stitch Paths",
                      desc: "Every stitch placed by hand — optimized for your fabric type and machine. No jagged auto-trace edges.",
                    },
                    {
                      icon: "🔤",
                      title: "Sharp Small Text",
                      desc: "Legible lettering down to 5mm. Auto-trace blurs small text — our manual process keeps it crisp.",
                    },
                    {
                      icon: "⚡",
                      title: "Production-Ready",
                      desc: "Minimal thread breaks, efficient trims, fewer machine stops. Files run clean on first load.",
                    },
                    {
                      icon: "🎯",
                      title: "Perfect Registration",
                      desc: "Every color change and boundary aligned. No gaps, no overlaps, no re-hooping needed.",
                    },
                  ].map((b) => (
                    <div key={b.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-xl">{b.icon}</span>
                      <div>
                        <p className="mb-0.5 text-sm font-semibold text-[var(--txt)]">{b.title}</p>
                        <p className="text-xs leading-relaxed text-[var(--txt2)]">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="text-[11px] leading-relaxed text-[var(--txt3)]">
                    <strong className="text-[var(--txt)]">
                      {activeSet === 0
                        ? "🧵 Digitizing"
                        : activeSet === 1
                          ? "✏️ Vector Art"
                          : "🏷️ Patches"}
                    </strong>{" "}
                    — shown above. Drag the orange handle left to see the original artwork, right to
                    reveal the finished result.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

export function LandingClient({ services, process, faqs, liveStats }: Props) {
  const tiers: Record<string, { size: string; price: string }[]> = {};
  for (const svc of services) {
    const cat = svc.title.toLowerCase().includes("vector")
      ? "vector"
      : svc.title.toLowerCase().includes("patch")
        ? "sewout"
        : "digitizing";
    tiers[cat] = svc.tiers || [];
  }

  return (
    <div className="overflow-x-hidden bg-[var(--bg)] pb-24 text-[var(--txt)] sm:pb-0">
      {/* 1. HERO — scroll-morph on mobile, static on desktop */}
      <div className="-mt-[100px] block md:hidden">
        <MobileHeroScroll />
      </div>
      <div className="hidden md:block">
        <HeroSection stats={liveStats} />
      </div>

      {/* Phone-width sticky action bar. Mounted here, at the top level, and not
          inside HeroSection: HeroSection renders only above `md`, and the bar is
          `sm:hidden`, so while it lived in there it rendered at no width at all
          and the phone homepage had no persistent way to start an order. */}
      <MobileCtaBar />

      {/* 4. STATISTICS / OPERATIONS LIVE — real counts from the database */}
      <TrustStatsSection stats={liveStats} />

      {/* PORTFOLIO PREVIEW */}
      <PortfolioPreview />

      {/* VISUAL PROOF — BEFORE/AFTER */}
      <BeforeAfterShowcaseSection />

      {/* 7. WHY CHOOSE US */}
      <WhyChooseUsSection />

      {/* SEW-OUT GUARANTEE */}
      <SewOutGuarantee />

      {/* 8. HOW IT WORKS */}
      <HowItWorksSection />

      {/* PRICING */}
      <PricingSection tiers={tiers} />

      {/* 10. REVIEWS / TESTIMONIALS */}
      <WhyUsSection />

      {/* 11. FAQ */}
      <FAQSection faqs={faqs} />

      {/* 12. FINAL CTA */}
      <FinalCTASection />
    </div>
  );
}
