// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Left Chest Logo Digitizing Service",
  shortName: "Left Chest",
  subtitle: "Sharp Detail | Perfect Placement | Polo & Shirt Logos",
  description: "Professional left chest digitizing for polo shirts, dress shirts, uniforms, and corporate apparel. Optimized for small-format embroidery with sharp text, clean lines, and perfect registration.",
  emoji: "👕", color: "#06B6D4",
  keywords: ["left chest digitizing","left chest logo digitizing","small logo digitizing","polo shirt embroidery","corporate logo digitizing"],
  startingPrice: 7, formats: "DST, PES, EMB & more", turnaround: "6–12h delivery",
  benefits: [
    { icon: "📏", title: "Perfectly Sized", desc: "Standard left chest size (3.5″–4″ wide). We optimize every design for this format — readable text, proportional logos." },
    { icon: "🔤", title: "Sharp Small Text", desc: "Company names and taglines stay crisp at small sizes. Specialized underlay and density for text as small as 5mm." },
    { icon: "🎯", title: "Clean Registration", desc: "Precise color boundaries. No gaps between elements. Professional appearance on every shirt." },
    { icon: "⚡", title: "Fastest Turnaround", desc: "Most left chest logos digitized in 6–12 hours. Simple designs in as little as 3 hours. Rush always included free." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited adjustments until the file runs perfectly on your machine. 98% of left chest logos approved on first pass." },
  ],
  faqs: [
    { q: "What's the standard size for left chest logos?", a: "The standard size is 3.5″–4″ wide by 1″–2″ tall. We optimize stitch density and underlay for this specific format to ensure readability." },
    { q: "How many stitches does a left chest logo need?", a: "Typically 4,000–8,000 stitches depending on design complexity. We balance stitch count with production speed for efficient runs." },
    { q: "Can you digitize from a photo of my existing logo?", a: "Yes — we can work from photos, scans, or any digital file. We'll clean up and optimize for the left chest format." },
    { q: "What format do you deliver for left chest designs?", a: "DST is standard. We also provide PES, EMB, JEF, and any other format you need — all included at no extra charge." },
  ],
  testimonials: [
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "We run hundreds of left chest logos weekly for corporate clients. genxdigitizing files consistently run clean — zero thread breaks, perfect registration." },
    { name: "Priya Mehta", company: "Monogram Collective, India", text: "Fast, affordable, and the free format conversion saves me time. I get DST, PES, and JEF all in one order for every logo." },
  ],
  portfolioSlug: "digitizing",
  portfolioTag: "Left Chest",
  cta: { text: "Digitize Your Left Chest Logo — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/left-chest-digitizing" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Left Chest Digitizing", url: "/services/left-chest-digitizing" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
