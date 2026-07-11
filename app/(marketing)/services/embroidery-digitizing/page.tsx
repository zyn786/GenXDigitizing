// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Professional Embroidery Digitizing Service",
  shortName: "Digitizing",
  subtitle: "Fast Turnaround | Free Edits | DST, PES, EMB Files",
  description: "Production-ready embroidery digitizing for caps, jackets, polos, left chest logos, and more. Manual digitizing by experienced professionals. Free unlimited revisions included.",
  emoji: "🧵", color: "#2563EB",
  keywords: ["embroidery digitizing service","professional embroidery digitizing","custom embroidery digitizing","DST PES digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF, EXP & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🧵", title: "100% Manual Digitizing", desc: "Every stitch path hand-placed by experienced digitizers. No auto-trace. Optimized for your exact machine and fabric." },
    { icon: "⚡", title: "3–24 Hour Turnaround", desc: "Standard delivery in 12 hours. Rush in 6. Urgent in 3. All speed tiers free — unlike competitors who charge extra." },
    { icon: "🔄", title: "Unlimited Free Revisions", desc: "Not satisfied? We keep going until your file runs clean. No caps. No extra charges. 98% first-pass approval rate." },
    { icon: "🎯", title: "Machine-Tested Quality", desc: "Every file reviewed by ex-production-floor QC specialist. Stitch angles checked. Density verified. Pull compensation dialed in." },
    { icon: "📁", title: "All Formats Included", desc: "DST, PES, EMB, JEF, EXP, XXX, VIP, HUS — we deliver whatever your machines need. Format conversion always free." },
    { icon: "💳", title: "Pay When Satisfied", desc: "Review your proof first. Approve the quality. Then pay. Zero risk — if we can't get it right, full refund." },
  ],
  faqs: [
    { q: "How much does embroidery digitizing cost?", a: "Standard designs (4″–8″) start at $7. Large designs (8″–12″) are $18. Jumbo designs (12″+) are $25. All prices include free revisions, free format conversion, and free rush delivery." },
    { q: "How long does digitizing take?", a: "Standard turnaround is 12–24 hours. Rush delivery (6 hours) and urgent delivery (3 hours) are available at no extra cost." },
    { q: "What file formats do you deliver?", a: "We deliver DST, PES, EMB, JEF, EXP, XXX, VIP, HUS, and more. If your machine needs a format we haven't listed, just ask — we'll provide it." },
    { q: "Can you digitize from any artwork?", a: "Yes — we work with JPGs, PNGs, PDFs, AI files, and even hand sketches. Low-resolution or complex images may need cleanup before digitizing." },
    { q: "Are revisions really free?", a: "Yes — unlimited free revisions on every order. We work until the file runs correctly on your machine. No hidden charges." },
  ],
  testimonials: [
    { name: "Marcus Rivera", company: "ProStitch Apparel, USA", text: "Files run clean on first load. Tight stitch paths and correct density for my Brother machine. Will use genxdigitizing for all future orders." },
    { name: "Sarah Kim", company: "Branded Threads Co., UK", text: "High-volume cap orders needed consistent 3D puff handling. genxdigitizing delivered proper underlay and height on every file with under 12-hour turnaround." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Get Professional Digitizing — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/embroidery-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Embroidery Digitizing", url: "/services/embroidery-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
