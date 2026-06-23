"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
import { SITE_STATS, SITE_INFO, fmtPlus, fmt } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TrustStatsSection } from "@/components/shared/TrustStatsSection";
import { FreeDesignsPreview } from "@/components/free-designs/FreeDesignsPreview";
import { SewOutGuarantee } from "@/components/marketing/SewOutGuarantee";
import { EmailCapture } from "@/components/marketing/EmailCapture";
import { ClientLogoWall } from "@/components/marketing/ClientLogoWall";
import dynamic from "next/dynamic";

const PortfolioPreview = dynamic(
  () => import("@/components/portfolio/PortfolioPreview").then((m) => ({ default: m.PortfolioPreview })),
  { ssr: false, loading: () => <div className="py-16" /> }
);

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const TRUST_BADGES = [
  { icon: Star, label: `${SITE_STATS.avgRating}/5 Rating`, sub: `${fmtPlus(SITE_STATS.verifiedReviews)} verified reviews` },
  { icon: FileCheck, label: fmtPlus(SITE_STATS.ordersCompleted), sub: "Orders completed" },
  { icon: Clock, label: `${SITE_STATS.avgDeliveryHours}h`, sub: "Avg. delivery time" },
  { icon: Globe, label: fmtPlus(SITE_STATS.countriesServed), sub: "Countries served" },
  { icon: Shield, label: "100%", sub: "Satisfaction guaranteed" },
  { icon: RefreshCw, label: "Unlimited", sub: "Free revisions" },
];

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
    desc: "Standard delivery in 12 hours. Rush in 6. Urgent in 3. All speed tiers included at no extra charge — unlike competitors who charge $10+ for rush.",
    stat: "3–12h avg",
    color: "#F97316",
  },
  {
    icon: RefreshCw,
    title: "Unlimited Free Revisions",
    desc: "Not satisfied? We keep going. No caps. No extra fees. 98% of files approved on first pass — but we'll revise until it runs perfectly on your machine.",
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
    webpUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/cap-embroidery_sjxoep.webp",
    gifUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/cap-embroidery_sjxoep.gif",
    alt: "Professional cap embroidery digitizing result — clean stitch-out on curved cap surface",
  },
  {
    label: "Jacket Back",
    webpUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779207170/jacket-embroidery_ycfnqh.webp",
    gifUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779207170/jacket-embroidery_ycfnqh.gif",
    alt: "Large-format jacket back embroidery — crisp detail on complex design",
  },
  {
    label: "Left Chest",
    webpUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_600/v1779204050/shirt-embroidery_bisqry.webp",
    gifUrl: null, // no GIF version available
    alt: "Clean left chest logo embroidery on professional shirt",
  },
];

const BEFORE_AFTER_SETS = [
  {
    label: "Digitizing",
    beforeUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1779288234/Before-5_upqe91.webp",
    afterUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1779288234/After-5_hod7v0.webp",
    beforeAlt: "Original artwork before digitizing",
    afterAlt: "Digitized embroidery file with stitch paths",
  },
  {
    label: "Vector Art",
    beforeUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780366590/Artboard_1_ag0ycx.webp",
    afterUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780366590/Artboard_1_2_uhntgw.webp",
    beforeAlt: "Raster image before vector conversion",
    afterAlt: "Clean vector art output",
  },
  {
    label: "Patch Design",
    beforeUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780368066/Untitled-1_ua0tor.webp",
    afterUrl: "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_800/v1780368068/Untitleduu-1_s7qc6c.webp",
    beforeAlt: "Patch concept before digitizing",
    afterAlt: "Production-ready patch file",
  },
];

const COMPARISON_ROWS = [
  { feature: "Quality", manual: "Clean, production-grade stitch paths", auto: "Jagged paths, uneven edges" },
  { feature: "Stitch Pathing", manual: "Optimized for fabric type and curve", auto: "Generic algorithm, ignores fabric" },
  { feature: "Density Control", manual: "Adjusted per material and design", auto: "One-size-fits-all density" },
  { feature: "Small Text", manual: "Sharp, readable at 5mm+", auto: "Blurry, often illegible" },
  { feature: "Production Reliability", manual: "Runs clean, minimal thread breaks", auto: "Frequent breaks, registration errors" },
  { feature: "Trims & Jumps", manual: "Minimal, efficient path planning", auto: "Excessive, wastes thread and time" },
];

const CASE_STUDIES = [
  {
    client: "ProStitch Apparel",
    industry: "Promotional Products — USA",
    problem: "Previous digitizer produced files with inconsistent density. Cap designs had thread breaks on curved sections, and small text registered poorly on left-chest logos.",
    solution: "genxdigitizing manually digitized 200+ cap designs with structural underlay, adjusted stitch angles for curved surfaces, and provided sew-out photos with every proof.",
    results: [
      { metric: "98%", label: "First-run approval" },
      { metric: "40%", label: "Fewer thread breaks" },
      { metric: "12h", label: "Avg. turnaround" },
    ],
  },
  {
    client: "Victory Sportswear",
    industry: "Team Uniforms — Nigeria",
    problem: "Complex jacket-back designs with gradients and small sponsor logos were coming back unusable. Auto-digitized files had excessive trims and wasted thread.",
    solution: "Re-digitized 150+ jacket-back designs with optimized path planning. Reduced jump stitches by 60%. Color-matched every thread to Pantone references.",
    results: [
      { metric: "60%", label: "Fewer jump stitches" },
      { metric: "100%", label: "Color accuracy" },
      { metric: "8h", label: "Avg. turnaround" },
    ],
  },
];

