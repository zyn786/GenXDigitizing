import type { Metadata } from "next";

import { ServicesHeroSection } from "@/components/marketing/services-hero-section";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { ServiceCategoryGrid } from "@/components/marketing/service-category-grid";
import { ServiceWorkflowStrip } from "@/components/marketing/service-workflow-strip";
import { ServicesPageCta } from "@/components/marketing/services-page-cta";
import { ProductionShowcaseSection } from "@/components/marketing/production-showcase";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore embroidery digitizing, vector art conversion, and custom patch services from GenX Digitizing.",
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-950 dark:bg-[#050814] dark:text-white">
      <ServicesHeroSection />

      <TrustStrip />

      <ServiceCategoryGrid />

      <ProductionShowcaseSection />

      <ServiceWorkflowStrip />

      <ServicesPageCta />
    </main>
  );
}