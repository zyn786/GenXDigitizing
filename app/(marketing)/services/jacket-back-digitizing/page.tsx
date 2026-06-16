// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Jacket Back Digitizing Service",
  subtitle: "Clean Stitch Paths | Optimized Density | Full Back Designs",
  description: "Professional large-format digitizing for jacket backs, varsity jackets, and oversized embroidery. Optimized density, smart path planning for efficient production, and stitch-perfect results on large designs.",
  emoji: "🧥", color: "#DC2626",
  keywords: ["jacket back digitizing","large format embroidery digitizing","jacket embroidery service","full back digitizing","varsity jacket digitizing"],
  startingPrice: 18, formats: "DST, PES, EMB & more", turnaround: "12–24h delivery",
  benefits: [
    { icon: "📐", title: "Large Format Optimized", desc: "Stitch density and underlay adjusted for 12″+ designs. Prevents fabric puckering and distortion on large embroidery areas." },
    { icon: "🧵", title: "Efficient Path Planning", desc: "Smart sequencing minimizes trims and color changes on large designs. Faster production, less thread waste." },
    { icon: "🎨", title: "Gradient & Detail Handling", desc: "Complex artwork with gradients and fine detail digitized cleanly. Every element scaled correctly for large-format output." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12–24 hour delivery for most jacket back designs. Rush options available at no extra charge." },
  ],
  faqs: [
    { q: "What's the typical size for jacket back designs?", a: "Standard jacket back embroidery area is 10″–14″ wide by 10″–14″ tall. We optimize for your specific jacket dimensions and hoop size." },
    { q: "How many stitches does a jacket back design need?", a: "Typically 15,000–30,000+ stitches depending on design complexity and coverage. We provide stitch count estimates with every quote." },
    { q: "What file format should I use for jacket back digitizing?", a: "DST is the standard for large-format commercial machines. We also deliver PES, EMB, and any other format you need." },
  ],
  testimonials: [
    { name: "James Okafor", company: "Victory Sportswear, Nigeria", text: "Our jacket backs are 14″ wide with complex team logos. genxdigitizing handles them perfectly — clean stitch paths, minimal trims, flawless registration." },
    { name: "David Chen", company: "The Embroidery House, Canada", text: "Large format digitizing is hard to get right. genxdigitizing nails it every time. Density is perfect — no puckering, no distortion." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Jacket Back — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/jacket-back-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Jacket Back Digitizing", url: "/services/jacket-back-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
