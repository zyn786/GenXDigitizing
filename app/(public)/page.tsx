import type { Metadata } from "next";

import { DeliverySequence } from "@/components/marketing/delivery-sequence";
import { FinalCtaBanner } from "@/components/marketing/cta-banner";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProductionShowcaseSection } from "@/components/marketing/production-showcase";
import { ServicePillars } from "@/components/marketing/service-pillars";
import { StitchTransformSection } from "@/components/marketing/stitch-transform-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { WhyScaffoldMatters } from "@/components/marketing/why-scaffold-matters";
import { ScrollSectionNav } from "@/components/ui/scroll-section-nav";

export const metadata: Metadata = {
  title: "GenX Digitizing — Premium Embroidery Digitizing, Vector Art & Custom Patches",
  description:
    "Production-ready embroidery digitizing, vector art conversion, and custom patch setup delivered within 24 hours. Revisions included.",
};

const SECTIONS = [
  { id: "home",         label: "Home"         },
  { id: "services",     label: "Services"     },
  { id: "what-we-do",  label: "What We Do"   },
  { id: "our-work",    label: "Our Work"      },
  { id: "why-us",      label: "Why Us"        },
  { id: "how-it-works",label: "How It Works"  },
  { id: "reviews",     label: "Reviews"       },
  { id: "get-started", label: "Get Started"   },
];

export default function HomePage() {
  return (
    <>
      <ScrollSectionNav sections={SECTIONS} />

      <div id="home">         <HeroSection />           </div>
      <div id="services">     <StitchTransformSection /> </div>
      <div id="what-we-do">   <ServicePillars />         </div>
      <div id="our-work">     <ProductionShowcaseSection /></div>
      <div id="why-us">       <WhyScaffoldMatters />     </div>
      <div id="how-it-works"> <DeliverySequence />       </div>
      <div id="reviews">      <TestimonialsSection />    </div>
      <div id="get-started">  <FinalCtaBanner />         </div>
    </>
  );
}
