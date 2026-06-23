"use client";

import Link from "next/link";
import { Shield, Check } from "lucide-react";

export function SewOutGuarantee({ variant = "banner" }: { variant?: "banner" | "inline" | "badge" }) {
  if (variant === "badge") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16A34A]/8 border border-[#16A34A]/20">
        <Shield size={12} className="text-[#16A34A]" />
        <span className="text-[11px] font-semibold text-[#16A34A]">Sew-Out Guaranteed</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-start gap-2 text-left">
        <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield size={14} className="text-[#16A34A]" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-[var(--txt)]">Sew-Out Guarantee</p>
          <p className="text-[11px] sm:text-[12px] text-[var(--txt2)] leading-relaxed">
            If the file does not sew correctly due to digitizing issues, we revise it free of charge — no questions asked.
          </p>
        </div>
      </div>
    );
  }

  // banner (default)
  return (
    <section className="py-8 sm:py-10">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="rounded-2xl bg-gradient-to-r from-[#16A34A]/5 to-[#059669]/5 border border-[#16A34A]/15 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/15 flex items-center justify-center flex-shrink-0">
            <Shield size={24} className="text-[#16A34A]" />
          </div>
          <div className="flex-1">
            <h3 className="font-syne font-bold text-base sm:text-lg text-[var(--txt)] mb-1">
              Sew-Out Guarantee
            </h3>
            <p className="text-sm text-[var(--txt2)] leading-relaxed">
              If the file does not sew correctly due to digitizing issues, we will revise it free of charge. No time limit. No hassle. Your machine, your fabric — we make it work.
            </p>
          </div>
          <Link href="/upload"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#16A34A] text-white font-semibold text-sm no-underline hover:bg-[#059669] transition-colors">
            <Check size={14} /> Try Risk-Free
          </Link>
        </div>
      </div>
    </section>
  );
}
