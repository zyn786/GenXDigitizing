// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "3D Puff Embroidery Digitizing Service",
  shortName: "3D Puff",
  subtitle: "Raised Stitch Finish | Foam-Ready Files | Professional Results",
  description: "Specialized 3D puff digitizing for caps, jackets, and apparel. Proper foam underlay settings, satin stitch optimization, and density adjustments for raised, dimensional embroidery that stands out.",
  emoji: "🎩", color: "#7C3AED",
  keywords: ["3D puff digitizing service","3d puff embroidery","puff embroidery digitizing","raised embroidery digitizing","foam embroidery digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB & more", turnaround: "12–24h delivery",
  benefits: [
    { icon: "📐", title: "Foam-Specific Underlay", desc: "Proper underlay settings for foam-backed embroidery. Prevents foam from showing through and ensures clean satin stitch coverage." },
    { icon: "🎨", title: "Satin Stitch Optimization", desc: "Stitch width and density calibrated for 3D foam. Wide enough to cover the foam, tight enough for durability and clean appearance." },
    { icon: "✂️", title: "Clean Trim Lines", desc: "Strategic color changes and trim placement for post-sew foam removal. Minimal cleanup required after embroidery." },
    { icon: "🧢", title: "Cap & Flat Applications", desc: "Files optimized for both cap and flat-surface 3D puff. Different settings for curved vs flat foam applications." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12-hour delivery. Rush in 6 hours. All speed options included at no extra charge." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited revisions until the puff effect looks perfect. We adjust density, width, and sequencing until it's right." },
  ],
  faqs: [
    { q: "What is 3D puff embroidery?", a: "3D puff embroidery uses foam underneath satin stitches to create a raised, dimensional effect. The foam lifts the stitches off the fabric, giving logos and text a bold, premium appearance." },
    { q: "What file settings are different for 3D puff?", a: "Puff files require wider satin stitches, higher density, specific underlay to secure the foam, and careful sequencing to prevent the foam from tearing during embroidery." },
    { q: "Do I need special foam for 3D puff?", a: "Standard embroidery foam (2-3mm) works for most applications. We can recommend specific foam types based on your design and fabric." },
  ],
  testimonials: [
    { name: "Sarah Kim", company: "Branded Threads Co., UK", text: "High-volume cap orders needed consistent 3D puff handling. genxdigitizing delivered proper underlay and height on every file with under 12-hour turnaround." },
    { name: "David Chen", company: "The Embroidery House, Canada", text: "Their puff digitizing is exceptional. Every cap comes out with perfect height and clean edges. No foam showing through anywhere." },
  ],
  portfolioSlug: "digitizing",
  portfolioTag: "Puff 3D",
  cta: { text: "Get 3D Puff Digitizing — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/3d-puff-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "3D Puff Digitizing", url: "/services/3d-puff-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
