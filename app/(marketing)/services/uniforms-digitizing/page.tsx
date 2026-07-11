// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Uniform Embroidery Digitizing Service",
  shortName: "Uniforms",
  subtitle: "Production-Ready Files | Bulk-Optimized | All Formats",
  description: "Professional uniform digitizing for corporate, school, medical, hospitality, and industrial uniforms. Production-optimized files for high-volume runs. Consistent quality across hundreds of pieces.",
  emoji: "👔", color: "#2563EB",
  keywords: ["uniform digitizing","uniform embroidery digitizing","corporate uniform digitizing","school uniform embroidery","work uniform digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🏭", title: "Production-Optimized", desc: "Files designed for high-volume uniform runs. Efficient path planning minimizes trims and color changes for faster production." },
    { icon: "📐", title: "Multi-Placement Ready", desc: "Left chest, right chest, sleeve, and back placements — all from one source file. Consistent sizing and registration across all positions." },
    { icon: "🎨", title: "Brand-Accurate Colors", desc: "Precise thread color matching to corporate brand guidelines. Consistent reproduction across every uniform piece." },
    { icon: "📏", title: "Size-Graded Designs", desc: "Design variations for different uniform sizes (XS–5XL). Proper scaling for each garment size without distortion." },
    { icon: "⚡", title: "Bulk Turnaround", desc: "Handles large uniform orders efficiently. Multiple files delivered together with consistent quality and settings." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited revisions on every uniform design. We adjust until every file runs perfectly in your production environment." },
  ],
  faqs: [
    { q: "Can you digitize for different uniform placements?", a: "Yes — left chest, right chest, sleeve, back, and cap placements. We deliver all placement variations from one source file with consistent settings." },
    { q: "How do you handle large uniform orders?", a: "We batch-process uniform designs for consistency. All files use the same density, underlay, and color settings for uniform output across the entire order." },
    { q: "Do you support corporate brand guidelines?", a: "Yes — we match thread colors to Pantone references and follow any brand-specific embroidery guidelines you provide." },
    { q: "What file formats do you deliver for uniforms?", a: "DST is standard for commercial machines. We also provide PES, EMB, JEF, and any other format needed — all included free." },
  ],
  testimonials: [
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "We handle corporate uniform programs for Fortune 500 companies. genxdigitizing delivers consistent quality across hundreds of pieces. Brand colors always match." },
    { name: "James Okafor", company: "Victory Sportswear, Nigeria", text: "School uniform orders are our bread and butter. genxdigitizing's production-optimized files save us hours of machine time. Efficient path planning makes a real difference." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Uniforms — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/uniforms-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Uniform Digitizing", url: "/services/uniforms-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
