"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, ArrowRight, Loader2, Zap, Palette, Ruler, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FreeDesign } from "@/types";

const GRADIENT = "from-[#2563EB] via-[#7C3AED] to-[#F97316]";

function formatNumber(n: number) {
  return n.toLocaleString();
}

function PreviewCard({ design, index }: { design: FreeDesign; index: number }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = (design.images || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const currentImg = images[imgIdx];

  const handleDownload = async () => {
    if (!design.downloadUrl) return;
    try {
      await fetch("/api/free-designs/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design.id }),
      });
      // Trigger download on same page
      const a = document.createElement("a");
      a.href = design.downloadUrl!;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${design.title}...`);
    } catch {
      toast.error("Download failed.");
    }
  };

  return (
    <div
      className="group/card h-full flex flex-col bg-[var(--surface)]/90 backdrop-blur-xl rounded-2xl
        border border-[var(--border)] overflow-hidden animate-fade-in-up
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Preview image */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-[var(--elevated)]">
        {currentImg ? (
          <img
            src={currentImg.thumbnailUrl || currentImg.url}
            alt={currentImg.alt || design.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">🧵</div>
        )}

        {/* Dots (desktop only) */}
        {images.length > 1 && (
          <div className="hidden lg:flex absolute bottom-2.5 left-1/2 -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === imgIdx ? 18 : 6,
                  height: 6,
                  background: i === imgIdx
                    ? "linear-gradient(90deg, #2563EB, #F97316)"
                    : "rgba(255,255,255,0.55)",
                  boxShadow: i === imgIdx ? "0 0 4px rgba(37,99,235,0.5)" : "0 0 0 1px rgba(0,0,0,0.15)",
                }}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe hint (mobile/tablet) */}
        {images.length > 1 && (
          <div className="lg:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[10px] text-white/70 bg-black/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
              swipe to see more
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-syne font-bold text-sm text-[var(--txt)] mb-3 leading-snug">
          {design.title}
        </h3>

        {/* Specs - compact grid */}
        <div className="grid grid-cols-2 gap-0.5 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--txt3)] leading-tight font-medium">Stitches</div>
              <div className="text-[11px] font-bold text-[var(--txt)]">{formatNumber(design.stitchCount)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
              <Palette className="w-3.5 h-3.5 text-[#F97316]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--txt3)] leading-tight font-medium">Colors</div>
              <div className="text-[11px] font-bold text-[var(--txt)]">{design.colors}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
              <Ruler className="w-3.5 h-3.5 text-[#16A34A]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--txt3)] leading-tight font-medium">Size</div>
              <div className="text-[11px] font-bold text-[var(--txt)]">{design.designSize}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#A855F7]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--txt3)] leading-tight font-medium">Formats</div>
              <div className="text-[11px] font-bold text-[var(--txt)] truncate">
                {(design.formats || []).slice(0, 3).join(" · ")}
                {(design.formats || []).length > 3 && " +"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={!design.downloadUrl}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold",
            "border-2 transition-all duration-300",
            !design.downloadUrl
              ? "border-[var(--border2)] bg-[var(--elevated)] text-[var(--txt3)] cursor-not-allowed"
              : "border-[var(--border2)] text-[var(--txt)] hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5 font-syne"
          )}
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {design.downloadUrl ? "Free Download" : "Coming Soon"}
        </button>
      </div>
    </div>
  );
}

export function FreeDesignsPreview() {
  const [designs, setDesigns] = useState<FreeDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadDesigns = () => {
    setLoading(true);
    setFailed(false);
    fetch("/api/free-designs")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setDesigns((data.designs || []).slice(0, 3)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  // Don't render anything if no data and no error (prevents flash)
  if (!loading && !failed && designs.length === 0) return null;

  return (
    <section className="py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold
              uppercase tracking-wider bg-[#16A34A]/8 text-[#16A34A] border border-[#16A34A]/15 mb-4"
          >
            <Download className="w-3 h-3" />
            Free Sample Digitizing
          </span>
          <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3 leading-[1.15]">
            Free Design{" "}
            <span className={`bg-gradient-to-r ${GRADIENT} bg-clip-text text-transparent`}>
              Downloads
            </span>
          </h2>
          <p className="text-[var(--txt2)] text-sm max-w-lg mx-auto">
            Try before you order. Download free embroidery sample files and see our quality firsthand.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
            <p className="text-xs text-[var(--txt3)]">Loading designs...</p>
          </div>
        ) : failed ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--txt2)] mb-3">Could not load free designs.</p>
            <button
              onClick={loadDesigns}
              className="text-sm text-[#2563EB] hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8">
            {designs.map((design, i) => (
              <PreviewCard key={design.id} design={design} index={i} />
            ))}
          </div>
        )}

        {/* View all CTA */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <Link
            href="/free-designs"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-gradient-to-r ${GRADIENT}
              text-white font-syne font-bold text-sm
              shadow-[0_4px_16px_rgba(37,99,235,0.2)]
              hover:shadow-[0_6px_22px_rgba(37,99,235,0.3)]
              hover:-translate-y-0.5 active:scale-[0.98]
              transition-all duration-300 no-underline`}
          >
            View All Designs
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
