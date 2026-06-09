// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Bag Embroidery Digitizing Service",
  subtitle: "Multi-Material Files | Totes, Backpacks & Duffels | All Formats",
  description: "Professional digitizing for tote bags, backpacks, duffel bags, and promotional bags. Multi-material optimization for canvas, nylon, polyester, and leather. Clean sew-outs on thick and thin bag fabrics.",
  emoji: "🎒", color: "#8B5CF6",
  keywords: ["bag digitizing","tote bag embroidery digitizing","backpack digitizing","duffel bag embroidery","bag logo digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB, JEF & more", turnaround: "3–24h delivery",
  benefits: [
    { icon: "🧵", title: "Multi-Material Expertise", desc: "Files optimized for canvas, nylon, polyester, leather, and mixed-material bags. Each material gets tailored density and underlay settings." },
    { icon: "🏗️", title: "Heavy Fabric Underlay", desc: "Proper stabilizing underlay for thick bag materials. Prevents design shifting and ensures clean registration on heavy canvas and nylon." },
    { icon: "📐", title: "Hoop-Friendly Designs", desc: "Designs sized and sequenced for bag hooping challenges. Center-out stitching for easy placement on awkward bag positions." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Standard 12-hour delivery. Rush in 6 hours. All speed options included at no extra charge." },
    { icon: "🔧", title: "Lining-Aware Settings", desc: "Stitch settings that account for bag linings. Prevents stitching through zippers and inner pockets." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited free revisions until files run clean. We adjust for your specific bag material and machine setup." },
  ],
  faqs: [
    { q: "Can you digitize for different bag materials?", a: "Yes — we optimize for canvas, nylon, polyester, leather, and mixed materials. Each material requires different density and underlay settings." },
    { q: "What's the typical embroidery size for tote bags?", a: "Standard tote bag embroidery areas range from 3″–6″ wide. Backpacks can accommodate 4″–8″ wide designs. We optimize for your specific bag dimensions." },
    { q: "How do you handle thick bag fabrics?", a: "Thick materials like canvas need stronger underlay and slightly reduced density. We adjust settings per fabric to ensure clean, professional results." },
  ],
  testimonials: [
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "Tote bag orders used to break needles constantly. genxdigitizing's bag-optimized files handle thick canvas perfectly. Clean sew-outs, zero issues." },
    { name: "Priya Mehta", company: "Monogram Collective, India", text: "We do corporate branded bags for events. genxdigitizing handles all materials — canvas, nylon, leather — with consistent quality across the board." },
  ],
  portfolioSlug: "digitizing",
  cta: { text: "Digitize Your Bags — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/bags-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Bag Digitizing", url: "/services/bags-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
