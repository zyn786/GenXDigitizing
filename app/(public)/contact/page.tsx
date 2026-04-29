import type { Metadata } from "next";

import { ContactCtaStrip } from "@/components/marketing/contact-cta-strip";
import { ContactDetailsPanel } from "@/components/marketing/contact-details-panel";
import { ContactFormPanel } from "@/components/marketing/contact-form-panel";
import { ContactHeroSection } from "@/components/marketing/contact-hero-section";

export const metadata: Metadata = {
  title: "Contact · GenX Digitizing",
  description:
    "Send a project inquiry or get a quote. We reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHeroSection />
      <section className="px-4 py-8 md:px-8 md:py-10">
        <div className="page-shell grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ContactDetailsPanel />
          <ContactFormPanel />
        </div>
      </section>
      <ContactCtaStrip />
    </>
  );
}