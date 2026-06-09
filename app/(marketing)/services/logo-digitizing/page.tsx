// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Logo Digitizing Service — Custom Logo Embroidery Files",
  subtitle: "Stitch-Perfect Logos | All Formats | From $7",
  description: "Professional logo digitizing for corporate branding, team uniforms, promotional products, and retail apparel. Clean stitch paths, accurate color matching, and production-ready files for any embroidery machine.",
  emoji: "✨", color: "#2563EB",
  keywords: ["logo digitizing service","custom logo digitizing","logo embroidery digitizing","business logo digitizing","brand logo embroidery"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🎨", title: "Accurate Color Matching", desc: "We match thread colors to your brand palette. Consistent reproduction across every order and every garment type." },
    { icon: "📐", title: "Optimized for Any Size", desc: "We adjust density, underlay, and stitch type for each size. Left chest logos need different settings than jacket back logos." },
    { icon: "🔤", title: "Sharp Small Text", desc: "Company taglines and fine print stay legible. We use specialized fonts and techniques for text as small as 5mm." },
    { icon: "⚡", title: "Fast Delivery", desc: "Most logo designs digitized in under 12 hours. Rush delivery available in 6 hours at no extra cost." },
  ],
  faqs: [
    { q: "Can you digitize my existing logo file?", a: "Yes — we accept JPG, PNG, PDF, AI, EPS, and even photos of hand-drawn logos. We'll clean up and optimize for embroidery." },
    { q: "How do you match my brand colors?", a: "We reference Pantone colors or your brand style guide. If you don't have exact color codes, we match to the closest thread colors." },
    { q: "What size should my logo be for digitizing?", a: "Provide the artwork at the largest size available. We scale down for embroidery while maintaining legibility and proportion." },
  ],
  testimonials: [
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "Switched from my previous service. Better stitch quality. Underlay and density handled properly here. Our corporate client logos look flawless." },
    { name: "Priya Mehta", company: "Monogram Collective, India", text: "Fast, affordable, and the free format conversion saves me time. I get DST, PES, and JEF all in one order for every client logo." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Logo — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/logo-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Logo Digitizing", url: "/services/logo-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
