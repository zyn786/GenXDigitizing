// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Cap Digitizing Service — Professional Hat Embroidery Files",
  subtitle: "Curve-Compensated Stitch Paths | Clean Sew-Outs | All Formats",
  description: "Specialized cap and hat digitizing with structural underlay, curve compensation, and optimized stitch angles for clean sew-outs on curved surfaces. Perfect for 6-panel, 5-panel, snapbacks, and fitted caps.",
  emoji: "🧢", color: "#F97316",
  keywords: ["cap digitizing service","hat digitizing","cap embroidery digitizing","hat embroidery files","custom cap digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "6–24h delivery",
  benefits: [
    { icon: "📐", title: "Curve Compensation", desc: "Stitch paths adjusted for the curved surface of caps. Prevents distortion, puckering, and registration errors on curved panels." },
    { icon: "🏗️", title: "Structural Underlay", desc: "Proper underlay stitching stabilizes cap fabric before top stitching. Essential for clean, professional-looking cap embroidery." },
    { icon: "🎯", title: "Center-Out Sequencing", desc: "Files sequenced to sew from center outward. Prevents the design from shifting as stitches accumulate on curved surfaces." },
    { icon: "📏", title: "Size-Optimized", desc: "Designs sized correctly for standard cap embroidery areas (2.25″ height). No oversized files that exceed hoop limits." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12-hour delivery. Rush in 6 hours. Urgent in 3 hours. All speed options included free." },
    { icon: "🔄", title: "Free Revisions Forever", desc: "Unlimited revisions until the file runs clean on your machine. 98% of cap designs approved on first pass." },
  ],
  faqs: [
    { q: "What makes cap digitizing different from flat digitizing?", a: "Caps have a curved surface that requires special stitch sequencing (center-out), structural underlay, and pull compensation adjustments. Flat digitizing techniques produce distorted results on caps." },
    { q: "What size should cap designs be?", a: "Standard cap embroidery area is 2.25″ tall by 4.5″ wide. We optimize every design for these dimensions. Larger designs may require specialty hooping." },
    { q: "Do you handle 3D puff foam digitizing for caps?", a: "Yes — we specialize in 3D puff cap digitizing with proper foam underlay, satin stitch settings, and density adjustments for raised embroidery effects." },
  ],
  testimonials: [
    { name: "James Okafor", company: "Victory Sportswear, Nigeria", text: "Cap digitizing is tricky. genxdigitizing got it right first try. Structural underlay perfect for curved surfaces. Every file runs clean on my Tajima." },
    { name: "Sarah Kim", company: "Branded Threads Co., UK", text: "High-volume cap orders needed consistent 3D puff handling. genxdigitizing delivered proper underlay and height on every file with under 12-hour turnaround." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Get Professional Cap Digitizing — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/cap-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Cap Digitizing", url: "/services/cap-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
