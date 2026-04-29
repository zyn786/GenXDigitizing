"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { CheckCircle2, Clock3, Download, FileText, RefreshCw, Zap } from "lucide-react";

/* ── animated stitch counter ─────────────────────────────── */
function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const ctrl = animate(0, target, {
      duration: 2.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [target]);

  return <>{display.toLocaleString()}</>;
}

/* ── main component ───────────────────────────────────────── */
export function HeroMockup() {
  const ref = React.useRef<HTMLDivElement>(null);
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const spring = { stiffness: 200, damping: 30 };
  const rotateX = useSpring(useTransform(yRaw, [-0.5, 0.5], [9, -9]), spring);
  const rotateY = useSpring(useTransform(xRaw, [-0.5, 0.5], [-9, 9]), spring);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRaw.set((e.clientX - r.left) / r.width - 0.5);
    yRaw.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <div className="relative w-full select-none" onMouseMove={onMove} onMouseLeave={() => { xRaw.set(0); yRaw.set(0); }}>

      {/* ── floating ambient orbs behind the card ── */}
      <motion.div
        className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* ── main 3D card ── */}
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Card body */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-br from-slate-900/95 to-slate-950/98 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl dark:from-slate-900/95 dark:to-slate-950/98">

          {/* Glare overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20">
                <FileText className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Active Order
                </div>
                <div className="text-xs font-semibold text-white/90">ORD-2847</div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
              Proof Ready
            </span>
          </div>

          {/* Order name */}
          <div className="mb-1 text-base font-semibold text-white">
            Cap Front — 3D Puff Digitizing
          </div>
          <div className="mb-4 text-xs text-white/45">Northline Uniforms · Left panel, 58mm</div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-white/40">Completion</span>
              <span className="font-semibold text-indigo-400">87%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: "87%" }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Stitch Count", value: <AnimatedNumber target={14280} /> },
              { label: "Format", value: "DST · PES" },
              { label: "Rush", value: "24 hr" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/5 px-2.5 py-2 text-center">
                <div className="text-[9px] uppercase tracking-wider text-white/35">{label}</div>
                <div className="mt-0.5 text-xs font-semibold text-white/85">{value}</div>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500/20 py-2 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/20 transition hover:bg-indigo-500/30">
              <RefreshCw className="h-3 w-3" />
              Request revision
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition hover:bg-indigo-400">
              <Download className="h-3 w-3" />
              Download file
            </button>
          </div>
        </div>

        {/* ── floating z-lifted badges (3D depth effect) ── */}
        <motion.div
          style={{ transform: "translateZ(40px)" }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute -right-5 -top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur-xl"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-white/80">Proof approved</span>
        </motion.div>

        <motion.div
          style={{ transform: "translateZ(35px)" }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute -bottom-4 -left-5 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur-xl"
        >
          <Zap className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] font-semibold text-white/80">Rush · 4 hr slot open</span>
        </motion.div>

        <motion.div
          style={{ transform: "translateZ(30px)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -left-6 top-1/3 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur-xl"
        >
          <Clock3 className="h-3 w-3 text-indigo-400" />
          <span className="text-[10px] font-semibold text-white/80">24 hr delivery</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
