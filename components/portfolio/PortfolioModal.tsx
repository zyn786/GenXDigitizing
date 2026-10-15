"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  ArrowUpRight,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Info,
  Images,
  CheckCircle2,
} from "lucide-react";
import { buildUploadHref } from "@/lib/portfolio-to-order";
import type { PortfolioItem } from "./data";

type GalleryTab = "all" | "sewout" | "compare";
type GalleryImage = NonNullable<PortfolioItem["images"]>[number];

type Props = {
  item: PortfolioItem | null;
  onClose: () => void;
};

/**
 * Clipboard write with a fallback for the contexts where the async Clipboard
 * API is unavailable — it needs a secure origin and a user gesture, so it is
 * missing on http:// and flaky behind some in-app browsers. The legacy
 * textarea path is deprecated but is the only thing that works there.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

export function PortfolioModal({ item, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState<GalleryTab>("all");
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const [failedUrl, setFailedUrl] = useState("");
  const [isMobileShare, setIsMobileShare] = useState(false);
  const shareTimer = useRef<number | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);

  const titleId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  /**
   * Identity for the effects below. They need to re-run when a *different*
   * project opens, not when the item object is re-created with identical
   * content — which is what a parent re-render does. Depending on `item`
   * directly would also satisfy the linter, but at the cost of tearing down
   * and rebuilding the focus trap and the scroll lock on every parent render.
   */
  const itemId = item?.id;

  const allImages = item?.images ?? [];

  const sewoutImages = allImages.filter((image) => image.isSewout);
  const beforeImages = allImages.filter((image) => image.isBefore && !image.isSewout);
  const afterImages = allImages.filter((image) => !image.isBefore && !image.isSewout);

  const compareImages: GalleryImage[] = beforeImages.length
    ? [...beforeImages, ...afterImages]
    : [];

  const tabs: { key: GalleryTab; label: string; count: number }[] = [
    { key: "all", label: "All photos", count: allImages.length },
    ...(sewoutImages.length
      ? [{ key: "sewout" as const, label: "Sew-outs", count: sewoutImages.length }]
      : []),
    ...(compareImages.length
      ? [{ key: "compare" as const, label: "Before / after", count: compareImages.length }]
      : []),
  ];

  const images = tab === "sewout" ? sewoutImages : tab === "compare" ? compareImages : allImages;

  const total = images.length;
  const index = total ? Math.min(activeIdx, total - 1) : 0;
  const current = images[index];
  const accent = item?.accent || item?.category?.color || "#2563EB";

  useEffect(() => {
    setActiveIdx(0);
    setTab("all");
    setShareState("idle");
    setFailedUrl("");
    touchStart.current = null;
    suppressClickUntil.current = 0;
  }, [itemId]);

  useEffect(() => {
    if (!itemId || !mounted) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Avoid the layout jump caused by removing the scrollbar.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [itemId, mounted]);

  useEffect(() => {
    if (!itemId || !mounted) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      if (previousFocus.current?.isConnected) {
        previousFocus.current.focus({ preventScroll: true });
      }
      previousFocus.current = null;
    };
  }, [itemId, mounted]);

  /**
   * Keep the active thumbnail in view. With a dozen photos the strip scrolls,
   * and arrowing or swiping to photo 11 would otherwise leave the highlight
   * off-screen — the strip looks frozen while the image changes.
   *
   * Scrolls the strip directly rather than calling scrollIntoView, which can
   * also scroll the dialog and every ancestor above it.
   */
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !active) return;

    const target = active.offsetLeft - (strip.clientWidth - active.clientWidth) / 2;
    strip.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [index, reduceMotion]);

  const close = useCallback(() => {
    touchStart.current = null;
    suppressClickUntil.current = 0;
    setActiveIdx(0);
    setTab("all");
    setShareState("idle");
    setFailedUrl("");
    onClose();
  }, [onClose]);

  /* ── Share ────────────────────────────────────────────────
     Mobile gets the native share sheet, so a sample can go straight to
     WhatsApp, Instagram, Mail — anywhere the device can send. Desktop just
     copies the link.

     The split is not "is navigator.share present": desktop Chrome and Edge
     both expose it, and firing it there opens an OS share dialog nobody
     asked for. A phone or tablet is a coarse pointer with no hover; a
     touchscreen laptop still reports hover and a fine pointer from its
     trackpad, so it stays on the copy path.

     The copied link is the portfolio route with `?item=<slug>`, which
     PortfolioClient already auto-opens — so it lands the recipient on this
     exact project whichever page the sender was on. */
  const handleShare = useCallback(async () => {
    if (!item) return;
    const url = `${window.location.origin}/portfolio?item=${encodeURIComponent(item.slug)}`;

    if (isMobileShare && navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} — genxdigitizing`,
          text: `${item.title} — a real embroidery digitizing sample from genxdigitizing.`,
          url,
        });
        return;
      } catch (error) {
        // AbortError means they dismissed the sheet — that is not a failure,
        // so do not fall through to the clipboard and contradict them.
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }

    const copied = await copyToClipboard(url);
    setShareState(copied ? "copied" : "error");
    setFailedUrl(copied ? "" : url);
    if (shareTimer.current) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => {
      setShareState("idle");
      setFailedUrl("");
    }, 4000);
  }, [item, isMobileShare]);

  useEffect(() => {
    return () => {
      if (shareTimer.current) window.clearTimeout(shareTimer.current);
    };
  }, []);

  // Resolved after mount: matchMedia is unavailable during SSR, and reading it
  // in render would make the button label a hydration mismatch.
  useEffect(() => {
    setIsMobileShare(
      typeof navigator !== "undefined" &&
        !!navigator.share &&
        window.matchMedia("(pointer: coarse)").matches &&
        window.matchMedia("(hover: none)").matches
    );
  }, []);

  const prev = useCallback(() => {
    if (total < 2) return;
    setActiveIdx((i) => (i <= 0 || i >= total ? total - 1 : i - 1));
  }, [total]);

  const next = useCallback(() => {
    if (total < 2) return;
    setActiveIdx((i) => (i >= total - 1 ? 0 : i + 1));
  }, [total]);

  useEffect(() => {
    if (!itemId || !mounted) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "ArrowLeft" && total > 1) {
        event.preventDefault();
        prev();
        return;
      }

      if (event.key === "ArrowRight" && total > 1) {
        event.preventDefault();
        next();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [itemId, mounted, total, close, prev, next]);

  function handleTouchStart(event: React.TouchEvent) {
    suppressClickUntil.current = 0;

    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;

    if (!start || total < 2 || event.changedTouches.length !== 1) return;

    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;

    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) {
      return;
    }

    suppressClickUntil.current = Date.now() + 600;
    if (dx > 0) prev();
    else next();
  }

  if (!mounted || !item) return null;

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  const modal = (
    <AnimatePresence>
      <motion.div
        key="portfolio-backdrop"
        className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-[#050816]/50 p-0 backdrop-blur-sm sm:p-5 lg:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        onClick={() => {
          if (Date.now() < suppressClickUntil.current) {
            suppressClickUntil.current = 0;
            return;
          }
          close();
        }}
      >
        {/* On phones the dialog is its own scroll container, capped at one
            viewport — that is what lets the action bar below stick to the
            bottom edge, since `sticky` has nothing to hold onto when an
            ancestor does the scrolling. Desktop keeps the clipped, fixed-height
            panel whose columns scroll independently. */}
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative my-auto flex max-h-[100dvh] min-h-[100dvh] w-full max-w-[1240px] flex-col overflow-y-auto overscroll-contain border border-[var(--border2)] bg-[var(--bg)] text-[var(--txt)] shadow-[0_30px_120px_rgba(5,8,22,0.28)] outline-none sm:max-h-none sm:min-h-0 sm:overflow-hidden sm:rounded-2xl lg:rounded-[22px]"
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={transition}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Close button. Stays dark: it sits on top of whatever photo is
              showing, and a light control is unreadable over a light image. */}
          <button
            ref={closeRef}
            type="button"
            aria-label="Close portfolio modal"
            onClick={close}
            style={{ top: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
            className="absolute right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 backdrop-blur-xl transition hover:bg-black/65 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          >
            <X size={19} />
          </button>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.9fr)]">
            {/* LEFT: image gallery */}
            <section className="flex min-w-0 flex-col border-b border-[var(--border)] bg-[var(--surface)] p-3 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
              <div className="mb-3 flex items-center justify-between gap-3 pr-12 sm:mb-4 sm:pr-14">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--txt3)]">
                    GENX DIGITIZING
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--txt2)]">Project gallery</p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5 text-[10px] tabular-nums text-[var(--txt2)]">
                  {String(total ? index + 1 : 0).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </span>
              </div>

              <div
                className="relative flex h-[46vh] max-h-[540px] min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--elevated)] sm:h-[45vh] sm:min-h-[300px] lg:h-[min(58vh,570px)] lg:min-h-[360px]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => {
                  touchStart.current = null;
                }}
                style={{ touchAction: "pan-y" }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at center, ${accent}40, transparent 70%)`,
                  }}
                />

                {current ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${tab}-${current.url}`}
                      className="absolute inset-0 flex items-center justify-center p-3 sm:p-5"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={transition}
                    >
                      <Image
                        src={current.url}
                        alt={current.alt || item.title}
                        width={1600}
                        height={1200}
                        priority
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        draggable={false}
                        className="h-full w-full select-none object-contain"
                      />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="px-5 text-center text-sm text-[var(--txt3)]">
                    No photos in this collection.
                  </div>
                )}

                {current && (current.isSewout || current.isBefore) && (
                  <span
                    className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold backdrop-blur-xl sm:left-4 sm:top-4 ${
                      current.isSewout
                        ? "border-emerald-300 bg-emerald-50/95 text-emerald-700"
                        : "border-red-300 bg-red-50/95 text-red-700"
                    }`}
                  >
                    {current.isSewout ? (
                      <BadgeCheck size={13} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {current.isSewout ? "Real sew-out" : "Before digitizing"}
                  </span>
                )}

                {/* Arrows stay dark — they sit on the photo, not the panel. */}
                {total > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={prev}
                      className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-lg transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:left-3 sm:h-10 sm:w-10"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={next}
                      className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-lg transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:right-3 sm:h-10 sm:w-10"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip. `relative` is load-bearing: it makes the
                  strip the offsetParent, so each thumbnail's offsetLeft is
                  measured against the strip rather than the dialog — which is
                  what the scroll-into-view effect below relies on. */}
              {total > 1 && (
                <div
                  ref={stripRef}
                  role="group"
                  aria-label="Choose a gallery photo"
                  className="scrollbar-none relative mt-3 flex gap-2 overflow-x-auto pb-2 sm:mt-4"
                >
                  {images.map((image, i) => (
                    <button
                      key={`${image.url}-${i}`}
                      type="button"
                      aria-label={`Show photo ${i + 1} of ${total}`}
                      aria-pressed={i === index}
                      aria-current={i === index ? "true" : undefined}
                      onClick={() => setActiveIdx(i)}
                      className={`relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-lg border bg-[var(--elevated)] transition sm:h-[66px] sm:w-[66px] ${
                        i === index
                          ? "border-[#2563EB] ring-2 ring-[#2563EB]/35"
                          : "border-[var(--border2)] opacity-60 hover:opacity-100"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]`}
                    >
                      <Image
                        src={image.thumbnailUrl || image.url}
                        alt=""
                        width={100}
                        height={100}
                        sizes="66px"
                        className="h-full w-full object-cover"
                      />
                      {image.isSewout && (
                        <span
                          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tabs under the filmstrip on small screens */}
              {tabs.length > 1 && (
                <div
                  role="group"
                  aria-label="Filter gallery"
                  className="mt-2 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-1 lg:hidden"
                >
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={tab === t.key}
                      onClick={() => {
                        setTab(t.key);
                        setActiveIdx(0);
                      }}
                      className={`shrink-0 rounded-lg px-3 py-2 text-[10px] transition ${
                        tab === t.key
                          ? "bg-[#2563EB] text-white"
                          : "text-[var(--txt2)] hover:text-[var(--txt)]"
                      }`}
                    >
                      {t.label} <span className="opacity-70">{t.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* RIGHT: project information */}
            <aside className="flex min-w-0 flex-col p-4 sm:p-6 lg:max-h-[min(88vh,820px)] lg:overflow-y-auto lg:p-7">
              <div className="mb-5 pr-10 sm:mb-7">
                {item.category && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      color: accent,
                      borderColor: `${accent}50`,
                      backgroundColor: `${accent}15`,
                    }}
                  >
                    {item.category.emoji} {item.category.name}
                  </span>
                )}

                <h2
                  id={titleId}
                  className="mt-4 font-syne text-2xl font-bold leading-tight tracking-[-0.045em] text-[var(--txt)] sm:text-3xl"
                >
                  {item.title}
                </h2>

                {/* Hidden on phones: a full project description pushes the
                    gallery and the actions out of reach on a small screen. */}
                {item.description && (
                  <p className="mt-3 hidden text-[13px] leading-6 text-[var(--txt2)] sm:block">
                    {item.description}
                  </p>
                )}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5 text-[10px] text-[var(--txt2)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Case-study details */}
              <div className="hidden flex-1 space-y-4 sm:block">
                {item.industry && <DetailRow label="Industry" value={item.industry} />}
                {item.challenge && (
                  <DetailRow label="Challenge" value={item.challenge} color="red" />
                )}
                {item.solution && <DetailRow label="Solution" value={item.solution} color="blue" />}
                {item.result && <DetailRow label="Result" value={item.result} color="green" />}
              </div>

              {/* Desktop gallery filter */}
              {tabs.length > 1 && (
                <div className="mt-7 hidden border-t border-[var(--border)] pt-5 lg:block">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--txt)]">
                      <Images size={17} className="text-[var(--txt3)]" />
                      Gallery
                    </div>
                    <span className="text-xs tabular-nums text-[var(--txt3)]">
                      {index + 1} / {total}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--elevated)] p-1">
                    {tabs.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        aria-pressed={tab === t.key}
                        onClick={() => {
                          setTab(t.key);
                          setActiveIdx(0);
                        }}
                        className={`flex-1 rounded-lg px-2 py-2.5 text-[10px] transition ${
                          tab === t.key
                            ? "bg-[#2563EB] text-white"
                            : "text-[var(--txt2)] hover:bg-[var(--border)] hover:text-[var(--txt)]"
                        }`}
                      >
                        {t.label} <span className="opacity-70">{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions. The primary CTA lives in the sticky bar on phones
                  instead, so it is never the other side of a long scroll. */}
              <div className="mt-7 space-y-2.5 border-t border-[var(--border)] pt-5">
                <Link
                  href={buildUploadHref(item)}
                  className="group hidden min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-center text-xs font-semibold text-white transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:flex sm:text-sm"
                >
                  <Sparkles size={16} />
                  Make something like this
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                {/* Phone gets this in the sticky bar instead, alongside the CTA. */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-2.5 text-xs font-medium text-[var(--txt2)] transition hover:border-[var(--border3)] hover:text-[var(--txt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:flex"
                >
                  {shareState === "copied" ? (
                    <Check size={15} className="text-emerald-600" />
                  ) : shareState === "error" ? (
                    <AlertCircle size={15} className="text-amber-600" />
                  ) : isMobileShare ? (
                    <Share2 size={15} />
                  ) : (
                    <Copy size={15} />
                  )}
                  <span aria-live="polite">
                    {shareState === "copied"
                      ? "Link copied"
                      : shareState === "error"
                        ? "Couldn't copy automatically"
                        : isMobileShare
                          ? "Share this sample"
                          : "Copy link"}
                  </span>
                </button>

                {/* Clipboard can refuse — no secure origin, or a locked-down
                    in-app browser. Hand over the link itself instead of a
                    dead-end error. */}
                {shareState === "error" && failedUrl && (
                  <p className="hidden select-all rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-3 py-2 text-[10px] leading-relaxed text-[var(--txt2)] [overflow-wrap:anywhere] sm:block">
                    {failedUrl}
                  </p>
                )}
              </div>

              <div className="mt-5 hidden items-center justify-center gap-2 text-[9px] text-[var(--txt3)] lg:flex">
                <CheckCircle2 size={12} />
                Crafted with precision by GenX Digitizing
              </div>
            </aside>
          </div>

          {/* Phone-only action bar. Sticky rather than fixed: it takes part in
              layout, so it never covers the end of the panel, and it does not
              care that framer-motion's transform on the dialog would otherwise
              break `position: fixed`. */}
          <div
            className="bg-[var(--bg)]/95 sticky bottom-0 z-30 border-t border-[var(--border)] px-3 py-3 backdrop-blur-sm sm:hidden"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {/* The clipboard can refuse; show the link rather than a dead end. */}
            {shareState === "error" && failedUrl && (
              <p className="mb-2 select-all rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-3 py-2 text-[10px] leading-relaxed text-[var(--txt2)] [overflow-wrap:anywhere]">
                {failedUrl}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Link
                href={buildUploadHref(item)}
                className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Sparkles size={16} />
                Make something like this
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              {/* Both actions stay reachable without scrolling the panel. */}
              <button
                type="button"
                onClick={handleShare}
                aria-label={isMobileShare ? "Share this sample" : "Copy link"}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt2)] transition hover:border-[var(--border3)] hover:text-[var(--txt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                {shareState === "copied" ? (
                  <Check size={18} className="text-emerald-600" />
                ) : shareState === "error" ? (
                  <AlertCircle size={18} className="text-amber-600" />
                ) : isMobileShare ? (
                  <Share2 size={18} />
                ) : (
                  <Copy size={18} />
                )}
                <span className="sr-only" aria-live="polite">
                  {shareState === "copied" ? "Link copied" : ""}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

function DetailRow({
  label,
  value,
  color = "neutral",
}: {
  label: string;
  value: string;
  color?: "neutral" | "red" | "blue" | "green";
}) {
  const colors = {
    neutral: "bg-[var(--elevated)] text-[var(--txt3)]",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
      >
        {color === "green" ? (
          <CheckCircle2 size={16} />
        ) : color === "red" ? (
          <Info size={16} />
        ) : color === "blue" ? (
          <Sparkles size={16} />
        ) : (
          <Info size={16} />
        )}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--txt3)]">
          {label}
        </p>
        <p className="text-xs leading-relaxed text-[var(--txt2)] sm:text-[13px]">{value}</p>
      </div>
    </div>
  );
}
