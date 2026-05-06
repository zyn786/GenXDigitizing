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
  [0, 18],
  [80, 8],
  [160, 22],
  [240, 6],
  [320, 20],
  [400, 10],
]);

const THREAD_BOT = threadPath([
  [0, 14],
  [90, 24],
  [180, 10],
  [270, 26],
  [360, 12],
  [400, 20],
]);

const callouts = [
  {
    label: "Satin stitch",
    desc: "Clean columns for letters, borders, and detail shapes",
  },
  {
    label: "Fill & underlay",
    desc: "Proper density and underlay for every fabric weight",
  },
  {
    label: "Run stitch routing",
    desc: "Optimized pathing reduces trims and production time",
  },
];

const images = [
  {
    real: "/digitizing/Before-1.png",
    digital: "/digitizing/After-1.png",
  },
  {
    real: "/digitizing/Before-2.png",
    digital: "/digitizing/After-2.png",
  },
  {
    real: "/digitizing/Before-3.png",
    digital: "/digitizing/After-3.png",
  },
  {
    real: "/digitizing/Before-4.png",
    digital: "/digitizing/After-4.png",
  },
  {
    real: "/digitizing/Before-5.png",
    digital: "/digitizing/After-5.png",
  },
  {
    real: "/digitizing/Before-6.png",
    digital: "/digitizing/After-6.png",
  },
] as const;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const THREAD_LINES = [
  {
    path: THREAD_TOP,
    color: "#c4952a",
    shadow: "rgba(196,149,42,0.18)",
    width: 1.45,
    dash: undefined,
    offsetY: 0,
    delay: 0,
  },
  {
    path: THREAD_BOT,
    color: "#1e3a7b",
    shadow: "rgba(30,58,123,0.18)",
    width: 1.2,
    dash: "4 7",
    offsetY: 10,
    delay: 0.08,
  },
  {
    path: THREAD_TOP,
    color: "#b7423f",
    shadow: "rgba(183,66,63,0.18)",
    width: 1.15,
    dash: "6 8",
    offsetY: 20,
    delay: 0.16,
  },
  {
    path: THREAD_BOT,
    color: "#2f8f70",
    shadow: "rgba(47,143,112,0.18)",
    width: 1.1,
    dash: "3 9",
    offsetY: 30,
    delay: 0.24,
  },
] as const;

function MultiColorThreadLines({
  position,
  inView,
}: {
  position: "top" | "bottom";
  inView: boolean;
}) {
  const isBottom = position === "bottom";

  return (
    <svg
      viewBox="0 0 400 70"
      className={`pointer-events-none absolute inset-x-0 ${
        isBottom ? "bottom-3 rotate-180" : "top-3"
      } h-16 w-full opacity-55`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {THREAD_LINES.map((line, index) => (
        <g
          key={`${position}-${line.color}`}
          transform={`translate(0 ${line.offsetY})`}
        >
          <motion.path
            d={line.path}
            fill="none"
            stroke={line.shadow}
            strokeWidth={line.width + 1.6}
            strokeDasharray={line.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0 0.8)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{
              duration: 1.55 + line.delay,
              delay: (isBottom ? 0.16 : 0) + line.delay,
              ease,
            }}
          />

          <motion.path
            d={line.path}
            fill="none"
            stroke={line.color}
            strokeWidth={line.width}
            strokeDasharray={line.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{
              duration: 1.65 + line.delay,
              delay: (isBottom ? 0.2 : 0) + line.delay,
              ease,
            }}
          />

          <motion.path
            d={line.path}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={0.55}
            strokeDasharray={line.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0 -0.6)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: index === 0 ? 0.75 : 0.45 } : {}}
            transition={{
              duration: 1.65 + line.delay,
              delay: (isBottom ? 0.22 : 0.04) + line.delay,
              ease,
            }}
          />
        </g>
      ))}
    </svg>
  );
}

export function StitchTransformSection() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = React.useState(0);

  const activeImage = images[activeIndex];

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden px-4 py-12 md:px-8 md:py-24 lg:py-36"
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_15%,rgba(196,149,42,0.08),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(30,58,123,0.1),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(47,143,112,0.08),transparent_34%)]" />

      <MultiColorThreadLines position="top" inView={inView} />
      <MultiColorThreadLines position="bottom" inView={inView} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease }}
            className="flex flex-col gap-4 lg:h-full lg:flex-row"
          >
            <div className="flex flex-row gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:justify-center lg:overflow-visible lg:pb-0">
              {images.map((img, index) => (
                <button
                  key={img.real}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border transition-all duration-300 lg:h-16 lg:w-16 ${
                    activeIndex === index
                      ? "scale-105 border-yellow-400 shadow-lg"
                      : "opacity-60 hover:scale-105 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.real}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />

                  <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                    <span className="text-lg text-white/30">🧵</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="min-h-[260px] sm:min-h-[360px] lg:min-h-[500px] lg:flex-1">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease }}
                className="h-full"
              >
                <EmbroideryHoop
                  realSrc={activeImage.real}
                  digitalSrc={activeImage.digital}
                />
              </motion.div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2, ease }}
            >
              <div className="section-eyebrow">Stitch by stitch</div>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Your artwork, built to run on a real machine.
              </h2>

              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Digitizing isn&apos;t just tracing. Every file we deliver is
                built with correct underlay, optimized stitch density, and
                pathing that runs cleanly on commercial embroidery machines —
                from left-chest logos to full jacket backs.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease }}
            >
              {callouts.map(({ label, desc }, index) => (
                <motion.div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.45,
                    delay: 0.4 + index * 0.1,
                    ease,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <motion.line
                      x1="2"
                      y1="10"
                      x2="2"
                      y2="10"
                      stroke="#1e3a7b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      animate={inView ? { x2: 18 } : {}}
                      transition={{
                        duration: 0.5,
                        delay: 0.55 + index * 0.1,
                        ease: "easeOut",
                      }}
                    />

                    <motion.line
                      x1="2"
                      y1="14"
                      x2="2"
                      y2="14"
                      stroke="#c4952a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      animate={inView ? { x2: 14 } : {}}
                      transition={{
                        duration: 0.4,
                        delay: 0.65 + index * 0.1,
                        ease: "easeOut",
                      }}
                    />

                    <motion.line
                      x1="2"
                      y1="6"
                      x2="2"
                      y2="6"
                      stroke="#b7423f"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeOpacity="0.65"
                      animate={inView ? { x2: 12 } : {}}
                      transition={{
                        duration: 0.35,
                        delay: 0.7 + index * 0.1,
                        ease: "easeOut",
                      }}
                    />

                    <motion.line
                      x1="2"
                      y1="17"
                      x2="2"
                      y2="17"
                      stroke="#2f8f70"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeOpacity="0.75"
                      animate={inView ? { x2: 10 } : {}}
                      transition={{
                        duration: 0.35,
                        delay: 0.75 + index * 0.1,
                        ease: "easeOut",
                      }}
                    />
                  </svg>

                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs leading-5 text-muted-foreground">
                      {desc}
                    </div>
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