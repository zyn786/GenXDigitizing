"use client";
import Link from "next/link";

const SERVICES = [
  "Embroidery Digitizing",
  "Vector Art Conversion",
  "Custom Patches",
  "Pricing",
  "Portfolio",
];

const COMPANY = [
  ["Contact Us", "/contact"],
  ["Client Portal", "/login"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms-and-conditions"],
  ["Refund Policy", "/refund-policy"],
] as const;

const TAGS = [
  "🧵 DST · PES Ready",
  "🌍 100+ Countries",
  "⭐ 4.9/5 Rating",
  "✅ 1,200+ Orders",
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-8 lg:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/images/black_logo.png"
                alt="GenX Digitizing"
                className="h-9 w-auto"
              />
            </div>
            <p className="text-[13px] text-[var(--txt3)] leading-relaxed max-w-[280px] mb-5">
              Premium embroidery digitizing, vector art conversion, and custom patches — delivered production-ready.
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    text-[11px] font-medium bg-[var(--border)] text-[var(--txt2)]
                    border border-[var(--border2)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-jakarta font-bold text-xs uppercase tracking-[0.08em] text-[var(--txt3)] mb-4">
              Services
            </h4>
            {SERVICES.map((s) => (
              <Link
                key={s}
                href={s === "Pricing" ? "/pricing" : s === "Portfolio" ? "/portfolio" : "/services"}
                className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)]
                  no-underline mb-2.5 transition-colors duration-150"
              >
                {s}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 className="font-jakarta font-bold text-xs uppercase tracking-[0.08em] text-[var(--txt3)] mb-4">
              Company
            </h4>
            {COMPANY.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)]
                  no-underline mb-2.5 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border)] pt-6 flex justify-between items-center flex-wrap gap-3">
          <p className="text-xs text-[var(--txt3)]">
            &copy; {year} GenX Digitizing. All rights reserved.
          </p>
          <div className="flex gap-5">
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms & Conditions", "/terms-and-conditions"],
              ["Refund Policy", "/refund-policy"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-[var(--txt3)] hover:text-[var(--txt2)] no-underline transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A]" />
            <span className="text-xs text-[#16A34A]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
