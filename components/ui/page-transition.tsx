"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Phase = "idle" | "covering" | "uncovering";

const COVER_MS   = 200;   // fade-in speed
const HOLD_MS    = 120;   // pause at full opacity before revealing new page
const UNCOVER_MS = 320;   // fade-out speed

export function PageTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = React.useState<Phase>("idle");

  // Track the previous pathname so we only animate on actual changes
  const prevPath = React.useRef(pathname);

  // Intercept internal link clicks to start the "covering" phase
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Skip: external, hash-only, same page, or special protocols
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href === pathname ||
        anchor.target === "_blank" ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) return;

      setPhase("covering");
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Once the new pathname lands, start uncovering
  React.useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // If we're covering, wait for the cover to finish then uncover
    // If we somehow got here without covering (e.g. browser back), uncover from idle too
    const totalCoverDelay = phase === "covering" ? COVER_MS + HOLD_MS : 0;

    const timer = setTimeout(() => {
      setPhase("uncovering");
    }, totalCoverDelay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // After uncover animation completes, return to idle
  React.useEffect(() => {
    if (phase !== "uncovering") return;
    const timer = setTimeout(() => setPhase("idle"), UNCOVER_MS + 50);
    return () => clearTimeout(timer);
  }, [phase]);

  const visible = phase !== "idle";

  return (
    <div
      aria-hidden="true"
      style={{
        opacity: phase === "covering" ? 1 : phase === "uncovering" ? 0 : 0,
        transition:
          phase === "covering"
            ? `opacity ${COVER_MS}ms ease-in`
            : phase === "uncovering"
              ? `opacity ${UNCOVER_MS}ms cubic-bezier(0.4,0,0.2,1)`
              : "none",
        pointerEvents: visible ? "all" : "none",
      }}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#07111f]"
    >
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(99,102,241,0.3),transparent_55%)]" />

      {/* Logo mark */}
      <div
        style={{
          transform: phase === "covering" ? "scale(1)" : "scale(0.92)",
          transition: `transform ${UNCOVER_MS}ms cubic-bezier(0.4,0,0.2,1)`,
        }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <div className="relative h-12 w-12 drop-shadow-[0_0_18px_rgba(99,102,241,0.6)]">
          <Image
            src="/brand/genx-logo-white.png"
            alt="GenX"
            fill
            className="object-contain"
            priority
            sizes="48px"
          />
        </div>

        {/* Stitch line */}
        <div className="relative h-px w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-[length:200%_100%]"
            style={{
              animation: visible ? "transition-shimmer 0.9s ease-in-out infinite" : "none",
              width: "100%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes transition-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
