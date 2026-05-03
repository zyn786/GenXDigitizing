"use client";

import * as React from "react";
import Image from "next/image";

const PORTFOLIO_TEASERS = [
  { src: "/digitizing/After-1.png", label: "Logo Embroidery" },
  { src: "/digitizing/After-3.png", label: "Jacket Back" },
  { src: "/digitizing/After-2.png", label: "3D Puff Cap" },
];

export function SplashScreen() {
  const [visible, setVisible] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("genx-splash-seen");
  });
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;

    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("genx-splash-seen", "1");
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07111f] transition-opacity duration-500 ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Background radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_40%)]" />

      {/* Portfolio teasers */}
      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-10 blur-sm scale-110">
        {PORTFOLIO_TEASERS.map((t) => (
          <div key={t.src} className="relative h-48 w-40 overflow-hidden rounded-2xl">
            <Image src={t.src} alt={t.label} fill className="object-cover" sizes="160px" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14">
            <Image
              src="/brand/genx-logo-white.png"
              alt="GenX Digitizing"
              fill
              className="object-contain"
              priority
              sizes="56px"
            />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white">GenX Digitizing</div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Premium Embroidery Studio</div>
          </div>
        </div>

        {/* Animated stitch line */}
        <div className="relative h-px w-48 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 animate-[splash-progress_2s_ease-in-out_forwards] bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" />
        </div>

        <div className="text-xs uppercase tracking-[0.28em] text-white/35 animate-pulse">
          Loading
        </div>
      </div>

      <style>{`
        @keyframes splash-progress {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
