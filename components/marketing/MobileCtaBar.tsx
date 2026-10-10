"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { SITE_CLAIMS, SITE_INFO } from "@/lib/site-config";

/**
 * The phone-width sticky action bar for the home page.
 *
 * This is the only persistent way to start an order on a phone, so two things
 * about it are deliberate.
 *
 * It is mounted by LandingClient at the top level, NOT inside HeroSection —
 * which is where it used to live. HeroSection is rendered inside
 * `<div className="hidden md:block">` and the bar is `sm:hidden`, so the two
 * conditions could never both pass and the bar rendered at no viewport width at
 * all. Nothing else pointed that out: the WhatsApp floating button hides itself
 * on the home page specifically to avoid clashing with this bar
 * (components/marketing/WhatsAppWidget.tsx:12-19), so the phone homepage lost
 * both.
 *
 * Upload Design is the primary action and WhatsApp the secondary, per the
 * business's stated intent. Register is deliberately absent: it is already in
 * the header and the menu, and a third competing button on a 390px bar is what
 * pushed Upload Design down to a secondary colour in the first place.
 */
export function MobileCtaBar({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#0F3460] shadow-[0_-2px_12px_rgba(15,52,96,0.25)] sm:hidden">
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <a
          href={`https://wa.me/${SITE_INFO.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-md transition-all active:scale-95"
          aria-label="Message us on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </a>

        <Link
          href="/upload"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[14px] font-bold text-[#0F3460] shadow-md transition-all active:scale-[0.98]"
        >
          <Upload size={16} />
          Upload Design — Free
        </Link>
      </div>

      <div
        className="flex items-center justify-center gap-1 pt-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)" }}
      >
        <span className="text-[9px] font-medium text-white/90">
          {SITE_CLAIMS.price.value} standard designs
        </span>
        <span className="text-[9px] text-white/50">·</span>
        <span className="text-[9px] font-medium text-white/90">
          {SITE_CLAIMS.revisions.value} revisions
        </span>
        <span className="text-[9px] text-white/50">·</span>
        <span className="text-[9px] font-medium text-white/90">Encrypted upload</span>
      </div>
    </div>
  );
}
