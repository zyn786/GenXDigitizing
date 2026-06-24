import type { Metadata } from "next";
import { ServicePageTemplate } from "@/components/marketing/ServicePageTemplate";
import type { ServicePageData } from "@/components/marketing/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Appliqué Digitizing Services — From $8 — genxdigitizing",
  description:
    "Professional appliqué digitizing services. Clean placement lines, tack-down stitches, and cover stitches for flawless appliqué embroidery.",
  keywords: [
    "applique digitizing", "applique embroidery digitizing", "applique design",
    "tack-down stitch", "cover stitch", "placement line digitizing",
  ],
};

const DATA: ServicePageData = {
  title: "Appliqué Digitizing",
  subtitle: "Clean placement lines, precise tack-down, flawless cover stitches",
  description:
    "Appliqué digitizing requires precise placement lines, secure tack-down stitches, and clean cover stitches. Our experienced digitizers create production-ready appliqué files that save fabric and reduce waste.",
  emoji: "🧩",
  color: "#8B5CF6",
  keywords: ["appliqué", "tack-down", "cover stitch", "placement line", "fabric appliqué"],
  startingPrice: 8,
  formats: "DST, PES, EMB, JEF, XXX, VIP",
  turnaround: "12–24h (rush available)",
  portfolioSlug: "digitizing",
  portfolioTag: "Applique",
  benefits: [
    {
      icon: "📍",
      title: "Precise Placement Lines",
      desc: "Clean, accurate placement lines ensure your appliqué fabric is positioned correctly every time — no guesswork on the machine.",
    },
    {
      icon: "📌",
      title: "Secure Tack-Down Stitches",
      desc: "Multiple tack-down passes keep fabric firmly in place before the final cover stitch — prevents shifting and bunching.",
    },
    {
      icon: "✂️",
      title: "Clean Cover Stitches",
      desc: "Smooth, even cover stitches with proper density for your fabric type. Satin or fill — we match your design requirements.",
    },
    {
      icon: "🧵",
      title: "Fabric-Optimized Settings",
      desc: "Stitch parameters adjusted for your appliqué material: cotton, twill, fleece, leather, or specialty fabrics.",
    },
    {
      icon: "💾",
      title: "Reduce Fabric Waste",
      desc: "Optimized stitch paths minimize jump stitches and thread waste. Efficient production means lower costs per piece.",
    },
    {
      icon: "♾️",
      title: "Unlimited Free Revisions",
      desc: "Not satisfied with the appliqué result? We revise until it runs perfectly on your machine — no extra charges.",
    },
  ],
  faqs: [
    {
      q: "What is appliqué digitizing?",
      a: "Appliqué digitizing creates embroidery files that include placement lines (showing where to put fabric), tack-down stitches (securing the fabric), and cover stitches (the decorative edge). It's used to create bold designs with fabric pieces instead of filling large areas with thread.",
    },
    {
      q: "What file formats do you provide for appliqué?",
      a: "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — all major machine formats included at no extra cost.",
    },
    {
      q: "Can you digitize multi-fabric appliqués?",
      a: "Yes. We handle multi-layer appliqués with separate placement and tack-down sequences for each fabric piece.",
    },
    {
      q: "What's the turnaround time?",
      a: "Standard delivery in 12–24 hours. Rush (6h) and urgent (3h) options available at no extra charge.",
    },
    {
      q: "Do I need to specify fabric type?",
      a: "It helps but isn't required. If you tell us the fabric (cotton, twill, fleece, etc.), we optimize stitch settings accordingly.",
    },
  ],
  testimonials: [
    {
      name: "Angela Foster",
      company: "Custom Apparel Co.",
      text: "Our appliqué designs always come back with perfect placement lines. Zero guesswork for our machine operators. Highly recommend genxdigitizing.",
    },
    {
      name: "Tomás Rivera",
      company: "Rivera Embroidery",
      text: "The tack-down sequence on multi-fabric appliqués is spot-on. No shifting, no bunching. Clean cover stitches every time.",
    },
  ],
  cta: { text: "Upload Design — Free Quote", href: "/contact" },
};

export default function AppliqueDigitizingPage() {
  return <ServicePageTemplate data={DATA} />;
}
