import type { Metadata } from "next";
import { SITE_INFO, SITE_STATS } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { ContactForm } from "./ContactForm";
import { FreeSampleBanner } from "@/components/marketing/FreeSampleBanner";

export const metadata: Metadata = {
  title: "Contact — Get a Free Quote — genxdigitizing",
  description:
    "Get in touch with genxdigitizing. Questions about embroidery digitizing, pricing, or your order — we reply fast.",
};

const CONTACT_INFO = [
  { emoji: "⚡", title: "Fast Replies", desc: "We respond within 1 hour" },
  { emoji: "🌍", title: "Worldwide Service", desc: `Clients in ${SITE_STATS.countriesServed}+ countries — no matter the timezone` },
  { emoji: "💬", title: "Live Chat Available", desc: "Already a client? Message us directly from your portal" },
  { emoji: "📧", title: "Email Support", desc: `${SITE_INFO.email} — detailed questions welcome` },
];

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />
      <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* main container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">

          {/* LEFT SIDE — info */}
          <div className="space-y-4 sm:space-y-6 order-1 text-center sm:text-left">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
              bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
              Get in Touch
            </span>

            <h1 className="font-syne font-bold text-[clamp(32px,7vw,48px)] leading-[1.1]">
              We&apos;d Love to{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Hear From You
              </span>
            </h1>

            <p className="text-[var(--txt2)] leading-relaxed text-sm sm:text-base max-w-md">
              Have questions about our service, pricing, or large orders?
              Just message us — we reply within 1 hour during business hours.
            </p>

            {/* info cards */}
            <div className="flex flex-col gap-3 sm:gap-4 pt-1 sm:pt-2 text-left">
              {CONTACT_INFO.map((item) => (
                <div key={item.title} className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0
                    bg-[#2563EB]/10 border border-[#2563EB]/20">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{item.title}</div>
                    <div className="text-xs sm:text-sm text-[var(--txt2)]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2 pt-1">
              <a href={`https://wa.me/${SITE_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all duration-200" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://www.instagram.com/genxdigitizing" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 transition-all duration-200" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/genxdigitizing" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all duration-200" aria-label="Facebook">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>

            {/* client box */}
            <div className="bg-[#16A34A]/5 border border-[#16A34A]/15 rounded-xl p-3 sm:p-4">
              <div className="font-syne font-bold text-xs sm:text-sm text-[#16A34A] mb-1 sm:mb-1.5">
                Already a client?
              </div>
              <p className="text-xs sm:text-sm text-[var(--txt2)] mb-2">
                Use the in-portal messaging for order updates and faster replies.
              </p>
              <a href="/login" className="text-xs sm:text-sm text-[#16A34A] font-semibold hover:underline">
                Sign in to portal →
              </a>
            </div>
          </div>

          {/* RIGHT SIDE (FORM) */}
          <div className="lg:sticky lg:top-24 order-2">
            <ContactForm />
          </div>
        </div>
      </div>

      {/* Free Sample Banner */}
      <FreeSampleBanner />
    </div>
    </>
  );
}
