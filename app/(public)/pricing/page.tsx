import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { PricingHeroSection } from "@/components/marketing/pricing-hero-section";
import { getSiteUrl } from "@/lib/site-url";

const PricingPlansGrid = dynamic(
  () => import("@/components/marketing/pricing-plans-grid").then((m) => ({ default: m.PricingPlansGrid })),
  { ssr: true }
);
const PricingNotesPanel = dynamic(
  () => import("@/components/marketing/pricing-notes-panel").then((m) => ({ default: m.PricingNotesPanel })),
  { ssr: true }
);
const ServicesPageCta = dynamic(
  () => import("@/components/marketing/services-page-cta").then((m) => ({ default: m.ServicesPageCta })),
  { ssr: true }
);

const baseUrl = (() => { try { return getSiteUrl(); } catch { return "http://localhost:3000"; } })();

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent digitizing pricing from $15. First order free for new clients. Rush and same-day options available.",
  alternates: { canonical: `${baseUrl}/pricing` },
  openGraph: {
    title: "Pricing — GenX Digitizing",
    description:
      "Transparent digitizing pricing from $15. First order free for new clients. Rush and same-day options available.",
    url: `${baseUrl}/pricing`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — GenX Digitizing",
    description:
      "Transparent digitizing pricing from $15. First order free for new clients. Rush and same-day options available.",
  },
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
