// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
import { FAQSchema, BreadcrumbSchema } from "@/components/shared/StructuredData";
import { LandingClient } from "./LandingClient";

async function getLiveStats() {
  const admin = createAdminClient();
  const {count:totalOrders} = await admin.from("orders").select("*",{count:"exact",head:true});
  const {count:activeOrders} = await admin.from("orders").select("*",{count:"exact",head:true}).not("status","in","(delivered,cancelled,refunded)");
  const {count:deliveredOrders} = await admin.from("orders").select("*",{count:"exact",head:true}).eq("status","delivered");
  const {count:reviewCount} = await admin.from("reviews").select("*",{count:"exact",head:true}).eq("is_published",true);
  return {totalOrders:totalOrders||0,activeOrders:activeOrders||0,deliveredOrders:deliveredOrders||0,reviewCount:reviewCount||0};
}

export const metadata: Metadata = {
  title: "genxdigitizing — Premium Embroidery Digitizing from $7",
  description: `Production-ready embroidery digitizing, vector art, and custom patches. Clean proofs, fast turnaround, free revisions. Trusted by ${fmtPlus(SITE_STATS.ordersCompleted)} decorators worldwide.`,
  keywords: [
    "embroidery digitizing service","DST file","PES file","EMB file",
    "embroidery digitizing online","cap logo digitizing","left chest digitizing",
    "vector art conversion","custom patches","3D puff digitizing",
  ],
  openGraph: {
    title: "genxdigitizing — Production-Ready Embroidery Files",
    description: `Professional embroidery digitizing from $7. Free revisions. 12-hour delivery. ${fmtPlus(SITE_STATS.ordersCompleted)} orders completed.`,
    type: "website",
  },
};

const SERVICE_META = {
  digitizing: { emoji: "🧵", title: "Embroidery Digitizing",
    desc: "Production-ready digitizing for caps, jackets, polos, left chest logos, small text, and high-detail commercial embroidery.",
    tags: ["Left Chest", "Cap / Hat", "3D Puff", "Jacket Back"],
    color: "#2563EB", grad: "linear-gradient(135deg, #2563EB, #1D4ED8)" },
  vector: { emoji: "✏️", title: "Vector Art Conversion",
    desc: "Clean, scalable logo rebuilds for apparel decoration, print workflows, signage, and brand asset systems.",
    tags: ["JPG to Vector", "Logo Redraw", "Print-Ready", "DTF / DTG"],
    color: "#F97316", grad: "linear-gradient(135deg, #F97316, #EA580C)" },
  sewout: { emoji: "🏷️", title: "Patch Design",
    desc: "Structured patch planning for embroidered, woven, PVC, leather, and specialty patch production. 500+ patches — up to 50% off.",
    tags: ["Embroidered", "Chenille", "PVC / Woven", "Leather", "Bulk 50% Off"],
    color: "#16A34A", grad: "linear-gradient(135deg, #16A34A, #15803D)" },
};

const PROCESS = [
  { n: "01", title: "Upload Design", desc: "Send your logo or artwork with size and placement details.", icon: "📤" },
  { n: "02", title: "Proof Ready", desc: "We digitize your design and send a proof for approval.", icon: "✅" },
  { n: "03", title: "Approve Changes", desc: "Request edits or approve the final embroidery proof.", icon: "🔄" },
  { n: "04", title: "Download Files", desc: "Receive DST, PES, EMB and production-ready files.", icon: "📥" },
];

const TESTIMONIALS = [
  { name: "Marcus Rivera",   company: "ProStitch Apparel",    text: "Files run clean on first load. Tight stitch paths and correct density for my Brother machine. Will use genxdigitizing for all future orders.", stars: 5, country: "USA", date: "2025" },
  { name: "Sarah Kim",        company: "Branded Threads Co.",   text: "High-volume cap orders needed consistent 3D puff handling. genxdigitizing delivered proper underlay and height on every file with under 12-hour turnaround.", stars: 5, country: "UK", date: "2025" },
  { name: "David Chen",       company: "The Embroidery House",  text: "Proof approval step caught a color merge issue before production. Fast communication and friction-free revisions.", stars: 5, country: "Canada", date: "2025" },
  { name: "Linda Martinez",   company: "ThreadWorks Studio",    text: "Switched from my previous service. Better stitch quality. Underlay and density handled properly here.", stars: 5, country: "USA", date: "2025" },
  { name: "James Okafor",     company: "Victory Sportswear",    text: "Cap digitizing is tricky. genxdigitizing got it right first try. Structural underlay perfect for curved surfaces.", stars: 5, country: "Nigeria", date: "2024" },
  { name: "Priya Mehta",      company: "Monogram Collective",   text: "Fast, affordable, and the free format conversion saves me time. I get DST, PES, and JEF all in one order.", stars: 5, country: "India", date: "2025" },
];

const FAQS = [
  { q: "What file formats do you deliver?", a: "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — we cover every major machine format. Extra formats are always free." },
  { q: "How long does digitizing take?", a: "Standard: 12 hours. Rush: 6 hours. Urgent: 3 hours. Large designs (25k+ stitches) may take the full 12 hours. All timing options are free." },
  { q: "Are revisions really free?", a: "Yes — unlimited revisions, no questions asked. We work until the file runs right on your machine." },
  { q: "What artwork quality do you need?", a: "We accept anything — blurry JPGs, hand sketches, low-res PNGs. Our team will trace and redraw as needed." },
  { q: "Do you offer rush delivery?", a: "Yes, and it's completely free. Rush is 6 hours, Urgent is 3 hours. No upcharge — it's included." },
  { q: "Can you digitize cap/hat designs?", a: "Yes — caps are a specialty. We handle structural underlay, topping guidance, and stitch angles correctly." },
  { q: "Do you handle puff/3D embroidery?", a: "Yes. Just note it in your order. We set the correct stitch type, density, and underlay for foam-backed 3D puff." },
  { q: "How does payment work?", a: "Secure payment via Payoneer. Review your proof first — pay when satisfied with the digitized file." },
];

export default async function HomePage() {
  const supabase = createAdminClient();
  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const grouped: Record<string, { size: string; price: string }[]> = {};
  if (tiers) {
    for (const t of tiers) {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push({ size: t.size_desc, price: `$${t.price}` });
    }
  }

  const services = ["digitizing", "vector", "sewout"].map((cat) => {
    const meta = SERVICE_META[cat as keyof typeof SERVICE_META];
    return {
      ...meta,
      tiers: grouped[cat] || meta.tiers || [],
    };
  });

  return (
    <>
      <FAQSchema faqs={FAQS} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <LandingClient liveStats={await getLiveStats()} services={services} process={PROCESS} testimonials={TESTIMONIALS} faqs={FAQS} />
    </>
  );
}
