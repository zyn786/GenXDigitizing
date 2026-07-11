// @ts-nocheck
import type { Metadata } from "next";
import { BreadcrumbSchema, ServiceSchema } from "@/components/shared/StructuredData";
import { ServicePageTemplate, type ServicePageData } from "@/components/marketing/ServicePageTemplate";

const DATA: ServicePageData = {
  title: "Custom Patch Design Service",
  shortName: "Patches",
  subtitle: "Bulk Discounts | Free Shipping | From $5 Per Design",
  description: "Professional custom patch digitizing for embroidered, PVC, woven, chenille, and leather patches. Merrow borders, iron-on backing, and bulk order discounts. 500+ patches up to 50% off.",
  emoji: "🏷️", color: "#16A34A",
  keywords: ["custom patch digitizing","custom embroidered patches","patch design service","custom patches online","embroidered patch design"],
  startingPrice: 5, formats: "DST, PES, EMB & more", turnaround: "12–24h delivery",
  benefits: [
    { icon: "🎨", title: "Any Patch Type", desc: "Embroidered, PVC, woven, chenille, leather, and printed patches. We digitize for every material and production method." },
    { icon: "📐", title: "Perfect Borders", desc: "Merrow (overlock) and satin stitch borders. Clean, professional edges that won't fray or unravel over time." },
    { icon: "💰", title: "Bulk Discounts", desc: "500+ patches save up to 50%. Volume pricing for teams, events, brands, and promotional campaigns." },
    { icon: "📦", title: "Free Shipping", desc: "Free shipping on patch orders to USA, Canada, and Australia. International shipping available at competitive rates." },
    { icon: "🖼️", title: "Digital Preview", desc: "See a digital mockup of your patch before production. Approve colors, size, and placement before we begin." },
    { icon: "🔄", title: "Free Revisions", desc: "Unlimited revisions on patch designs. We adjust until every detail matches your vision." },
  ],
  faqs: [
    { q: "What patch types do you offer?", a: "We offer embroidered patches (most common), PVC patches (rubber-like, durable), woven patches (fine detail), chenille patches (textured), and leather patches (premium)." },
    { q: "What backing options are available?", a: "Iron-on (heat seal), sew-on, Velcro (hook and loop), adhesive (peel and stick), and magnetic backing. We recommend based on your application." },
    { q: "What's the minimum order for custom patches?", a: "We handle orders of any size, from single samples to 10,000+ bulk runs. Bulk discounts start at 50 patches, with maximum savings at 500+." },
    { q: "How long does patch production take?", a: "Digitizing takes 12–24 hours. Physical patch production typically takes 5–10 business days depending on quantity and complexity. Rush options available." },
  ],
  testimonials: [
    { name: "Marcus Rivera", company: "ProStitch Apparel, USA", text: "Ordered 500 patches for a corporate event. Quality was exceptional, colors matched perfectly, and the free shipping saved us $40. Will order again." },
    { name: "Priya Mehta", company: "Monogram Collective, India", text: "The patch digitizing service is fantastic. Clean borders, perfect thread colors, and the digital preview gave us confidence before production." },
  ],
  portfolioSlug: "patches",
  cta: { text: "Design Your Custom Patches — Free Quote", href: "/contact" },
};

export const metadata: Metadata = { title: `${DATA.title} — genxdigitizing`, description: DATA.description, keywords: DATA.keywords };

export default function Page() {
  return (
    <>
      <ServiceSchema name={DATA.title} description={DATA.description} url="/services/custom-patches" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Custom Patches", url: "/services/custom-patches" }]} />
      <ServicePageTemplate data={DATA} />
    </>
  );
}
