"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

/* ── Context ─────────────────────────────────────────────────────────────── */

interface PreloaderCtx {
  isRevealing: boolean;
}

const PreloaderContext = createContext<PreloaderCtx>({ isRevealing: false });
export const usePreloader = () => useContext(PreloaderContext);

/* ── Timing ──────────────────────────────────────────────────────────────── */

const HOLD_MS = 1900;
const EXIT_MS = 680;

/* ── Provider ─────────────────────────────────────────────────────────────── */

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [skip, setSkip] = useState(false);

  // Synchronously check before first paint — avoids flash on returning visits
  useLayoutEffect(() => {
    if (sessionStorage.getItem("genx-splash-seen")) {
      setIsRevealing(true);
      setSkip(true);
    }
  }, []);

  return (
    <PreloaderContext.Provider value={{ isRevealing }}>
      {!skip && <SitePreloaderInner onReveal={() => setIsRevealing(true)} />}
      {children}
    </PreloaderContext.Provider>
  );
}

/* ── Inner preloader ─────────────────────────────────────────────────────── */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const SLIDE_EASE = [0.76, 0, 0.24, 1] as [number, number, number, number];

const CORNER_DOTS: Array<{
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}> = [
  { top: -10, left: -10 },
  { top: -10, right: -10 },
  { bottom: -10, left: -10 },
  { bottom: -10, right: -10 },
];

type Phase = "entering" | "exiting" | "done";

function SitePreloaderInner({ onReveal }: { onReveal: () => void }) {
  const [phase, setPhase] = useState<Phase>("entering");
  const prefersReduced = useReducedMotion();
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const t = setTimeout(() => {
        revealRef.current();
        setPhase("done");
        sessionStorage.setItem("genx-splash-seen", "1");
      }, 400);
      return () => clearTimeout(t);
    }

    const t1 = setTimeout(() => {
      revealRef.current();
      setPhase("exiting");
    }, HOLD_MS);

    const t2 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("genx-splash-seen", "1");
    }, HOLD_MS + EXIT_MS + 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  /* Reduced-motion: simple overlay that fades and is done */
  if (prefersReduced) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07111f]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-16 w-16">
            <Image
              src="/brand/genx-logo-white.png"
              alt="GenX Digitizing"
              fill
              className="object-contain"
              priority
              sizes="64px"
            />
          </div>
          <p className="text-lg font-bold tracking-tight text-white">
            GenX Digitizing
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#07111f]"
      animate={{ y: phase === "exiting" ? "-100%" : "0%" }}
      transition={
        phase === "exiting"
          ? { duration: EXIT_MS / 1000, ease: SLIDE_EASE }
          : { duration: 0 }
      }
    >
      {/* Radial background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(139,92,246,0.14),transparent_45%)]" />
      </div>

      {/* Breathing ambient blob */}
      <motion.div
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-indigo-500/[0.06] blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-7">

        {/* 3-D logo zone */}
        <div className="relative" style={{ perspective: "900px" }}>

          {/* Glow halo behind logo */}
          <motion.div
            className="absolute inset-0 -m-12 rounded-full bg-gradient-to-br from-indigo-500/25 to-violet-500/20 blur-2xl"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.1, ease: EASE }}
          />

          {/* Logo — 3-D entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotateY: -28, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
            transition={{ duration: 1.0, ease: EASE }}
            style={{ transformStyle: "preserve-3d", width: 88, height: 88 }}
          >
            <div className="relative h-[88px] w-[88px] overflow-hidden">
              <Image
                src="/brand/genx-logo-white.png"
                alt="GenX Digitizing"
                fill
                className="object-contain"
                priority
                sizes="88px"
              />

              {/* Shine sweep */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                <motion.div
                  className="absolute inset-y-0 w-2/5 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                  initial={{ x: "-150%" }}
                  animate={{ x: "220%" }}
                  transition={{ duration: 0.55, delay: 1.15, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Stitch corner dots */}
          {CORNER_DOTS.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-indigo-400/50"
              style={pos}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.72 + i * 0.07 }}
            />
          ))}
        </div>

        {/* Brand name + tagline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5, ease: EASE }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <span className="text-xl font-bold tracking-tight text-white">
            GenX Digitizing
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">
            Premium Embroidery Studio
          </span>
        </motion.div>

        {/* Thread progress bar */}
        <div className="relative h-px w-44 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: (HOLD_MS - 300) / 1000,
              delay: 0.4,
              ease: EASE,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}