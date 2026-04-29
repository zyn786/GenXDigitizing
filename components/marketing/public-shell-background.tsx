"use client";

import { motion } from "framer-motion";

export function PublicShellBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Base gradient — dark mode ── */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.16),transparent_28%),linear-gradient(180deg,#06101e_0%,#0a1320_40%,#0e1626_100%)] dark:block" />

      {/* ── Base gradient — light mode ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.10),transparent_32%),radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_26%),linear-gradient(180deg,#f6f7fc_0%,#eef1ff_40%,#e8edfb_100%)] dark:hidden" />

      {/* ── Hero glow layer ── */}
      <div className="hero-glow absolute inset-0" />

      {/* ── 3D perspective grid ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(55deg) translateY(20%)",
          transformOrigin: "center bottom",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 100%)",
        }}
      />

      {/* ── Animated floating orbs ── */}
      <motion.div
        className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-[80px]"
        animate={{ y: [0, 22, 0], x: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10rem] top-[6rem] h-[26rem] w-[26rem] rounded-full bg-violet-500/10 blur-[80px]"
        animate={{ y: [0, -18, 0], x: [0, -22, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[-10rem] left-[20%] h-[22rem] w-[22rem] rounded-full bg-blue-500/08 blur-[60px]"
        animate={{ y: [0, 14, 0], x: [0, -12, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* ── Smaller accent orbs for depth ── */}
      <motion.div
        className="absolute right-[25%] top-[30%] h-[10rem] w-[10rem] rounded-full bg-primary/8 blur-2xl"
        animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute left-[35%] top-[60%] h-[8rem] w-[8rem] rounded-full bg-accent/8 blur-2xl"
        animate={{ y: [0, 10, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* ── Flowing SVG stitch lines ── */}
      <svg
        className="absolute inset-x-0 top-0 h-[560px] w-full opacity-20"
        viewBox="0 0 1440 560"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M-40 260C93 185 186 137 322 183C458 229 525 313 667 299C809 285 855 167 1006 168C1157 169 1247 266 1480 224"
          stroke="url(#line1)"
          strokeWidth="1.5"
          strokeDasharray="8 12"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
        />
        <motion.path
          d="M-20 322C140 240 282 219 421 269C560 319 655 379 806 342C957 305 1018 206 1178 206C1338 206 1412 295 1496 336"
          stroke="url(#line2)"
          strokeWidth="1.2"
          strokeDasharray="6 16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: "easeOut", delay: 0.9 }}
        />
        <motion.path
          d="M0 400C180 340 320 310 480 350C640 390 720 460 900 420C1080 380 1200 290 1440 350"
          stroke="url(#line3)"
          strokeWidth="1"
          strokeDasharray="4 18"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3.5, ease: "easeOut", delay: 1.3 }}
        />

        <defs>
          <linearGradient id="line1" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#c8a96b" stopOpacity="0.06" />
            <stop offset="0.45" stopColor="#60a5fa" stopOpacity="0.85" />
            <stop offset="1" stopColor="#2dd4bf" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="line2" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#3b82f6" stopOpacity="0.04" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#14b8a6" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="line3" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#8b5cf6" stopOpacity="0.04" />
            <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ec4899" stopOpacity="0.04" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Subtle noise overlay ── */}
      <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] [background-size:72px_72px]" />

      {/* ── Vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.6)_100%)]" />
    </div>
  );
}
