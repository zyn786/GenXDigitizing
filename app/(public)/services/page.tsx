import type { Metadata } from "next";

import { ServiceCategoryGrid } from "@/components/marketing/service-category-grid";
import { ServiceWorkflowStrip } from "@/components/marketing/service-workflow-strip";
import { ServicesHeroSection } from "@/components/marketing/services-hero-section";
import { ServicesPageCta } from "@/components/marketing/services-page-cta";

export const metadata: Metadata = {
  title: "Services · GenX Digitizing",
  description:
    "Embroidery digitizing, vector art conversion, and custom patch production — production-ready files delivered within 24 hours.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHeroSection />
      <ServiceCategoryGrid />
      <ServiceWorkflowStrip />
      <ServicesPageCta />
    </>
  );
}