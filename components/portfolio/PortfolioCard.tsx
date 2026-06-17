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
      className="relative w-full rounded-[8px] cursor-pointer
        overflow-hidden transition-all duration-300 group select-none animate-fade-in-up bg-[var(--surface)]"
      style={{
        border: `1px solid ${isHovered ? accent + "40" : "var(--border2)"}`,
        boxShadow: isHovered
          ? `0 16px 48px ${accent}14`
          : "0 2px 8px rgba(0,0,0,0.04)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden" style={{ background: `${accent}06` }}>
        {firstImage && !imgError ? (
          <>
            <img
              src={firstImage.url}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
            />
            {/* Hover overlay — subtle, just "View" */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 rounded-[8px] overflow-hidden"
              style={{ background: `linear-gradient(180deg, transparent 50%, ${accent}35 100%)` }}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: `${accent}85`, backdropFilter: "blur(8px)" }}
              >
                <Eye size={15} /> View
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ filter: `drop-shadow(0 0 12px ${accent}50)` }}>
            {emoji}
          </div>
        )}

        {/* Image count */}
        {item.images.length > 1 && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <h3 className="font-syne font-bold text-sm sm:text-[15px] leading-snug text-[var(--txt)] line-clamp-1">
          {item.title}
        </h3>

        {item.description ? (
          <p className="text-[11px] sm:text-xs text-[var(--txt2)] leading-relaxed line-clamp-2">
            {item.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
          {category && (
            <span className="text-[9px] sm:text-[11px] font-medium px-2 py-px sm:px-2.5 sm:py-1 rounded-full bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border)]">
              {category.emoji} {category.name}
            </span>
          )}
          {item.tags && item.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[9px] sm:text-[11px] font-medium px-2 py-px sm:px-2.5 sm:py-1 rounded-full bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border)]">
              {tag}
            </span>
          ))}
          {item.tags && item.tags.length > 3 && (
            <span className="text-[9px] sm:text-[11px] text-[var(--txt3)]">+{item.tags.length - 3}</span>
          )}
        </div>
      </div>
    </article>
  );
}
