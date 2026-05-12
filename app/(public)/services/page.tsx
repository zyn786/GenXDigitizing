import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { ServicesHeroSection } from "@/components/marketing/services-hero-section";

const TrustStrip = dynamic(
  () => import("@/components/marketing/trust-strip").then((m) => ({ default: m.TrustStrip })),
  { ssr: true }
);
const ServiceCategoryGrid = dynamic(
  () => import("@/components/marketing/service-category-grid").then((m) => ({ default: m.ServiceCategoryGrid })),
  { ssr: true }
);
const ServiceWorkflowStrip = dynamic(
  () => import("@/components/marketing/service-workflow-strip").then((m) => ({ default: m.ServiceWorkflowStrip })),
  { ssr: true }
);
const ServicesPageCta = dynamic(
  () => import("@/components/marketing/services-page-cta").then((m) => ({ default: m.ServicesPageCta })),
  { ssr: true }
);
const ProductionShowcaseSection = dynamic(
  () => import("@/components/marketing/production-showcase").then((m) => ({ default: m.ProductionShowcaseSection })),
  { ssr: true }
);

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
