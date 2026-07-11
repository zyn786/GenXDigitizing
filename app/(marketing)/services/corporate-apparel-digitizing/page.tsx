// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Corporate Apparel Embroidery Digitizing Service",
  shortName: "Corporate Apparel",
  subtitle: "Brand-Perfect Files | Multi-Garment | All Formats",
  description: "Professional corporate apparel digitizing for polos, dress shirts, jackets, vests, and accessories. Brand-consistent embroidery across entire corporate wardrobe programs. Precise logo reproduction for professional environments.",
  emoji: "🏢", color: "#1E3A5F",
  keywords: ["corporate apparel digitizing","corporate embroidery digitizing","brand logo digitizing","corporate uniform embroidery","business apparel digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🏢", title: "Brand Consistency", desc: "Every file calibrated for identical output across all garment types. Polos, dress shirts, and jackets all stitch identically — same brand presence." },
    { icon: "👔", title: "Multi-Garment Optimization", desc: "Proper settings for dress shirts (light oxford), polos (pique knit), and jackets (heavy twill). Each fabric gets tailored density and underlay." },
    { icon: "🎨", title: "Pantone Color Matching", desc: "Thread colors matched to corporate Pantone references. Consistent brand reproduction across the entire corporate wardrobe." },
    { icon: "📐", title: "Left Chest Specialization", desc: "Precision left chest logo digitizing for corporate polos and dress shirts. Sharp text, clean registration, professional appearance." },
    { icon: "⚡", title: "Program Turnaround", desc: "Full corporate programs delivered in 24 hours. Individual designs in 6–12 hours. Rush options always available." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited revisions until every file meets corporate brand standards. We work to your exact specifications." },
  ],
  faqs: [
    { q: "Can you handle full corporate apparel programs?", a: "Yes — we digitize for entire corporate wardrobe collections including polos, dress shirts, jackets, vests, caps, and accessories. Consistent quality across all items." },
    { q: "How do you ensure brand consistency across garments?", a: "We use shared density and underlay profiles calibrated per fabric type. The same logo looks identical on a polo, dress shirt, or jacket — just optimized for each fabric." },
    { q: "Do you work with corporate brand guidelines?", a: "Absolutely. We follow your brand style guide for logo placement, sizing, and colors. Thread matching to Pantone references included." },
    { q: "What's the typical turnaround for corporate programs?", a: "Full corporate programs delivered in 24 hours. Individual employee items in 12 hours. Rush delivery available for onboarding needs." },
  ],
  testimonials: [
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "Fortune 500 corporate programs demand absolute consistency. genxdigitizing delivers — identical stitch quality across polos, jackets, and caps. Brand guidelines followed perfectly." },
    { name: "Priya Mehta", company: "Monogram Collective, India", text: "Corporate onboarding is time-sensitive. genxdigitizing turns around full company programs in 24 hours with consistent quality. Our corporate clients are impressed." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Corporate Apparel — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/corporate-apparel-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Corporate Apparel Digitizing", url: "/services/corporate-apparel-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
