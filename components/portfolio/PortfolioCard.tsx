"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ImageOff } from "lucide-react";
import type { PortfolioItem } from "./data";
import { generateBlurPlaceholder } from "./data";

interface PortfolioCardProps {
  item: PortfolioItem;
  index: number;
  onClick: () => void;
  onCategoryClick?: (slug: string) => void;
}

export function PortfolioCard({ item, index, onClick, onCategoryClick }: PortfolioCardProps) {
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
      className="relative w-full rounded-2xl cursor-pointer
        overflow-hidden transition-all duration-500 group select-none animate-fade-in-up"
      style={{
        background: "var(--surface)",
        border: `1px solid ${isHovered ? accent + "30" : "var(--border)"}`,
        boxShadow: isHovered
          ? `0 20px 60px -12px ${accent}20, 0 0 0 1px ${accent}15`
          : "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        animationDelay: `${index * 60}ms`,
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden" style={{ background: `${accent}08` }}>
        {/* Subtle inner border at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-px z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />

        {firstImage && !imgError ? (
          <>
            <img
              src={firstImage.url}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
              style={{ transform: isHovered ? "scale(1.06)" : "scale(1)", filter: isHovered ? "brightness(1.05)" : "brightness(1)" }}
            />
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-500 sm:opacity-0 sm:group-hover:opacity-100"
              style={{ background: `linear-gradient(180deg, transparent 40%, ${accent}25 100%)` }}
            >
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
                style={{ background: `${accent}90`, backdropFilter: "blur(12px)", boxShadow: `0 4px 20px ${accent}40` }}
              >
                <Eye size={15} /> View Details
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl opacity-30" style={{ filter: `drop-shadow(0 0 16px ${accent}40)` }}>{emoji}</span>
              <span className="text-[10px] font-medium text-[var(--txt3)]">No preview</span>
            </div>
          </div>
        )}

        {/* Image count badge */}
        {item.images.length > 1 && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white/90  border border-white/10 z-[3]">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5">
        <h3 className="font-syne font-bold text-sm sm:text-[15px] leading-snug text-[var(--txt)] line-clamp-1 group-hover:text-[#2563EB] transition-colors duration-300">
          {item.title}
        </h3>

        {item.description ? (
          <p className="text-[11px] sm:text-xs text-[var(--txt2)] leading-relaxed line-clamp-2 opacity-80">
            {item.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
          {category && (
            <span className="text-[9px] sm:text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors duration-300"
              style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}20` }}>
              {category.emoji} {category.name}
            </span>
          )}
          {item.tags && item.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-[9px] sm:text-[10px] font-medium px-2 py-1 rounded-lg bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border)]">
              {tag}
            </span>
          ))}
          {item.tags && item.tags.length > 2 && (
            <span className="text-[9px] sm:text-[10px] font-medium text-[var(--txt3)]">+{item.tags.length - 2}</span>
          )}
        </div>
      </div>
    </article>
  );
}
