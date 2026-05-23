"use client";

import { useState, useRef } from "react";

const MESSAGES = [
  "Bulk Orders, Bigger Savings",
  "Free First Order",
  "Fast 12hr Turnaround",
  "First Design On Us",
];

const SCROLL_ITEMS = Array.from({ length: 8 }, () => MESSAGES).flat();

export function PromoTicker() {
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[200]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#F97316] overflow-hidden">
        <div className="flex items-center h-10 md:h-11">
          <div className="flex-1 overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-8 md:gap-10 animate-marquee w-max"
              style={{
                animationPlayState: paused ? "paused" : "running",
                animationDuration: "40s",
              }}
            >
              {SCROLL_ITEMS.map((text, i) => (
                <span
                  key={i}
                  className="flex items-center gap-8 md:gap-10 text-xs md:text-[13px] font-bold text-white whitespace-nowrap"
                >
                  ✦ {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
