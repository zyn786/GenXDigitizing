"use client";

import Link from "next/link";
import { Shield, Check } from "lucide-react";

export function SewOutGuarantee({
  variant = "banner",
}: {
  variant?: "banner" | "inline" | "badge";
}) {
  if (variant === "badge") {
    return (
      <div className="bg-[#16A34A]/8 inline-flex items-center gap-1.5 rounded-full border border-[#16A34A]/20 px-3 py-1.5">
        <Shield size={12} className="text-[#16A34A]" />
        <span className="text-[11px] font-semibold text-[#16A34A]">Sew-Out Guaranteed</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-start gap-2 text-left">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#16A34A]/10">
          <Shield size={14} className="text-[#16A34A]" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[var(--txt)] sm:text-[13px]">
            Sew-Out Guarantee
          </p>
          <p className="text-[11px] leading-relaxed text-[var(--txt2)] sm:text-[12px]">
            If the file does not sew correctly due to digitizing issues, we revise it free of charge
            — no questions asked.
          </p>
        </div>
      </div>
    );
  }

  // banner (default)
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 md:px-12">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#16A34A]/15 bg-gradient-to-r from-[#16A34A]/5 to-[#059669]/5 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#16A34A]/15">
            <Shield size={24} className="text-[#16A34A]" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-syne text-base font-bold text-[var(--txt)] sm:text-lg">
              Sew-Out Guarantee
            </h3>
            <p className="text-sm leading-relaxed text-[var(--txt2)]">
              If the file does not sew correctly due to digitizing issues, we will revise it free of
              charge. No time limit. No hassle. Your machine, your fabric — we make it work.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#059669]"
          >
            <Check size={14} /> Try Risk-Free
          </Link>
        </div>
      </div>
    </section>
  );
}
