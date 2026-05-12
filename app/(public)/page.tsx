import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/hero-section";

const DeliverySequence = dynamic(
  () => import("@/components/marketing/delivery-sequence").then((m) => ({ default: m.DeliverySequence })),
  { ssr: true }
);
const FinalCtaBanner = dynamic(
  () => import("@/components/marketing/cta-banner").then((m) => ({ default: m.FinalCtaBanner })),
  { ssr: true }
);
const ProductionShowcaseSection = dynamic(
  () => import("@/components/marketing/production-showcase").then((m) => ({ default: m.ProductionShowcaseSection })),
  { ssr: true }
);
const ServicePillars = dynamic(
  () => import("@/components/marketing/service-pillars").then((m) => ({ default: m.ServicePillars })),
  { ssr: true }
);
const StitchTransformSection = dynamic(
  () => import("@/components/marketing/stitch-transform-section").then((m) => ({ default: m.StitchTransformSection })),
  { ssr: true }
);
const TestimonialsSection = dynamic(
  () => import("@/components/marketing/testimonials-section").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: true }
);
const WhyScaffoldMatters = dynamic(
  () => import("@/components/marketing/why-scaffold-matters").then((m) => ({ default: m.WhyScaffoldMatters })),
  { ssr: true }
);

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
      <div id="what-we-do">   <ServicePillars />         </div>
      <div id="services">     <StitchTransformSection /> </div>
      <div id="our-work">     <ProductionShowcaseSection /></div>
      <div id="why-us">       <WhyScaffoldMatters />     </div>
      <div id="how-it-works"> <DeliverySequence />       </div>
      <div id="reviews">      <TestimonialsSection />    </div>
      <div id="get-started">  <FinalCtaBanner />         </div>
    </>
  );
}
