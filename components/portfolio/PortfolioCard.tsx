"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Clock, Palette, Ruler, ImageOff, ArrowRight } from "lucide-react";
import type { PortfolioItem } from "./data";
import { generateBlurPlaceholder } from "./data";

interface PortfolioCardProps {
  item: PortfolioItem;
  index: number;
  onClick: () => void;
}

function TurnaroundBadge({ turnaround, accent }: { turnaround: string; accent: string }) {
  const isUrgent = turnaround.includes("Urgent");
  const isRush = turnaround.includes("Rush");
  const color = isUrgent ? "#DC2626" : isRush ? "#F97316" : "#16A34A";
  const icon = isUrgent ? "🔥" : isRush ? "⚡" : "🕐";

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{
        background: `${color}15`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {icon} {turnaround}
    </span>
  );
}

export function PortfolioCard({ item, index, onClick }: PortfolioCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const category = item.category;
  const thumbnail = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1);
  const firstImage = thumbnail || item.images?.[0];
  const accent = item.accent || category?.color || "#2563EB";
  const emoji = category?.emoji || "✦";
  const blurData = generateBlurPlaceholder(accent, firstImage?.blurhash);

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="relative flex-shrink-0 w-full lg:w-[300px] lg:min-w-[300px] xl:w-[360px] rounded-2xl cursor-pointer
        overflow-hidden transition-all duration-300 group select-none flex flex-col animate-fade-in-up"
      style={{
        background: `linear-gradient(145deg, var(--surface), var(--elevated))`,
        borderColor: isHovered ? `${accent}50` : "var(--border2)",
        borderWidth: 1,
        borderStyle: "solid",
        boxShadow: isHovered
          ? `0 20px 60px ${accent}15, 0 0 0 1px ${accent}20 inset`
          : "0 2px 8px rgba(0,0,0,0.04)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Animated border glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(135deg, ${accent}15, transparent 40%, ${accent}08, transparent 80%)`,
        }}
      />

      {/* Glass highlight */}
      <div
        className="absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(135deg, ${accent}08 0%, transparent 50%, ${accent}05 100%)`,
        }}
      />

      {/* Preview area — fixed aspect ratio */}
      <div
        className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}06, ${accent}02)`,
          borderBottom: `1px solid ${isHovered ? accent + "30" : "var(--border)"}`,
        }}
      >
        {/* Grid pattern (behind image) */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(${accent}08 1px, transparent 1px),
              linear-gradient(90deg, ${accent}08 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            opacity: isHovered ? 1 : 0.4,
          }}
        />

        {/* Real image */}
        {firstImage ? (
          !imgError ? (
            <>
              {/* Blur placeholder */}
              <img
                src={blurData}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110"
                style={{ filter: "blur(20px)" }}
                aria-hidden="true"
              />
              {/* Actual image with fallback handling */}
              <img
                src={firstImage.url}
                alt={firstImage.alt || item.title}
                loading="lazy"
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                style={{
                  opacity: isHovered ? 1 : 0.9,
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              />
            </>
          ) : (
            /* Broken image — show category icon nicely */
            <div
              className="flex flex-col items-center gap-2 relative z-10 select-none transition-transform duration-300"
              style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
            >
              <ImageOff size={32} className="opacity-30" style={{ color: accent }} />
              <span className="text-[10px] opacity-40" style={{ color: accent }}>Image unavailable</span>
            </div>
          )
        ) : (
          /* No image — decorative placeholder */
          <div
            className="text-5xl relative z-10 select-none transition-transform duration-300"
            style={{
              transform: isHovered ? "scale(1.08)" : "scale(1)",
              filter: `drop-shadow(0 0 ${isHovered ? 24 : 12}px ${accent}50)`,
            }}
          >
            {emoji}
          </div>
        )}

        {/* Category badge */}
        {category && (
          <span
            className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-[0.06em]
              px-2 py-0.5 rounded-full z-10"
            style={{
              background: `${accent}15`,
              color: accent,
              border: `1px solid ${accent}30`,
            }}
          >
            {category.name}
          </span>
        )}

        {/* Image count badge */}
        {item.images.length > 1 && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full z-10 bg-[var(--txt)]/40 text-[var(--bg)] backdrop-blur-sm">
            +{item.images.length - 1}
          </span>
        )}

        {/* Client name */}
        {item.clientName && (
          <span className="absolute bottom-3 left-3 text-[10px] font-medium px-2 py-0.5 rounded-full z-10 bg-[var(--txt)]/50 text-[var(--bg)]/80 backdrop-blur-sm">
            {item.clientName}
          </span>
        )}

        {/* Preview button */}
        <div
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5
            px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
          style={{
            background: `${accent}20`,
            color: accent,
            border: `1px solid ${accent}40`,
            backdropFilter: "blur(8px)",
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <Eye size={12} />
          Preview
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title & turnaround */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-jakarta font-bold text-[15px] leading-snug bg-clip-text text-transparent"
            style={{
              backgroundImage: isHovered
                ? `linear-gradient(135deg, var(--txt), ${accent})`
                : `linear-gradient(135deg, var(--txt), var(--txt2))`,
            }}
          >
            {item.title}
          </h3>
          <div className="flex-shrink-0 mt-0.5">
            <TurnaroundBadge turnaround={item.turnaround} accent={accent} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--txt2)] leading-relaxed line-clamp-2">
          {item.description}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {item.stitches && item.stitches > 0 && (
            <div
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg"
              style={{
                background: isHovered ? `${accent}08` : "var(--border)",
                border: `1px solid ${isHovered ? accent + "20" : "var(--border2)"}`,
              }}
            >
              <Ruler size={11} style={{ color: isHovered ? accent : "var(--txt3)" }} />
              <span className="text-[10px] font-mono font-semibold text-[var(--txt)]">
                {(item.stitches / 1000).toFixed(1)}k
              </span>
            </div>
          )}
          <div
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg"
            style={{
              background: isHovered ? `${accent}08` : "var(--border)",
              border: `1px solid ${isHovered ? accent + "20" : "var(--border2)"}`,
            }}
          >
            <Palette size={11} style={{ color: isHovered ? accent : "var(--txt3)" }} />
            <span className="text-[10px] font-mono font-semibold text-[var(--txt)]">
              {item.colors}
            </span>
          </div>
          <div
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg"
            style={{
              background: isHovered ? `${accent}08` : "var(--border)",
              border: `1px solid ${isHovered ? accent + "20" : "var(--border2)"}`,
            }}
          >
            <Clock size={11} style={{ color: isHovered ? accent : "var(--txt3)" }} />
            <span className="text-[10px] font-semibold text-[var(--txt)] truncate max-w-[60px]">
              {item.designSize || item.outputFormat}
            </span>
          </div>
        </div>

        {/* Conversion CTA */}
        <Link
          href="/client/new-order"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl
            text-[11px] font-semibold no-underline transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: isHovered
              ? `linear-gradient(135deg, ${accent}, ${accent}dd)`
              : `${accent}12`,
            color: isHovered ? "#fff" : accent,
            border: `1px solid ${isHovered ? "transparent" : accent + "30"}`,
          }}
        >
          Order This Style
          <ArrowRight size={11} />
        </Link>
      </div>
    </article>
  );
}
