// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Vector Art Conversion Service — Clean, Scalable Vectors",
  subtitle: "AI, SVG, EPS, PDF Output | Manual Redraw | From $8",
  description: "Professional vector art conversion from any source. JPGs, PNGs, hand sketches, and old artwork converted into clean, scalable vector files for screen printing, DTF, heat transfer, and large-format production.",
  emoji: "✏️", color: "#F97316",
  keywords: ["vector art conversion service","vector art services","convert to vector","jpg to vector service","professional vector conversion"],
  startingPrice: 8, formats: "AI, SVG, EPS, PDF, CDR", turnaround: "12–24h delivery",
  benefits: [
    { icon: "✍️", title: "Manual Redraw by Artists", desc: "Experienced vector artists manually trace your artwork. No auto-trace shortcuts. Clean paths, smooth curves, accurate colors." },
    { icon: "🖼️", title: "Any Source Accepted", desc: "Low-res JPGs, hand sketches, old business cards, photos — we convert any artwork into clean vector format." },
    { icon: "🎨", title: "Color Separations Included", desc: "Print-ready files with separated colors for screen printing. Each color on its own layer, labeled and organized." },
    { icon: "🔤", title: "Typography & Font Matching", desc: "We identify and match fonts from your original artwork. Clean typography reconstruction for logos and text-heavy designs." },
    { icon: "📦", title: "All Formats Delivered", desc: "AI (Illustrator), SVG (web), EPS (universal), PDF (print), and CDR (CorelDRAW). Whatever format your production needs." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Simple logos in 4–6 hours. Complex illustrations in 12–24 hours. Rush delivery available at no extra charge." },
  ],
  faqs: [
    { q: "What's the difference between raster and vector?", a: "Raster images (JPG, PNG) are made of pixels — they get blurry when enlarged. Vector images (AI, SVG, EPS) are made of mathematical paths — they stay sharp at any size." },
    { q: "Can you convert a photo to vector?", a: "Yes, but photo-to-vector conversion is complex. It requires skilled manual work and costs more than logo conversion. We'll provide a quote after reviewing your image." },
    { q: "What format should I send for conversion?", a: "Send the largest, highest-quality version you have. JPG and PNG are fine. If you have the original AI or PSD file, even better." },
    { q: "Do you offer rush vector conversion?", a: "Yes — simple logos can be completed in 2–4 hours. Rush delivery is included free with every order." },
  ],
  testimonials: [
    { name: "James T.", company: "Screen Printing Shop, Australia", text: "Their vector redraw service is incredible. We send hand-drawn sketches and get back production-ready vectors. Saves our design team days of work." },
    { name: "Linda Martinez", company: "ThreadWorks Studio, USA", text: "Clean vectors every time. We use them for both embroidery digitizing and screen printing. Consistent quality across the board." },
  ],
  cta: { text: "Convert Your Artwork — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — GenX Digitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/vector-art-conversion" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Vector Art Conversion", url: "/services/vector-art-conversion" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
