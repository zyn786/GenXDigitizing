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
        <p className="text-[var(--txt3)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="relative group/slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left arrow */}
      <motion.button
        initial={false}
        animate={{ opacity: showLeftArrow ? 1 : 0, x: showLeftArrow ? 0 : -10 }}
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl
          flex items-center justify-center
          bg-white/90 border border-[var(--border2)]
          text-[var(--txt2)] hover:text-[var(--txt)] hover:border-[var(--border3)]
          shadow-lg transition-all pointer-events-none"
        style={{ pointerEvents: showLeftArrow ? "auto" : "none" }}
      >
        <ChevronLeft size={18} />
      </motion.button>

      {/* Right arrow */}
      <motion.button
        initial={false}
        animate={{ opacity: showRightArrow ? 1 : 0, x: showRightArrow ? 0 : 10 }}
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl
          flex items-center justify-center
          bg-white/90 border border-[var(--border2)]
          text-[var(--txt2)] hover:text-[var(--txt)] hover:border-[var(--border3)]
          shadow-lg transition-all pointer-events-none"
        style={{ pointerEvents: showRightArrow ? "auto" : "none" }}
      >
        <ChevronRight size={18} />
      </motion.button>

      {/* Scrollable track */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-none
          scroll-smooth snap-x snap-mandatory"
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
            <PortfolioCard item={item} index={i} onClick={() => onItemClick(item)} onCategoryClick={onCategoryClick} />
          </div>
        ))}

        {/* End spacer */}
        <div className="flex-shrink-0 w-1" />
      </div>

      {/* Scroll hint (shows on first view) */}
      <div
        className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[var(--txt3)]
          opacity-50 md:hidden"
      >
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
