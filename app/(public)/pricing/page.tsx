import { PricingHeroSection } from "@/components/marketing/pricing-hero-section";
import { PricingNotesPanel } from "@/components/marketing/pricing-notes-panel";
import { PricingPlansGrid } from "@/components/marketing/pricing-plans-grid";
import { ServicesPageCta } from "@/components/marketing/services-page-cta";

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