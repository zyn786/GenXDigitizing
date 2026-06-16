import type { Metadata } from "next";
import { SITE_INFO, SITE_STATS } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { ContactForm } from "./ContactForm";

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
    </div>
    </>
  );
}
