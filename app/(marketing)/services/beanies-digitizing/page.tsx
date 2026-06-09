// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Beanie Embroidery Digitizing Service",
  subtitle: "Stretch-Optimized Files | Clean Knit Sew-Outs | All Formats",
  description: "Professional beanie and knit cap digitizing with stretch compensation, optimized underlay, and clean stitch paths for beanies, toques, and knit headwear. Files that run clean on stretchy fabrics.",
  emoji: "🧣", color: "#DC2626",
  keywords: ["beanie digitizing","beanie embroidery digitizing","knit cap digitizing","toque embroidery","beanie logo digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🧶", title: "Stretch Compensation", desc: "Stitch paths adjusted for knit fabric stretch. Prevents distortion and puckering when the beanie fabric expands on the wearer's head." },
    { icon: "🏗️", title: "Stabilizing Underlay", desc: "Specialized underlay for knit beanies. Edge-walk and zigzag underlay that locks the fabric before top stitching." },
    { icon: "📐", title: "Size-Optimized Designs", desc: "Designs sized for standard beanie embroidery areas (2″–2.5″ tall). Perfectly proportioned for knit cap panels." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12-hour delivery. Rush in 6 hours. Urgent in 3 hours. All speed tiers included free." },
    { icon: "🎨", title: "Low-Stitch Designs", desc: "Optimized stitch counts for knit fabrics. Lighter density prevents beanie fabric from sagging or puckering." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited free revisions until the file runs clean on your beanies. 98% first-pass approval rate." },
  ],
  faqs: [
    { q: "What makes beanie digitizing different from flat digitizing?", a: "Beanies are stretchy knit fabric — they need stretch compensation, lighter density, and specialized underlay. Standard flat digitizing settings will cause puckering and distortion." },
    { q: "What size should beanie designs be?", a: "Standard beanie embroidery area is 2″–2.5″ tall by 2.5″–4″ wide. We optimize for these dimensions. Cuff embroidery area varies by beanie style." },
    { q: "Can you digitize for both cuffed and non-cuffed beanies?", a: "Yes. Cuffed beanies have a thicker embroidery surface. We adjust underlay and density for both styles to ensure clean results." },
    { q: "Do you handle 3D puff on beanies?", a: "Yes — 3D puff on beanies requires careful density and underlay adjustments. We specialize in puff effects on knit fabrics." },
  ],
  testimonials: [
    { name: "Marcus Rivera", company: "ProStitch Apparel, USA", text: "Beanie orders used to be our biggest headache. genxdigitizing's stretch-compensated files run clean every time. No more puckering on knit fabric." },
    { name: "Sarah Kim", company: "Branded Threads Co., UK", text: "We run thousands of beanie logos every winter season. genxdigitizing files are optimized perfectly for stretch — minimal thread breaks, sharp results." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Beanies — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/beanies-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Beanie Digitizing", url: "/services/beanies-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
