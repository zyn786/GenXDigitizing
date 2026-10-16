// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import {
  ServicePageTemplate,
  type ServicePageData,
} from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Custom Patch Design Service",
  shortName: "Patches",
  // Subtitle and description used to promise "Bulk Discounts" and "Free
  // Shipping". Neither exists: the live coupons table carries a single
  // first-order code (GENX10, 10%, is_bulk_discount false) and no bulk coupon
  // at all, and this service ships nothing — the terms scope it to "digitized
  // patches with merrow borders" and delivery is by file. Claims replaced with
  // what the service actually does.
  subtitle: "Embroidered, Woven, PVC & More | From $5 Per Design",
  description:
    "Professional custom patch digitizing for embroidered, PVC, woven, chenille, and leather patches. Merrow borders, iron-on backing, and production-ready files.",
  emoji: "🏷️",
  color: "#16A34A",
  keywords: [
    "custom patch digitizing",
    "custom embroidered patches",
    "patch design service",
    "custom patches online",
    "embroidered patch design",
  ],
  startingPrice: 5,
  formats: "DST, PES, EMB & more",
  turnaround: "3–24h delivery",
  benefits: [
    {
      icon: "🎨",
      title: "Any Patch Type",
      desc: "Embroidered, PVC, woven, chenille, leather, and printed patches. We digitize for every material and production method.",
    },
    {
      icon: "📐",
      title: "Perfect Borders",
      desc: "Merrow (overlock) and satin stitch borders. Clean, professional edges that won't fray or unravel over time.",
    },
    {
      icon: "💰",
      title: "Large Runs Welcome",
      desc: "Single samples to full production runs. Volume work is quoted per project — send us the quantity and we'll price it against the design.",
    },
    {
      icon: "📦",
      title: "Merrow Border Ready",
      desc: "Files prepared for merrow-edge and satin-border patch production, with the border path, underlay and density set for the material you're using.",
    },
    {
      icon: "🖼️",
      title: "Digital Preview",
      desc: "See a digital mockup of your patch before production. Approve colors, size, and placement before we begin.",
    },
    {
      icon: "🔄",
      title: "Free Revisions",
      desc: "Unlimited revisions on patch designs. We adjust until every detail matches your vision.",
    },
  ],
  faqs: [
    {
      q: "What patch types do you offer?",
      a: "We offer embroidered patches (most common), PVC patches (rubber-like, durable), woven patches (fine detail), chenille patches (textured), and leather patches (premium).",
    },
    {
      q: "What backing options are available?",
      a: "Iron-on (heat seal), sew-on, Velcro (hook and loop), adhesive (peel and stick), and magnetic backing. We recommend based on your application.",
    },
    {
      q: "What's the minimum order for custom patches?",
      a: "We handle orders of any size, from single samples to full bulk runs. Volume pricing is quoted per project rather than published as a rate card, so tell us the quantity and design and we'll price it.",
    },
    {
      q: "How long does patch digitizing take?",
      // Was "How long does patch production take?" answered with "physical
      // patch production typically takes 5-10 business days" — we do not
      // manufacture patches, so that described a process that does not exist.
      a: "Standard delivery is 3–24 hours depending on the tier you choose, with rush and urgent options at no extra charge.",
    },
  ],
  portfolioSlug: "patches",
  cta: { text: "Design Your Custom Patches — Free Quote", href: "/contact" },
};

export const metadata: Metadata = {
  alternates: { canonical: "/services/custom-patches" },
  title: `${DATA.title} — genxdigitizing`,
  description: DATA.description,
  keywords: DATA.keywords,
};

export default function Page() {
  return (
    <>
      <ServiceSchema
        price={DATA.startingPrice}
        name={DATA.title}
        description={DATA.description}
        url="/services/custom-patches"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: "Custom Patches", url: "/services/custom-patches" },
        ]}
      />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
