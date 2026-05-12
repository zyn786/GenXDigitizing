import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/hero-section";

/* ── Skeleton placeholder ─────────────────────────────────────── */

function SectionSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/[0.06]" />
    </div>
  );
}

/* ── Deferred below-fold sections ─────────────────────────────── */

const ServicePillars = dynamic(
  () => import("@/components/marketing/service-pillars").then((m) => ({ default: m.ServicePillars })),
  { loading: () => <SectionSkeleton /> }
);
const StitchTransformSection = dynamic(
  () => import("@/components/marketing/stitch-transform-section").then((m) => ({ default: m.StitchTransformSection })),
  { loading: () => <SectionSkeleton /> }
);
const ProductionShowcaseSection = dynamic(
  () => import("@/components/marketing/production-showcase").then((m) => ({ default: m.ProductionShowcaseSection })),
  { loading: () => <SectionSkeleton /> }
);
const WhyScaffoldMatters = dynamic(
  () => import("@/components/marketing/why-scaffold-matters").then((m) => ({ default: m.WhyScaffoldMatters })),
  { loading: () => <SectionSkeleton /> }
);
const DeliverySequence = dynamic(
  () => import("@/components/marketing/delivery-sequence").then((m) => ({ default: m.DeliverySequence })),
  { loading: () => <SectionSkeleton /> }
);
const TestimonialsSection = dynamic(
  () => import("@/components/marketing/testimonials-section").then((m) => ({ default: m.TestimonialsSection })),
  { loading: () => <SectionSkeleton /> }
);
const FinalCtaBanner = dynamic(
  () => import("@/components/marketing/cta-banner").then((m) => ({ default: m.FinalCtaBanner })),
  { loading: () => <SectionSkeleton /> }
);

/* ── Metadata ─────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "GenX Digitizing — Premium Embroidery Digitizing, Vector Art & Custom Patches",
  description:
    "Production-ready embroidery digitizing, vector art conversion, and custom patch setup delivered within 24 hours. Revisions included.",
  openGraph: {
    title: "GenX Digitizing — Premium Embroidery Digitizing",
    description:
      "Production-ready embroidery digitizing, vector art, and custom patches delivered within 24 hours.",
    url: "https://genxdigitizing.com",
    siteName: "GenX Digitizing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenX Digitizing — Premium Embroidery Digitizing",
    description:
      "Production-ready embroidery digitizing, vector art, and custom patches delivered within 24 hours.",
  },
};

export default function HomePage() {
  return (
    <>
      <div id="home">         <HeroSection />           </div>
      <div id="what-we-do"   className="content-lazy"> <ServicePillars />         </div>
      <div id="services"     className="content-lazy"> <StitchTransformSection /> </div>
      <div id="our-work"     className="content-lazy"> <ProductionShowcaseSection /></div>
      <div id="why-us"       className="content-lazy"> <WhyScaffoldMatters />     </div>
      <div id="how-it-works" className="content-lazy"> <DeliverySequence />       </div>
      <div id="reviews"      className="content-lazy"> <TestimonialsSection />    </div>
      <div id="get-started"  className="content-lazy"> <FinalCtaBanner />         </div>
    </>
  );
}