const PROCESS_STEPS = [
  { n: "01", title: "Upload Design", desc: "Send your logo or artwork with size and placement details.", icon: "📤" },
  { n: "02", title: "We Digitize", desc: "Hand-digitized by experienced professionals. Stitch paths, density, underlay — all optimized for your fabric.", icon: "✏️" },
  { n: "03", title: "Approve Proof", desc: "Review the digitized proof. Request changes or approve it. Unlimited free revisions until perfect.", icon: "✅" },
  { n: "04", title: "Download & Sew", desc: "Receive production-ready files in your format. Load onto your machine and sew with confidence.", icon: "📥" },
];

/* ── Hero Headline Variants (for A/B testing) ──────────── */
const HEADLINES = {
  primary: {
    line1: "Files That Run Clean,",
    gradient: "First Time, Every Time",
    sub: "Hand-digitized by experienced professionals. Cleaner sew-outs. Fewer thread breaks. Production-ready in 12 hours — or it's free.",
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
    sub: "Professional digitizing for every application: caps, jackets, polos, 3D puff. 12-hour turnaround. All formats included. No minimums.",
  },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function SectionBadge({ children, color = "#2563EB" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
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
      <Button variant={variant} size="sm" className="rounded-full" rightIcon={<ArrowRight size={13} />}>
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
      className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden select-none cursor-col-resize bg-[var(--elevated)] border border-[var(--border)] shadow-lg"
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <Image src={beforeUrl} alt={beforeAlt} fill className="object-cover" draggable={false} priority sizes="(max-width: 768px) 100vw, 800px" unoptimized />
      <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${position}%` }}>
        <Image src={afterUrl} alt={afterAlt} fill className="object-cover" style={{ maxWidth: "none" }} draggable={false} priority sizes="(max-width: 768px) 100vw, 800px" unoptimized />
      </div>
      <div className="absolute top-0 bottom-0 w-[3px] bg-white shadow-md pointer-events-none" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-[var(--border)] shadow-lg flex items-center justify-center pointer-events-none">
          <GripHorizontal size={15} className="text-[var(--txt3)]" />
        </div>
      </div>
      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm z-10 pointer-events-none">Before</span>
      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#16A34A] text-white z-10 pointer-events-none">After</span>
      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-[var(--border)] rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--txt)] shadow-sm z-10 pointer-events-none whitespace-nowrap">
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
    <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-[var(--elevated)] border border-[var(--border)] shadow-lg">
      {/* Static poster (webp) — always shown, fades out when GIF loads */}
      <img
        src={webpUrl}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${gifLoaded && hasGif ? "opacity-0" : "opacity-100"}`}
        draggable={false}
        fetchPriority="high"
        width={800}
        height={600}
      />

      {/* Animated GIF overlay */}
      {hasGif && !gifError && (
        <img
          src={gifUrl!}
          alt={`${alt} — animated sew-out`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${gifLoaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
          onLoad={() => setGifLoaded(true)}
          onError={() => setGifError(true)}
          width={800}
          height={600}
        />
      )}

      {/* Badges */}
      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#16A34A]/90 text-white z-10 pointer-events-none backdrop-blur-sm">
        {hasGif && !gifError ? "Real Sew-Out" : "Finished Result"}
      </span>

      {!hasGif && (
        <span className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-black/50 text-white/80 z-10 pointer-events-none backdrop-blur-sm">
          Static Preview
        </span>
      )}
    </div>
  );
}

function HeroSection() {
  const headline = HEADLINES.primary;

  return (
    <section className="relative flex flex-col items-center justify-start pt-2 pb-6 sm:pt-4 min-h-[80vh] sm:h-[85vh] overflow-hidden" aria-labelledby="hero-heading">
      <div className="absolute inset-0 z-0">
        {/* Poster image loads immediately; video deferred until idle */}
        <Image
          src="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,f_auto,w_600/v1781040748/hero-bg-desktop_ogydtd.jpg"
          alt="Embroidery digitizing service — professional stitch files"
          fill className="object-cover" priority unoptimized
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
            if ('requestIdleCallback' in window) requestIdleCallback(load);
            else setTimeout(load, 2000);
          }}
          className="absolute inset-0 w-full h-full object-cover"
          muted loop playsInline preload="none"
          width={1920} height={1080}
          poster="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,so_0,w_1200/v1781040748/hero-bg-desktop_ogydtd.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/75 sm:from-black/55 sm:via-black/50 sm:to-black/70 pointer-events-none" />
      </div>

{/* Mobile bottom bar */}
<div
  className="sm:hidden fixed bottom-0 inset-x-0 z-40 pb-5 safe-area-bottom"
>
  {/* Buttons */}
  <div className="px-3 pt-3 pb-3 flex items-center gap-2 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] shadow-[0_1px_8px_rgba(37,99,235,0.2)]">
    <a
      href={`https://wa.me/${SITE_INFO.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#25D366] text-white active:scale-95 transition-all flex-shrink-0 shadow-md"
      aria-label="WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
    </a>

    <Link href="/register" className="flex-1">
      <Button
        variant="outline"
        size="md"
        className="w-full !h-11 !py-0 !text-[13px] !font-semibold !rounded-2xl !border !border-solid !border-white !text-white hover:!bg-white/10"
      >
        Register
      </Button>
    </Link>

    <Link href="/upload" className="flex-[2]">
      <Button
        variant="grad"
        size="md"
        className="w-full !h-11 !py-0 !text-[13px] !font-bold !rounded-2xl !shadow-md"
        rightIcon={<Upload size={14} />}
      >
        Upload Design
      </Button>
    </Link>
  </div>
</div>
        
      {/* Service cards slider */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-0 sm:px-6 md:px-12 mb-6 sm:mb-8">
        <div className="relative overflow-hidden py-2" aria-label="Our services">
          <div className="flex gap-2 sm:gap-3 animate-marquee w-max">
            {[...SERVICE_CARDS, ...SERVICE_CARDS].map((card, i) => (
              <div key={`${card.title}-${i}`} className="flex items-center gap-2 sm:gap-3 bg-white/8 backdrop-blur-md border border-white/10 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex-shrink-0 min-w-[135px] sm:min-w-[220px]">
                <span className="text-base sm:text-xl flex-shrink-0">{card.emoji}</span>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs font-semibold text-white truncate">{card.title}</div>
                  <div className="text-[8px] sm:text-[10px] text-white/40">{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center-aligned hero content */}
      <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 text-center flex-1 flex flex-col">
        {/* Mini trust bar */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-6 text-[11px] sm:text-[13px] font-medium bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/15 w-auto max-w-full">
          <span className="flex items-center gap-0.5" aria-label={`${SITE_STATS.avgRating} out of 5 stars`}>
            <span className="font-bold text-white mr-0.5">{SITE_STATS.avgRating}</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className="sm:size-3" fill="#F59E0B" stroke="none" />
            ))}
          </span>
          <span className="text-white/25">|</span>
          <span className="text-white/85">
            <span className="font-semibold text-white">{fmtPlus(SITE_STATS.ordersCompleted)}</span> Orders
          </span>
          <span className="text-white/25 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-white/85">
            <span className="font-semibold text-white">{fmtPlus(SITE_STATS.countriesServed)}</span> Countries
          </span>
          <span className="text-white/25">|</span>
          <span className="text-[#4ADE80] font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />
            Free Revisions
          </span>
        </div>

        {/* Headline */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-syne text-[clamp(28px,7vw,68px)] sm:text-[clamp(38px,7vw,68px)] leading-[1.1] mb-3 sm:mb-5 text-white cursor-default group"
        >
          <span className={`block whitespace-nowrap ${headline.line1Weight || "font-light"} ${headline.line1Tracking || "tracking-wide"}`}>
            {headline.line1}
          </span>
          <span className={`block whitespace-nowrap bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FBBF24] bg-clip-text text-transparent ${headline.gradientWeight || "font-bold"} ${headline.gradientTracking || "tracking-tight"} group-hover:from-[#FBBF24] group-hover:via-[#38BDF8] group-hover:to-[#C084FC] transition-all duration-700`}>
            {headline.gradient}
          </span>
        </motion.h1>

        <p className="text-[13px] sm:text-base md:text-lg text-white/80 leading-relaxed mb-3 sm:mb-8 max-w-[480px] sm:max-w-[520px] mx-auto">
          {headline.sub}
        </p>

        {/* Primary CTAs — side by side on all screens */}
        <div className="flex flex-row gap-2 sm:gap-4 justify-center mb-3 sm:mb-4">
          <Link href="/upload" className="flex-1 sm:flex-none">
            <Button
              variant="grad"
              size="xl"
              className="w-full sm:w-auto !px-5 sm:!px-10 !py-3.5 sm:!py-4 !text-sm sm:!text-lg !rounded-2xl !font-bold !shadow-[0_8px_32px_rgba(37,99,235,0.45)] hover:!shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 transition-all duration-300"
              rightIcon={<Upload size={15} className="sm:size-[20px]" />}
            >
              Get Free Quote
            </Button>
          </Link>
          <a href="https://wa.me/18302102135" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none no-underline">
            <Button
              variant="grad"
              size="xl"
              className="w-full sm:w-auto !px-5 sm:!px-10 !py-3.5 sm:!py-4 !text-sm sm:!text-lg !rounded-2xl !font-semibold !bg-[#25D366] hover:!bg-[#22C55E] !border !border-[#25D366]/30 !shadow-[0_4px_16px_rgba(37,211,102,0.3)] hover:-translate-y-0.5 transition-all duration-300"
              rightIcon={<svg viewBox="0 0 24 24" className="w-[15px] h-[15px] sm:w-[20px] sm:h-[20px] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
            >
              WhatsApp Us
            </Button>
          </a>
        </div>

        {/* Reassurance strip — hesitation removal */}
        <p className="text-center text-[11px] sm:text-xs text-white/50 mb-3 sm:mb-4">
          ✓ Free quote · ✓ No payment required · ✓ Pay only after preview approval
        </p>

        {/* Trust checks */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2">
          {[
            { text: "Free revisions", sub: "Forever" },
            { text: "All file formats", sub: "8+ formats" },
            { text: "Pay when satisfied", sub: "No risk" },
            { text: "12h delivery", sub: "Guaranteed" },
          ].map((item) => (
            <span key={item.text} className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm text-white/60">
              <Check size={12} className="sm:size-[13px] text-[#4ADE80] flex-shrink-0" />
              <span>
                <span className="font-medium text-white/90">{item.text}</span>
                <span className="text-white/40 ml-0.5 hidden sm:inline">— {item.sub}</span>
              </span>
            </span>
          ))}
        </div>

        {/* Hero stats — 6 separate cards */}
        <div className="mt-5 sm:mt-6 w-full grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
          {[
            { value: `${SITE_STATS.avgRating}/5`, sub: `${fmtPlus(SITE_STATS.verifiedReviews)} verified reviews`, icon: Star },
            { value: fmtPlus(SITE_STATS.ordersCompleted), sub: "Orders completed", icon: FileCheck },
            { value: `${SITE_STATS.avgDeliveryHours}h`, sub: "Avg. delivery time", icon: Clock },
            { value: fmtPlus(SITE_STATS.countriesServed), sub: "Countries served", icon: Globe },
            { value: "100%", sub: "Satisfaction guaranteed", icon: Shield },
            { value: "Unlimited", sub: "Free revisions", icon: RefreshCw },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.sub} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center hover:bg-white/10 transition-all">
                <Icon size={16} className="text-white/50 mb-1.5" />
                <span className="font-syne font-bold text-sm sm:text-lg text-white">{stat.value}</span>
                <span className="text-[10px] sm:text-[11px] text-white/40 mt-0.5">{stat.sub}</span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: CLIENT LOGOS
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SECTION 5: BEFORE/AFTER SHOWCASE (dedicated)
   ═══════════════════════════════════════════════════════════════ */

function _DeletedBeforeAfterShowcaseSection() { return null; }
function __unused_before_after() { return null; }
function __unused_body_after() {
  const [activeSet, setActiveSet] = useState(0);
  const current = [] as any;

  const BENEFITS = [
    { icon: "🧵", title: "Fabric-Aware Paths", desc: "Stitch angles and density tuned per material — caps, jackets, polos each get different treatment" },
    { icon: "🔤", title: "Sharp Small Text", desc: "Legible lettering at any size. Auto-trace can't handle text under 8mm — we can" },
    { icon: "⚡", title: "Clean Production Runs", desc: "Minimal thread breaks, efficient trims, fewer machine stops. Files run right first time" },
    { icon: "🎯", title: "Pixel-Perfect Registration", desc: "Every color change and boundary aligned. No gaps. No overlaps. No re-hooping" },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#FAFAF9]" aria-labelledby="showcase-heading">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          {/* ── Header ──────────────────────────────── */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <SectionBadge color="#F97316">Visual Proof</SectionBadge>
            <h2 id="showcase-heading" className="font-syne font-bold text-2xl sm:text-3xl md:text-5xl mt-3 mb-2 sm:mb-3 leading-[1.15] text-[var(--txt)]">
              See the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Difference</span>
            </h2>
            <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">
              Every file hand-digitized. No auto-trace. No shortcuts. The results speak for themselves.
            </p>
          </div>

          {/* ── Mobile layout (below lg) ──────────────── */}
          <div className="lg:hidden space-y-6">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all border-none cursor-pointer ${
                    activeSet === i
                      ? "bg-[#2563EB] text-white shadow-md"
                      : "bg-white text-[var(--txt2)] border border-[var(--border)] hover:bg-[var(--elevated)]"
                  }`}
                >
                  {set.label === "Digitizing" ? "🧵" : set.label === "Vector Art" ? "✏️" : "🏷️"}
                  {set.label}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-[var(--txt3)] -mt-4">← Swipe to compare →</p>

            {/* Benefits — compact icon grid */}
            <div>
              <h3 className="font-syne font-bold text-lg text-center mb-3 text-[var(--txt)]">
                Why Digitizing Wins
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex flex-col items-center text-center bg-white rounded-xl p-3 border border-[var(--border)]">
                    <span className="text-lg mb-1">{b.icon}</span>
                    <p className="text-[11px] font-semibold text-[var(--txt)] mb-0.5 leading-tight">{b.title}</p>
                    <p className="text-[10px] text-[var(--txt3)] leading-snug">{b.desc}</p>
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
          <div className="hidden lg:grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Slider + tabs */}
            <div>
              <BeforeAfterSlider
                beforeUrl={current.beforeUrl}
                afterUrl={current.afterUrl}
                beforeAlt={current.beforeAlt}
                afterAlt={current.afterAlt}
              />
              <div className="flex justify-center gap-1.5 mt-3.5">
                {BEFORE_AFTER_SETS.map((set, i) => (
                  <button
                    key={set.label}
                    onClick={() => setActiveSet(i)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
                      activeSet === i
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "bg-white text-[var(--txt2)] border border-[var(--border)] hover:bg-[var(--elevated)]"
                    }`}
                  >
                    {set.label}
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] text-[var(--txt3)] mt-2">← Drag the handle to compare before vs after →</p>
            </div>

            {/* Text + benefits */}
            <div className="text-left">
              <h3 className="font-syne font-bold text-2xl mb-5 text-[var(--txt)]">
                Why Hand-Digitizing Wins Every Time
              </h3>
              <div className="space-y-3.5">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{b.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--txt)] mb-0.5">{b.title}</p>
                      <p className="text-xs text-[var(--txt2)] leading-relaxed">{b.desc}</p>
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
                <span className="text-[11px] text-[var(--txt3)]">Free revisions · All formats · Pay when satisfied</span>
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

function _DeletedServicesSection() { return null; }
function __unused_services() { return null; }
function __unused_services_body() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="services-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="services-heading"
          label="What We Digitize"
          title="Every Garment."
          gradientTitle="Every Format."
          description="From standard left chest logos to complex 3D puff caps — we digitize for every application and every machine brand."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {SERVICES_GRID.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#2563EB]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline text-center"
            >
              <span className="text-2xl sm:text-3xl">{s.emoji}</span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--txt)] group-hover:text-[#2563EB] transition-colors leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/services"><Button variant="outline" size="sm" className="rounded-full" rightIcon={<ArrowRight size={14} />}>View All Services</Button></Link>
          <Link href="/contact"><Button variant="ghost" size="sm" className="rounded-full">Get a Custom Quote →</Button></Link>
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
    <section className="py-12 sm:py-16 md:py-20 bg-[#FAFAF9]" aria-labelledby="why-us-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="text-center mb-10 sm:mb-12">
            <SectionBadge color="#16A34A">Why Choose genxdigitizing</SectionBadge>
            <h2 id="why-us-heading" className="font-syne font-bold text-3xl md:text-5xl mt-3 mb-3 leading-[1.15] text-[var(--txt)]">
              Built for{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Professional Results</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
              Every feature of our service is designed around one outcome: files that run clean on your machine, with zero headaches.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative bg-white rounded-2xl p-5 sm:p-6 border border-[var(--border)] hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200 shadow-sm"
                >
                  <span
                    className="absolute top-4 right-4 text-[10px] font-bold font-mono tracking-tight px-2 py-0.5 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: `${item.color}12`, color: item.color }}
                  >
                    {item.stat}
                  </span>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}12` }}>
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <h3 className="font-syne font-bold text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--txt2)] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/services"><Button variant="grad" size="sm" rightIcon={<ArrowRight size={14} />}>Explore All Features</Button></Link>
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="process-heading"
          label="How It Works"
          title="Order in Minutes,"
          gradientTitle="Delivered Fast"
          description={`Your design goes through ${fmt(SITE_STATS.ordersCompleted)}+ orders worth of refined process. Simple, fast, reliable.`}
        />

        {/* Responsive: single DOM, adapts layout via grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-6 max-w-5xl mx-auto">
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.n} className="relative flex lg:flex-col items-center lg:text-center gap-3 lg:gap-0 bg-[var(--surface)] rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-[var(--border)] hover:border-[#2563EB]/20 lg:hover:-translate-y-1 transition-all duration-200 lg:shadow-sm">
              {/* Desktop arrow connector */}
              {i < PROCESS_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2563EB] text-white items-center justify-center text-xs font-bold shadow-md">→</div>
              )}
              {/* Mobile arrow */}
              {i < PROCESS_STEPS.length - 1 && (
                <span className="lg:hidden text-[var(--border3)] flex-shrink-0 ml-auto">↓</span>
              )}
              {/* Step number — desktop only */}
              <div className="hidden lg:block font-syne font-bold text-xs tracking-[0.2em] uppercase mb-3 text-[#2563EB]">Step {step.n}</div>
              {/* Icon */}
              <div className="w-10 h-10 lg:w-[52px] lg:h-[52px] rounded-lg lg:rounded-full flex-shrink-0 lg:mx-auto lg:mb-3 bg-[#EFF6FF] lg:border-2 lg:border-[#2563EB]/20 flex items-center justify-center text-lg lg:text-[22px]">{step.icon}</div>
              {/* Text */}
              <div className="min-w-0 lg:w-full">
                <h3 className="text-xs lg:text-base font-semibold lg:font-bold font-syne text-[var(--txt)] lg:mb-1.5">{step.title}</h3>
                <p className="text-[11px] lg:text-sm text-[var(--txt3)] lg:text-[var(--txt2)] leading-relaxed truncate lg:whitespace-normal">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/contact">
            <Button variant="grad" size="sm" className="rounded-full" rightIcon={<Upload size={14} />}>
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

function _DeletedCaseStudiesSection() { return null; }
function __unused_case_studies() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#FAFAF9]" aria-labelledby="case-studies-heading">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="text-center mb-10 sm:mb-12">
            <SectionBadge color="#7C3AED">Case Studies</SectionBadge>
            <h2 id="case-studies-heading" className="font-syne font-bold text-3xl md:text-5xl mt-3 mb-3 leading-[1.15] text-[var(--txt)]">
              Real Results for{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Real Businesses</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
              Not hypotheticals. These are actual production outcomes from clients who switched to genxdigitizing.
            </p>
          </div>

          <div className="space-y-8 sm:space-y-10">
            {CASE_STUDIES.map((cs, idx) => (
              <div key={cs.client} className="grid md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
                {/* Problem card */}
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-red-200 shadow-sm relative">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4 text-lg">⚠️</div>
                  <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full">The Problem</span>
                  <h3 className="font-syne font-bold text-lg text-[var(--txt)] mb-2">{cs.client}</h3>
                  <p className="text-[11px] text-[var(--txt3)] mb-3">{cs.industry}</p>
                  <p className="text-sm text-[var(--txt2)] leading-relaxed">{cs.problem}</p>
                </div>

                {/* Solution card */}
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-blue-200 shadow-sm relative">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-lg">🔧</div>
                  <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">The Solution</span>
                  <h3 className="font-syne font-bold text-lg text-[var(--txt)] mb-2">genxdigitizing Approach</h3>
                  <p className="text-sm text-[var(--txt2)] leading-relaxed">{cs.solution}</p>
                </div>

                {/* Results card */}
                <div className="bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg">
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-0.5 rounded-full">The Results</span>
                  <h3 className="font-syne font-bold text-lg mb-5">Measured Impact</h3>
                  <div className="space-y-5">
                    {cs.results.map((r) => (
                      <div key={r.label} className="flex items-baseline gap-2">
                        <div className="font-syne font-bold text-3xl sm:text-4xl leading-none">{r.metric}</div>
                        <div className="text-xs text-white/60">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-[var(--txt2)] mb-3">Want to be our next case study?</p>
            <Link href="/contact">
              <Button variant="grad" size="sm" rightIcon={<ArrowRight size={14} />}>Start Your Project</Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10: REVIEWS / TESTIMONIALS
   ═══════════════════════════════════════════════════════════════ */

function TestimonialsSection({ testimonials }: { testimonials: { name: string; company: string; text: string; stars: number; country: string; date?: string }[] }) {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="reviews-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          <div className="text-center mb-10 sm:mb-12">
            <SectionBadge color="#EAB308">Client Reviews</SectionBadge>
            <h2 id="reviews-heading" className="font-syne font-bold text-3xl md:text-5xl mt-3 mb-3 leading-[1.15]">
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Loved by {fmtPlus(SITE_STATS.clientsServed)}
              </span>{" "}
              Embroidery Pros
            </h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
              Real feedback from real embroidery professionals who run our files on production machines every day.
            </p>

            {/* Aggregate rating */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="#F59E0B" stroke="none" />)}
              </div>
              <span className="font-syne font-bold text-lg text-[var(--txt)]">{SITE_STATS.avgRating}/5</span>
              <span className="text-sm text-[var(--txt3)]">— {fmtPlus(SITE_STATS.verifiedReviews)} verified reviews</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto">
            {testimonials.slice(0, 6).map((t) => (
              <div key={t.name} className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] hover:border-[var(--border3)] transition-all duration-200">
                <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.stars} out of 5 stars`}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#F59E0B" stroke="none" />)}
                </div>
                <blockquote className="text-sm text-[var(--txt2)] leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">{t.name.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--txt)]">{t.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--txt3)]">
                      <span>{t.company}</span><span>·</span><span>{t.country}</span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[9px] font-medium">
                        <Shield size={9} /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/portfolio">
              <Button variant="outline" size="sm" className="rounded-full" rightIcon={<ArrowRight size={14} />}>See More Client Stories</Button>
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
    { name: "Embroidery Digitizing", emoji: "🧵", desc: "Clean, production-ready stitch files", price: "From $7", tiers: tiers.digitizing || [], gradient: "from-[#2563EB] to-[#1D4ED8]" },
    { name: "Vector Art Conversion", emoji: "✏️", desc: "Scalable vectors for print and web", price: "From $8", tiers: tiers.vector || [], gradient: "from-[#F97316] to-[#EA580C]" },
    { name: "Custom Patches", emoji: "🏷️", desc: "Embroidered, PVC, woven, leather", price: "From $5", tiers: tiers.sewout || [], gradient: "from-[#16A34A] to-[#15803D]" },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="pricing-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <SectionHeading id="pricing-heading" label="Pricing" title="Simple," gradientTitle="No-Surprise Pricing" description="All plans include free revisions, free format conversion, and free rush delivery. Pay only when satisfied." />

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className="relative flex flex-col rounded-2xl bg-[var(--surface)] p-6 sm:p-7 border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="text-center">
                <span className="text-3xl mb-3 block">{plan.emoji}</span>
                <h3 className="font-syne font-bold text-lg mb-1 text-[var(--txt)]">{plan.name}</h3>
                <p className="text-xs text-[var(--txt3)] mb-3">{plan.desc}</p>
                <div className={`font-syne font-bold text-3xl mb-1 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>{plan.price}</div>
                <p className="text-[10px] text-[var(--txt3)] mb-5">per design</p>
              </div>
              <div className="space-y-2 mb-6 flex-1">
                {plan.tiers.length > 0 ? (
                  plan.tiers.slice(0, 5).map((t) => (
                    <div key={t.size} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border)] last:border-b-0">
                      <span className="text-[var(--txt2)]">{t.size}</span>
                      <span className="font-semibold text-[var(--txt)]">{t.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--txt3)] text-center py-4">Starting at {plan.price.toLowerCase()}</p>
                )}
              </div>
              <Link href="/register" className="mt-auto">
                <Button variant="grad" size="sm" className="w-full">Order Now</Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-10 text-center">
          <p className="text-xs font-semibold text-[var(--txt3)] uppercase tracking-wider mb-4">Always Included — Free With Every Order</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--txt2)]">
            {["Unlimited revisions", "Format conversion", "Rush delivery", "Machine-tested", "Pay when satisfied"].map((f) => (
              <span key={f} className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" />{f}</span>
            ))}
          </div>
        </div>
        <div className="text-center mt-7">
          <p className="text-sm text-[var(--txt2)]">
            Bulk orders? <Link href="/pricing" className="text-[#2563EB] hover:underline font-semibold">See volume discounts</Link>{" "}·{" "}Enterprise? <Link href="/contact" className="text-[#2563EB] hover:underline font-semibold">Contact sales</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 12: MANUAL VS AUTO COMPARISON
   ═══════════════════════════════════════════════════════════════ */

function _DeletedManualVsAutoSection() { return null; }
function __unused_manual_vs_auto() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#FAFAF9]" aria-labelledby="comparison-heading">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <SectionHeading
          id="comparison-heading"
          label="Quality Comparison"
          title="Manual Digitizing vs"
          gradientTitle="Auto-Tracing Software"
          description="Cheap services use one-click auto-trace. We hand-place every stitch. Here's why it matters for your production floor."
        />

        {/* Mobile: compact cards */}
        <div className="lg:hidden space-y-2">
          {COMPARISON_ROWS.map((row) => (
            <div key={row.feature} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                <div className="p-3 bg-[#F0FDF4]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Check size={12} className="text-[#16A34A] flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">genxdigitizing</span>
                  </div>
                  <p className="text-[11px] text-[var(--txt2)] leading-snug font-medium">{row.manual}</p>
                </div>
                <div className="p-3 bg-[#FEF2F2]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-red-400 font-bold text-xs">✕</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Auto</span>
                  </div>
                  <p className="text-[11px] text-[var(--txt3)] leading-snug">{row.auto}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[var(--elevated)] border-t border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--txt2)]">{row.feature}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[var(--elevated)] border-b border-[var(--border)]">
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt2)]">Feature</div>
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5"><Check size={14} /> genxdigitizing Manual</div>
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt3)]">Auto-Trace Software</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-[1.5fr_1fr_1fr] ${i % 2 === 0 ? "bg-white" : "bg-[var(--surface)]"}`}>
              <div className="px-6 py-4 text-sm font-semibold text-[var(--txt)]">{row.feature}</div>
              <div className="px-6 py-4 text-sm text-[var(--txt2)] flex items-center gap-2"><Check size={14} className="text-[#16A34A] flex-shrink-0" />{row.manual}</div>
              <div className="px-6 py-4 text-sm text-[var(--txt3)] flex items-center gap-2"><span className="text-red-400 font-bold flex-shrink-0">✕</span>{row.auto}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-[var(--txt3)] mb-3">Don't risk your production with auto-trace files. See the difference firsthand.</p>
          <Link href="/contact">
            <Button variant="grad" size="sm" rightIcon={<Upload size={14} />}>Get a Manual-Digitized Sample</Button>
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
  const filtered = search.trim() ? faqs.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) : faqs;

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[var(--surface)] border-y border-[var(--border)]" aria-labelledby="faq-heading">
      <div className="max-w-[880px] mx-auto px-4 sm:px-6 md:px-12">
        <SectionHeading id="faq-heading" label="FAQ" title="Got Questions?" gradientTitle="We've Got Answers." />

        <div className="relative max-w-md mx-auto mb-8">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 transition-all"
            aria-label="Search frequently asked questions"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--txt3)] py-8">No matches. Try different search or <Link href="/contact" className="text-[#2563EB] hover:underline">contact us</Link>.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[var(--txt)] hover:bg-[var(--elevated)]/50 transition-colors"
                  aria-expanded={openIndex === i}
                >
                  <span>{f.q}</span>
                  {openIndex === i ? <ChevronUp size={16} className="text-[var(--txt3)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--txt3)] flex-shrink-0" />}
                </button>
                {openIndex === i && <div className="px-5 pb-4 text-sm text-[var(--txt2)] leading-relaxed">{f.a}</div>}
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
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-12 text-center">
        <AnimatedSection>
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl">
            <GradientOrb color="#60A5FA" size={350} className="-top-[30%] -right-[10%] opacity-10" />
            <GradientOrb color="#F97316" size={250} className="-bottom-[20%] -left-[10%] opacity-6" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-white border border-white/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                Start in Under 2 Minutes
              </span>

              <h2 className="font-syne font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-[1.1]">
                Ready for Files That Actually Run Clean?
              </h2>

              <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                Upload your design. Get a proof within hours. Pay only when you're satisfied. No risk. No minimums. No surprises.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <Link href="/contact">
                  <Button variant="grad" size="lg" className="w-full sm:w-auto !px-8 !py-4 !text-base !rounded-full" rightIcon={<Upload size={16} />}>
                    Get Free Quote
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="grad" size="lg" className="w-full sm:w-auto !px-8 !py-4 !rounded-full bg-white !text-[#2563EB] hover:bg-[#EFF6FF]">
                    Create Free Account
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" />Free revisions forever</span>
                <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" />All machine formats</span>
                <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" />Pay when satisfied</span>
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
  testimonials: any[];
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
    function onMove(e: MouseEvent | TouchEvent) { handleMove(e as any); }
    function onUp() { setIsDragging(false); }
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
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-12">
        <AnimatedSection>
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 mb-4">
              Visual Proof
            </span>
            <h2 id="showcase-heading" className="font-syne font-bold text-[clamp(28px,5vw,48px)] leading-[1.08] mb-3 text-[var(--txt)]">
              See the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Difference
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] max-w-lg mx-auto">
              Every file hand-digitized. No auto-trace. No shortcuts. The results speak for themselves.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {BEFORE_AFTER_SETS.map((set, i) => (
              <button
                key={set.label}
                onClick={() => { setActiveSet(i); setSliderPos(50); }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  i === activeSet
                    ? "bg-[#F97316] text-white shadow-sm"
                    : "bg-[var(--elevated)] border border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)]"
                }`}
              >
                {set.label}
              </button>
            ))}
          </div>

          {/* Before/After Slider — aspect-ratio set via CSS, no spacer img needed */}
          <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] rounded-[8px] overflow-hidden select-none cursor-ew-resize"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
            onMouseDown={handleDown}
            onTouchStart={handleDown}
          >
            {/* Before image (underneath — fills container) */}
            <img
              src={current.beforeUrl}
              alt={current.beforeAlt}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* After image (revealed by slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img
                src={current.afterUrl}
                alt={current.afterAlt}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </div>

            {/* Slider handle line */}
            <div
              className="absolute top-0 bottom-0 w-[3px] pointer-events-none"
              style={{
                left: `${sliderPos}%`,
                background: "linear-gradient(180deg, transparent 0%, #F97316 30%, #F97316 70%, transparent 100%)",
                boxShadow: "0 0 12px rgba(249,115,22,0.5)",
              }}
            />

            {/* Slider handle knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-12 h-12 rounded-full bg-[#F97316] shadow-2xl flex items-center justify-center ring-4 ring-white/90">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 5l-4 7 4 7" /><path d="M16 5l4 7-4 7" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <span className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#DC2626] text-white shadow-lg">
              Before
            </span>
            <span className="absolute top-4 right-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#16A34A] text-white shadow-lg">
              After
            </span>

            {/* Bottom overlay — title + category */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5"
              style={{
                background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
              }}
            >
              <div>
                <p className="text-white text-sm sm:text-base font-syne font-bold leading-tight">
                  {current.label}
                </p>
                <p className="text-white/70 text-[11px] sm:text-xs mt-0.5">
                  Hand-digitized embroidery — production-ready quality
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20">
                {activeSet === 0 ? "🧵 Digitizing" : activeSet === 1 ? "✏️ Vector Art" : "🏷️ Patches"}
              </span>
            </div>
          </div>

          <p className="text-center text-[11px] text-[var(--txt3)] mt-4">
            ⟷ Drag the handle to compare before vs after
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}

export function LandingClient({ services, process, testimonials, faqs }: Props) {
  const tiers: Record<string, { size: string; price: string }[]> = {};
  for (const svc of services) {
    const cat = svc.title.toLowerCase().includes("vector") ? "vector" : svc.title.toLowerCase().includes("patch") ? "sewout" : "digitizing";
    tiers[cat] = svc.tiers || [];
  }

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden pb-28 sm:pb-0">
      {/* 1. HERO */}
      <HeroSection />

      {/* 4. STATISTICS / OPERATIONS LIVE */}
      <TrustStatsSection />

      {/* PORTFOLIO PREVIEW */}
      <PortfolioPreview />

      {/* VISUAL PROOF — BEFORE/AFTER */}
      <BeforeAfterShowcaseSection />

      {/* CLIENT LOGO WALL */}
      <ClientLogoWall />

      {/* 7. WHY CHOOSE US */}
      <WhyChooseUsSection />

      {/* SEW-OUT GUARANTEE */}
      <SewOutGuarantee />

      {/* 8. HOW IT WORKS */}
      <HowItWorksSection />

      {/* PRICING */}
      <PricingSection tiers={tiers} />

      {/* 10. REVIEWS / TESTIMONIALS */}
      <TestimonialsSection testimonials={testimonials} />

      {/* FREE DESIGNS (lead magnet) */}
      <FreeDesignsPreview />

      {/* EMAIL CAPTURE */}
      <EmailCapture />

      {/* 11. FAQ */}
      <FAQSection faqs={faqs} />

      {/* 12. FINAL CTA */}
      <FinalCTASection />
    </div>
  );
}
