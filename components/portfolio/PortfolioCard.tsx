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
      className="group relative w-full animate-fade-in-up cursor-pointer select-none overflow-hidden rounded-2xl transition-all duration-500"
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
      <div
        className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]"
        style={{ background: `${accent}08` }}
      >
        {/* Subtle inner border at bottom of image */}
        <div
          className="absolute inset-x-0 bottom-0 z-[2] h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }}
        />

        {firstImage && !imgError ? (
          <>
            <Image
              src={firstImage.url}
              alt={item.title}
              fill
              loading="lazy"
              onError={() => setImgError(true)}
              className="object-cover transition-all duration-700"
              sizes="(max-width: 768px) 50vw, 33vw"
              style={{
                transform: isHovered ? "scale(1.06)" : "scale(1)",
                filter: isHovered ? "brightness(1.05)" : "brightness(1)",
              }}
            />
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-500 sm:opacity-0 sm:group-hover:opacity-100"
              style={{ background: `linear-gradient(180deg, transparent 40%, ${accent}25 100%)` }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `${accent}90`,
                  backdropFilter: "blur(12px)",
                  boxShadow: `0 4px 20px ${accent}40`,
                }}
              >
                <Eye size={15} />
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-5xl opacity-30"
                style={{ filter: `drop-shadow(0 0 16px ${accent}40)` }}
              >
                {emoji}
              </span>
              <span className="text-[10px] font-medium text-[var(--txt3)]">No preview</span>
            </div>
          </div>
        )}

        {/* Image count badge */}
        {item.images.length > 1 && (
          <span className="absolute right-3 top-3 z-[3] rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/90">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4 sm:p-5">
        <h3 className="line-clamp-1 font-syne text-sm font-bold leading-snug text-[var(--txt)] transition-colors duration-300 group-hover:text-[#2563EB] sm:text-[15px]">
          {item.title}
        </h3>

        {item.description ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--txt2)] opacity-80 sm:text-xs">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {category && (
            <span
              className="rounded-lg px-2.5 py-1 text-[9px] font-semibold transition-colors duration-300 sm:text-[10px]"
              style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}20` }}
            >
              {category.emoji} {category.name}
            </span>
          )}
          {item.tags &&
            item.tags.slice(0, 2).map((tag: string) => (
              <span
                key={tag}
                className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-2 py-1 text-[9px] font-medium text-[var(--txt3)] sm:text-[10px]"
              >
                {tag}
              </span>
            ))}
          {item.tags && item.tags.length > 2 && (
            <span className="text-[9px] font-medium text-[var(--txt3)] sm:text-[10px]">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
