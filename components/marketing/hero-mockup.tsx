"use client";

import * as React from "react";
import { animate } from "framer-motion";
import { FileText, Download, RefreshCw } from "lucide-react";

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
  return (
    <div className="relative w-full select-none">
      {/* 2D static card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-slate-900/95 to-slate-950/98 p-5 shadow-lg dark:from-slate-900/95 dark:to-slate-950/98">

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
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: "87%" }}
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
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-400">
            <Download className="h-3 w-3" />
            Download file
          </button>
        </div>
      </div>
    </div>
  );
}
