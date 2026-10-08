import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { FAQSchema, BreadcrumbSchema } from "@/components/shared/StructuredData";
import { LandingV2 } from "./LandingV2";

const FAQS = [
  {
    q: "What file formats do you deliver?",
    a: "We can provide the major embroidery machine formats, with format conversion included.",
  },
  {
    q: "How long does digitizing take?",
    a: "Standard turnaround is 12–24 hours. Rush and urgent turnaround options are available.",
  },
  {
    q: "Are revisions free?",
    a: "Yes. Revisions are included so we can get the file working properly for your production needs.",
  },
  {
    q: "Can you work from a low-quality logo?",
    a: "Yes. Send what you have and we will review the artwork and let you know if redraw or vector work is needed.",
  },
  {
    q: "How do I get a price?",
    a: "Upload your design with the size and placement. We review it and confirm the price before production.",
  },
];

export const metadata: Metadata = {
  title: "Embroidery Digitizing — GenX Digitizing",
  description:
    "Professional embroidery digitizing, vector artwork and custom patches. Upload your design for a clear quote and production-ready files.",
  keywords: [
    "embroidery digitizing",
    "embroidery digitizing service",
    "DST",
    "PES",
    "vector artwork",
    "custom patches",
  ],
  openGraph: {
    title: "GenX Digitizing — Send Your Design. We Make It Stitch-Ready.",
    description:
      "Professional embroidery digitizing, vector artwork and custom patches with simple ordering and clear pricing.",
    type: "website",
  },
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = createAdminClient();
  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const grouped: Record<string, { size: string; price: string }[]> = {};
  for (const tier of tiers ?? []) {
    if (!grouped[tier.category]) grouped[tier.category] = [];
    grouped[tier.category].push({
      size: tier.size_desc,
      price: "$" + tier.price,
    });
  }

  const services = [
    {
      title: "Embroidery Digitizing",
      desc: "Production-ready digitizing for caps, shirts, jackets, left chest logos and detailed embroidery.",
      tiers: grouped.digitizing || [],
    },
    {
      title: "Vector Artwork",
      desc: "Clean, scalable artwork for print, apparel decoration, signage and production.",
      tiers: grouped.vector || [],
    },
    {
      title: "Custom Patches",
      desc: "Artwork and production-ready files for embroidered, woven, PVC and specialty patches.",
      tiers: grouped.sewout || [],
    },
  ];

  return (
    <>
      <FAQSchema faqs={FAQS} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <LandingV2 services={services} />
    </>
  );
}
