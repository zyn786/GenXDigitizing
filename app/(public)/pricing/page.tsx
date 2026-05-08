import type { Metadata } from "next";

import { PricingHeroSection } from "@/components/marketing/pricing-hero-section";
import { PricingNotesPanel } from "@/components/marketing/pricing-notes-panel";
import { PricingPlansGrid } from "@/components/marketing/pricing-plans-grid";
import { ServicesPageCta } from "@/components/marketing/services-page-cta";
import { getSiteUrl } from "@/lib/site-url";

const baseUrl = (() => { try { return getSiteUrl(); } catch { return "http://localhost:3000"; } })();

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent digitizing pricing from $15. First order free for new clients. Rush and same-day options available.",
  alternates: { canonical: `${baseUrl}/pricing` },
};

export default function PricingPage() {
  return (
    <>
      <PricingHeroSection />
      <PricingPlansGrid />
      <PricingNotesPanel />
      <ServicesPageCta />
    </>
  );
}