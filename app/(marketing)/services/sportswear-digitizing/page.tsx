// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Sportswear Embroidery Digitizing Service",
  subtitle: "Performance-Fabric Files | Stretch-Ready | All Formats",
  description: "Professional sportswear digitizing for jerseys, performance wear, activewear, and team uniforms. Optimized for polyester, mesh, spandex, and moisture-wicking fabrics. Clean sew-outs on technical materials.",
  emoji: "⚽", color: "#F97316",
  keywords: ["sportswear digitizing","jersey digitizing","team uniform digitizing","performance wear embroidery","activewear digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🏃", title: "Performance Fabric Ready", desc: "Files optimized for polyester, mesh, spandex, and moisture-wicking fabrics. Proper density and underlay for technical sportswear materials." },
    { icon: "📐", title: "Stretch Compensation", desc: "Stitch paths adjusted for stretchy performance fabrics. Prevents distortion during wear and maintains design integrity." },
    { icon: "🏗️", title: "Lightweight Underlay", desc: "Minimal underlay for thin performance fabrics. Prevents show-through on the reverse side while maintaining stability." },
    { icon: "🎨", title: "Team Color Matching", desc: "Accurate thread matching to team colors and brand palettes. Consistent across jerseys, shorts, and accessories." },
    { icon: "🔢", title: "Number & Name Ready", desc: "Optimized digitizing for jersey numbers and player names. Clean, sharp small-to-medium text on performance fabrics." },
    { icon: "⚡", title: "Fast Bulk Delivery", desc: "Multiple files delivered in 12–24 hours. Rush available for pre-season and tournament deadlines." },
  ],
  faqs: [
    { q: "Can you digitize for moisture-wicking polyester?", a: "Yes — performance polyester needs lighter density and specialized underlay. We optimize every file for your specific sportswear fabric." },
    { q: "How do you handle mesh jerseys?", a: "Mesh fabrics require different underlay settings. We use edge-walk underlay and adjusted density to prevent stitches from sinking into mesh holes." },
    { q: "Do you digitize player names and numbers?", a: "Yes — we handle jersey numbers, player names, and team logos. All optimized for the same fabric type with consistent quality." },
    { q: "Can you handle large team orders?", a: "Yes — we batch-process team orders for consistency. All jerseys, shorts, and accessories use coordinated settings for uniform output." },
  ],
  testimonials: [
    { name: "James Okafor", company: "Victory Sportswear, Nigeria", text: "Team jersey orders are our specialty. genxdigitizing files handle polyester perfectly — no puckering, no show-through. Clean results on every jersey." },
    { name: "Marcus Rivera", company: "ProStitch Apparel, USA", text: "We do custom team uniforms for leagues. genxdigitizing's sportswear-optimized files save us so much production time. Numbers and names are always sharp." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Sportswear — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/sportswear-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Sportswear Digitizing", url: "/services/sportswear-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
