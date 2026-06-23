"use client";

import Link from "next/link";
import { ArrowRight, Gift, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FreeSampleBannerProps {
  /** Compact inline variant (footer, between sections) */
  variant?: "default" | "compact";
  className?: string;
}

export function FreeSampleBanner({ variant = "default", className = "" }: FreeSampleBannerProps) {
  if (variant === "compact") {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] p-4 sm:p-5 ${className}`}>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gift size={16} className="text-white" />
            </div>
            <div>
              <p className="font-syne font-bold text-sm sm:text-base leading-tight">
                New Clients Get One FREE SAMPLE
              </p>
              <p className="text-[11px] sm:text-xs text-white/70">
                No payment required — try us risk-free
              </p>
            </div>
          </div>
          <Link href="/upload" className="flex-shrink-0">
            <Button variant="grad" size="sm" rightIcon={<ArrowRight size={14} />}
              className="!bg-white !text-[#2563EB] hover:!bg-[#EFF6FF] !rounded-full !font-bold">
              Claim Free Sample
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default: full-width section banner
  return (
    <section className={`py-10 sm:py-12 ${className}`}>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] p-8 sm:p-10 md:p-12 text-center shadow-2xl">
          {/* Glow orbs */}
          <div className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] rounded-full bg-[#60A5FA] opacity-[0.1] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[250px] h-[250px] rounded-full bg-[#F97316] opacity-[0.08] blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-white border border-white/20 mb-5">
              <Gift size={13} />
              Limited Time Offer
            </span>

            <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-[1.15]">
              New Clients Get{" "}
              <span className="bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#EF4444] bg-clip-text text-transparent">
                One Free Sample
              </span>{" "}
              Digitizing
            </h2>

            <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed">
              See our quality firsthand. Upload your logo — we digitize it for free. No credit card. No commitment. Just a production-ready file you can test on your machine.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/upload">
                <Button variant="grad" size="lg" className="w-full sm:w-auto !px-8 !py-4 !text-base !rounded-full" rightIcon={<Upload size={16} />}>
                  Get Your Free Sample
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button variant="grad" size="lg" className="w-full sm:w-auto !px-8 !py-4 !rounded-full !bg-white/10 hover:!bg-white/20 !border !border-white/20 !shadow-none">
                  See Our Work
                </Button>
              </Link>
            </div>

            <p className="text-white/50 text-[11px] sm:text-xs mt-4">
              ✓ Free quote in ~1 hour · ✓ No payment required · ✓ Pay only when satisfied
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
