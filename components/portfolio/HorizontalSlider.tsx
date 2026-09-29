"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, GripHorizontal } from "lucide-react";
import { PortfolioCard } from "./PortfolioCard";
import type { PortfolioItem } from "./data";

interface HorizontalSliderProps {
  items: PortfolioItem[];
  onItemClick: (item: PortfolioItem) => void;
  onCategoryClick?: (slug: string) => void;
  emptyMessage?: string;
  autoSlide?: boolean;
}

export function HorizontalSlider({
  items,
  onItemClick,
  onCategoryClick,
  emptyMessage = "No projects found in this category.",
  autoSlide = false,
}: HorizontalSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval>>();
  const dragX = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide
  useEffect(() => {
    if (!autoSlide || isHovered) return;
    autoTimerRef.current = setInterval(() => {
      const el = sliderRef.current;
      if (!el) return;
      const cardWidth = (el.children[0]?.clientWidth || 340) + 16; // card + gap
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3000);
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [autoSlide, isHovered, items.length]);

  const checkArrows = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 20);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkArrows, { passive: true });
    checkArrows();
    return () => el.removeEventListener("scroll", checkArrows);
  }, [checkArrows, items]);

  const scroll = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scroll("left");
      if (e.key === "ArrowRight") scroll("right");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--txt3)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="group/slider relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left arrow */}
      <motion.button
        initial={false}
        animate={{ opacity: showLeftArrow ? 1 : 0, x: showLeftArrow ? 0 : -10 }}
        onClick={() => scroll("left")}
        className="pointer-events-none absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[var(--border2)] bg-white/90 text-[var(--txt2)] shadow-lg transition-all hover:border-[var(--border3)] hover:text-[var(--txt)]"
        style={{ pointerEvents: showLeftArrow ? "auto" : "none" }}
      >
        <ChevronLeft size={18} />
      </motion.button>

      {/* Right arrow */}
      <motion.button
        initial={false}
        animate={{ opacity: showRightArrow ? 1 : 0, x: showRightArrow ? 0 : 10 }}
        onClick={() => scroll("right")}
        className="pointer-events-none absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[var(--border2)] bg-white/90 text-[var(--txt2)] shadow-lg transition-all hover:border-[var(--border3)] hover:text-[var(--txt)]"
        style={{ pointerEvents: showRightArrow ? "auto" : "none" }}
      >
        <ChevronRight size={18} />
      </motion.button>

      {/* Scrollable track */}
      <div
        ref={sliderRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          cursor: isGrabbing ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={() => setIsGrabbing(true)}
        onMouseUp={() => setIsGrabbing(false)}
        onMouseLeave={() => setIsGrabbing(false)}
      >
        {items.map((item, i) => (
          <div key={item.id} className="snap-start">
            <PortfolioCard
              item={item}
              index={i}
              onClick={() => onItemClick(item)}
              onCategoryClick={onCategoryClick}
            />
          </div>
        ))}

        {/* End spacer */}
        <div className="w-1 flex-shrink-0" />
      </div>

      {/* Scroll hint (shows on first view) */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--txt3)] opacity-50 md:hidden">
        <GripHorizontal size={14} />
        Swipe to browse
      </div>

      {/* Hide scrollbar — global guard */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
