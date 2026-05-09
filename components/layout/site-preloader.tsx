"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

type PreloaderContextValue = {
  isRevealing: boolean;
};

const PreloaderContext = createContext<PreloaderContextValue>({
  isRevealing: false,
});

export function usePreloader() {
  return useContext(PreloaderContext);
}

const STORAGE_KEY = "genx-splash-seen";
const HOLD_MS = 1150;
const EXIT_MS = 620;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const exitEase = [0.76, 0, 0.24, 1] as [number, number, number, number];

type Phase = "hidden" | "entering" | "exiting" | "done";

function hasSeenSplash() {
  if (typeof window === "undefined") return false;

  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const alreadySeen = useMemo(() => hasSeenSplash(), []);

  const [isRevealing, setIsRevealing] = useState(alreadySeen);
  const [showPreloader, setShowPreloader] = useState(!alreadySeen);

  return (
    <PreloaderContext.Provider value={{ isRevealing }}>
      {showPreloader && (
        <SitePreloader
          onReveal={() => setIsRevealing(true)}
          onDone={() => setShowPreloader(false)}
        />
      )}

      <motion.div
        initial={alreadySeen ? false : { opacity: 0, y: 10 }}
        animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.45, ease }}
      >
        {children}
      </motion.div>
    </PreloaderContext.Provider>
  );
}

function SitePreloader({
  onReveal,
  onDone,
}: {
  onReveal: () => void;
  onDone: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("entering");

  const onRevealRef = useRef(onReveal);
  const onDoneRef = useRef(onDone);

  onRevealRef.current = onReveal;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (prefersReduced) {
      const timer = window.setTimeout(() => {
        onRevealRef.current();
        markSplashSeen();
        setPhase("done");
        onDoneRef.current();
      }, 250);

      return () => window.clearTimeout(timer);
    }

    const revealTimer = window.setTimeout(() => {
      onRevealRef.current();
      setPhase("exiting");
    }, HOLD_MS);

    const doneTimer = window.setTimeout(() => {
      markSplashSeen();
      setPhase("done");
      onDoneRef.current();
    }, HOLD_MS + EXIT_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
    };
  }, [prefersReduced]);

  if (phase === "done") return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#050814]"
      initial={{ opacity: 1 }}
      animate={
        phase === "exiting"
          ? {
              y: "-100%",
              opacity: 1,
            }
          : {
              y: "0%",
              opacity: 1,
            }
      }
      transition={
        phase === "exiting"
          ? {
              duration: EXIT_MS / 1000,
              ease: exitEase,
            }
          : {
              duration: 0,
            }
      }
    >
      <PreloaderBackground />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, scale: 0.86, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="relative"
        >
          <div className="absolute inset-0 -m-10 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
            <div className="relative h-[72px] w-[72px]">
              <Image
                src="/brand/genx-logo-white.png"
                alt="GenX Digitizing"
                fill
                priority
                sizes="72px"
                className="object-contain"
              />
            </div>
          </div>

          <motion.span
            className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-indigo-300 shadow-[0_0_18px_rgba(165,180,252,0.9)]"
            initial={prefersReduced ? false : { opacity: 0, scale: 0 }}
            animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.35 }}
          />

          <motion.span
            className="absolute -bottom-2 -left-2 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]"
            initial={prefersReduced ? false : { opacity: 0, scale: 0 }}
            animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.45 }}
          />
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease }}
        >
          <div className="text-2xl font-black tracking-[-0.04em] text-white">
            GenX Digitizing
          </div>

          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.26em] text-white/35">
            Premium Embroidery Studio
          </div>
        </motion.div>

        <div className="w-48 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-1 rounded-full bg-gradient-to-r from-indigo-300 via-cyan-300 to-blue-300"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: prefersReduced ? 0.2 : HOLD_MS / 1000,
              ease,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function PreloaderBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.26),transparent_38%),radial-gradient(circle_at_50%_72%,rgba(56,189,248,0.12),transparent_34%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,black,transparent_78%)]" />

      <svg
        className="absolute left-1/2 top-1/2 h-80 w-[54rem] -translate-x-1/2 -translate-y-1/2 opacity-25"
        viewBox="0 0 860 320"
        fill="none"
      >
        <motion.path
          d="M28 168 C126 42 232 288 352 134 C468 -14 594 246 704 112 C772 28 820 74 840 96"
          stroke="url(#preloaderThread)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="10 14"
          animate={{
            strokeDashoffset: [-220, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <defs>
          <linearGradient
            id="preloaderThread"
            x1="28"
            y1="0"
            x2="840"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#818cf8" />
            <stop offset="0.5" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}