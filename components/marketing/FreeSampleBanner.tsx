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
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] p-4 sm:p-5 ${className}`}
      >
        <div className="relative z-10 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Gift size={16} className="text-white" />
            </div>
            <div>
              <p className="font-syne text-sm font-bold leading-tight sm:text-base">
                New Clients Get One FREE SAMPLE
              </p>
              <p className="text-[11px] text-white/70 sm:text-xs">
                No payment required — try us risk-free
              </p>
            </div>
          </div>
          <Link href="/upload" className="flex-shrink-0">
            <Button
              variant="grad"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              className="!rounded-full !bg-white !font-bold !text-[#2563EB] hover:!bg-[#EFF6FF]"
            >
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
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] p-8 text-center shadow-2xl sm:p-10 md:p-12">
          {/* Glow orbs */}
          <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[300px] w-[300px] rounded-full bg-[#60A5FA] opacity-[0.1] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[250px] w-[250px] rounded-full bg-[#F97316] opacity-[0.08] blur-3xl" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              <Gift size={13} />
              Limited Time Offer
            </span>

            <h2 className="mb-3 font-syne text-2xl font-bold leading-[1.15] text-white sm:text-3xl md:text-4xl">
              New Clients Get{" "}
              <span className="bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#EF4444] bg-clip-text text-transparent">
                One Free Sample
              </span>{" "}
              Digitizing
            </h2>

            <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              See our quality firsthand. Upload your logo — we digitize it for free. No credit card.
              No commitment. Just a production-ready file you can test on your machine.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/upload">
                <Button
                  variant="grad"
                  size="lg"
                  className="w-full !rounded-full !px-8 !py-4 !text-base sm:w-auto"
                  rightIcon={<Upload size={16} />}
                >
                  Get Your Free Sample
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button
                  variant="grad"
                  size="lg"
                  className="w-full !rounded-full !border !border-white/20 !bg-white/10 !px-8 !py-4 !shadow-none hover:!bg-white/20 sm:w-auto"
                >
                  See Our Work
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-[11px] text-white/50 sm:text-xs">
              ✓ Free quote in ~1 hour · ✓ No payment required · ✓ Pay only when satisfied
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
