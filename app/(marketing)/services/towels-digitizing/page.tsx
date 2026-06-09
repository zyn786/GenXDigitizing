// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Towel Embroidery Digitizing Service",
  subtitle: "Terry-Cloth Optimized Files | Clean Sew-Outs | All Formats",
  description: "Professional towel digitizing for bath towels, golf towels, gym towels, and promotional towels. Terry-cloth optimized stitch settings — proper underlay, density, and pull compensation for looped fabrics.",
  emoji: "🪣", color: "#06B6D4",
  keywords: ["towel digitizing","towel embroidery digitizing","golf towel digitizing","bath towel embroidery","terry cloth digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🧵", title: "Terry-Cloth Optimization", desc: "Stitch density and underlay calibrated for looped terry fabric. Prevents stitches from sinking into the pile and disappearing." },
    { icon: "🏗️", title: "Heavy Underlay Settings", desc: "Thicker underlay for terry cloth surfaces. Stabilizes the fabric and creates a solid foundation for top stitching." },
    { icon: "📏", title: "Pile Height Adjusted", desc: "Stitch settings adjusted for different towel pile heights. High-pile towels need different density than low-pile microfiber towels." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12-hour delivery. Rush in 6 hours. All speed tiers included at no extra charge." },
    { icon: "🎨", title: "Bold, Visible Designs", desc: "Higher stitch density and wider satin columns ensure logos and text remain visible on textured towel surfaces." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited free revisions until the file runs clean on your towel material. Pay only when satisfied." },
  ],
  faqs: [
    { q: "Why do towels need special digitizing settings?", a: "Towels have a looped pile surface — standard digitizing settings cause stitches to sink in and become invisible. Towel-specific settings use heavier underlay and adjusted density." },
    { q: "What size designs work best on towels?", a: "Golf towels: 3″–5″ wide. Bath towels: 4″–8″ wide. Hand towels: 2″–4″ wide. We optimize for your specific towel dimensions." },
    { q: "Can you digitize for both white and colored towels?", a: "Yes. We adjust color recommendations based on towel color. Dark towels may need different underlay visibility settings than light towels." },
    { q: "What backing is needed for towel embroidery?", a: "Water-soluble topping (WST) is strongly recommended for terry cloth. We provide settings optimized for WST use." },
  ],
  testimonials: [
    { name: "James Okafor", company: "Victory Sportswear, Nigeria", text: "Golf towel orders were hit-or-miss until we switched to genxdigitizing. Their terry-cloth settings are perfect — logos pop on textured fabric." },
    { name: "David Chen", company: "The Embroidery House, Canada", text: "We do high-volume promotional towels. genxdigitizing files handle terry cloth perfectly. No sinking stitches, clean sew-outs every time." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Towels — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/towels-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Towel Digitizing", url: "/services/towels-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
