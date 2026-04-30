"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { EmbroideryHoop } from "./embroidery-hoop";


function threadPath(pts: [number, number][]) {
  return pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} Q ${cx} ${py} ${x} ${y}`;
  }, "");
}

const THREAD_TOP = threadPath([
  [0, 18], [80, 8], [160, 22], [240, 6], [320, 20], [400, 10],
]);

const THREAD_BOT = threadPath([
  [0, 14], [90, 24], [180, 10], [270, 26], [360, 12], [400, 20],
]);

const callouts = [
  { label: "Satin stitch",       desc: "Clean columns for letters, borders, and detail shapes" },
  { label: "Fill & underlay",    desc: "Proper density and underlay for every fabric weight" },
  { label: "Run stitch routing", desc: "Optimized pathing reduces trims and production time" },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function StitchTransformSection() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = React.useState(0);

  const cdn = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";
  const images = React.useMemo(() => [
    { real: `${cdn}/Digitizing/Before-1.png`, digital: `${cdn}/Digitizing/After-1.png` },
    { real: `${cdn}/Digitizing/Before-2.png`, digital: `${cdn}/Digitizing/After-2.png` },
    { real: `${cdn}/Digitizing/Before-3.png`, digital: `${cdn}/Digitizing/After-3.png` },
    { real: `${cdn}/Digitizing/Before-4.png`, digital: `${cdn}/Digitizing/After-4.png` },
    { real: `${cdn}/Digitizing/Before-5.png`, digital: `${cdn}/Digitizing/After-5.png` },
    { real: `${cdn}/Digitizing/Before-6.png`, digital: `${cdn}/Digitizing/After-6.png` },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24">
      {/* Thread lines */}
      <svg
        viewBox="0 0 400 32"
        className="absolute inset-x-0 top-0 w-full opacity-30"
        preserveAspectRatio="none"
      >
        <motion.path
          d={THREAD_TOP}
          fill="none"
          stroke="#c4952a"
          strokeWidth="1.4"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.8 }}
        />
        <motion.path
          d={THREAD_BOT}
          fill="none"
          stroke="#1e3a7b"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 2 }}
        />
      </svg>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">

          {/* LEFT: thumbnail strip + main viewer */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4 lg:flex-row lg:h-full"
          >
            {/* Thumbnails — horizontal scroll on mobile, vertical column on desktop */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:justify-center lg:overflow-visible lg:pb-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-md overflow-hidden border transition-all duration-300 ${
                    activeIndex === i
                      ? "border-yellow-400 scale-105 shadow-lg"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  {img.real ? (
                    <Image
                      src={img.real}
                      alt={`Preview ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center -z-10">
                    <span className="text-white/30 text-lg">🧵</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Main viewer */}
            <div className="min-h-[300px] sm:min-h-[420px] lg:flex-1 lg:min-h-[600px]">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="h-full"
              >
                <EmbroideryHoop
                  realSrc={images[activeIndex].real}
                  digitalSrc={images[activeIndex].digital}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT: text content */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="section-eyebrow">Stitch by stitch</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Your artwork, built to run on a real machine.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Digitizing isn&apos;t just tracing. Every file we deliver is built with correct
                underlay, optimized stitch density, and pathing that runs cleanly on commercial
                embroidery machines — from left-chest logos to full jacket backs.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease }}
            >
              {callouts.map(({ label, desc }, i) => (
                <motion.div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.4 + i * 0.1, ease }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden>
                    <motion.line
                      x1="2" y1="10" x2="2" y2="10"
                      stroke="#1e3a7b" strokeWidth="2.5" strokeLinecap="round"
                      animate={inView ? { x2: 18 } : {}}
                      transition={{ duration: 0.5, delay: 0.55 + i * 0.1, ease: "easeOut" }}
                    />
                    <motion.line
                      x1="2" y1="14" x2="2" y2="14"
                      stroke="#c4952a" strokeWidth="2" strokeLinecap="round"
                      animate={inView ? { x2: 14 } : {}}
                      transition={{ duration: 0.4, delay: 0.65 + i * 0.1, ease: "easeOut" }}
                    />
                    <motion.line
                      x1="2" y1="6" x2="2" y2="6"
                      stroke="#1e3a7b" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"
                      animate={inView ? { x2: 12 } : {}}
                      transition={{ duration: 0.35, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs leading-5 text-muted-foreground">{desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
