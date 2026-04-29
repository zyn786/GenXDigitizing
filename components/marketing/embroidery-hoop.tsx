"use client";

import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface Props {
  realSrc?:      string;
  digitalSrc?:   string;
  realLabel?:    string;
  digitalLabel?: string;
}

export function EmbroideryHoop({
  realSrc      = "/Digitizing/Before-1.png",
  digitalSrc   = "/Digitizing/After-1.png",
  realLabel    = "Original Artwork",
  digitalLabel = "Digitized File",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct]       = useState(50);       // 0–100, where split line sits
  const [dragging, setDragging] = useState(false);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const getNewPct = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return pct;
    const { left, width } = el.getBoundingClientRect();
    return clamp(((clientX - left) / width) * 100);
  }, [pct]);

  /* ── pointer events (mouse + touch unified) ── */
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setPct(getNewPct(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPct(getNewPct(e.clientX));
  };
  const onPointerUp = () => setDragging(false);

  /* keyboard accessibility — arrow keys move handle */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft")  setPct((p) => clamp(p - 1));
    if (e.key === "ArrowRight") setPct((p) => clamp(p + 1));
  };

  return (
    <div
      ref={containerRef}
      className="group relative mx-6 overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: "554/753", cursor: dragging ? "col-resize" : "ew-resize" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* ── Right layer: digital file (full width, clipped left) ── */}
      <div className="absolute inset-0">
        <Image
          src={digitalSrc}
          alt={digitalLabel}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          draggable={false}
          priority
        />
      </div>

      {/* ── Left layer: original artwork (clips at slider position) ── */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      >
        <Image
          src={realSrc}
          alt={realLabel}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          draggable={false}
          priority
        />
      </div>

      {/* ── Divider line ── */}
      <div
        className="pointer-events-none absolute inset-y-0 z-20"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      >
        {/* vertical bar */}
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />

        {/* drag handle */}
        <div
          className="absolute top-1/2 left-0 pointer-events-auto z-30
                     flex h-10 w-10 items-center justify-center rounded-full
                     bg-white shadow-[0_2px_12px_rgba(0,0,0,0.45)] ring-2 ring-white/40
                     transition-transform duration-150"
          style={{ transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})` }}
          role="slider"
          aria-label="Reveal slider"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 5L3 10L7 15" stroke="#1e3a7b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 5L17 10L13 15" stroke="#1e3a7b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Labels ── */}
      <span className="pointer-events-none absolute bottom-3 left-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
        {realLabel}
      </span>
      <span className="pointer-events-none absolute bottom-3 right-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
        {digitalLabel}
      </span>
    </div>
  );
}
