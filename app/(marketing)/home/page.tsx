// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { FAQSchema, BreadcrumbSchema, VideoObjectSchema } from "@/components/shared/StructuredData";
import { LandingClient } from "./LandingClient";

async function getLiveStats() {
  // Fail soft. This runs during `next build` (and in CI, where the Supabase env
  // is a placeholder), so a throw here fails the whole build. Any error
  // degrades to "no live numbers" and the page falls back to published policy
  // claims — see TrustStatsSection.
  try {
    const admin = createAdminClient();
    const [
      { count: totalOrders },
      { count: activeOrders },
      { count: deliveredOrders },
      { count: reviewCount },
      { data: reviewStars },
    ] = await Promise.all([
      admin.from("orders").select("*", { count: "exact", head: true }),
      admin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .not("status", "in", "(delivered,cancelled,refunded)"),
      admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
      admin.from("reviews").select("*", { count: "exact", head: true }).eq("is_published", true),
      admin.from("reviews").select("stars").eq("is_published", true),
    ]);

    const rated = (reviewStars ?? []).filter((r: any) => typeof r.stars === "number");
    const avgRating = rated.length
      ? Math.round((rated.reduce((s: number, r: any) => s + r.stars, 0) / rated.length) * 10) / 10
      : null;

    return {
      totalOrders: totalOrders || 0,
      activeOrders: activeOrders || 0,
      deliveredOrders: deliveredOrders || 0,
      reviewCount: reviewCount || 0,
      avgRating,
    };
  } catch (e) {
    console.error("[home] live stats unavailable — falling back to policy claims:", e);
    return {
      totalOrders: 0,
      activeOrders: 0,
      deliveredOrders: 0,
      reviewCount: 0,
      avgRating: null,
    };
  }
}

// Live numbers must not be frozen at build time — refresh them every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Professional Embroidery Digitizing Services — genxdigitizing",
  description:
    "Professional embroidery digitizing services. Fast turnaround, machine-ready files, unlimited revisions. Get a free quote today.",
  keywords: [
    "embroidery digitizing service",
    "DST file",
    "PES file",
    "EMB file",
    "embroidery digitizing online",
    "cap logo digitizing",
    "left chest digitizing",
    "vector art conversion",
    "custom patches",
    "3D puff digitizing",
  ],
  openGraph: {
    title: "genxdigitizing — Production-Ready Embroidery Files",
    description:
      "Professional embroidery digitizing from $7. Free revisions. 3–24h delivery. Every major machine format.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

const SERVICE_META = {
  digitizing: {
    emoji: "🧵",
    title: "Embroidery Digitizing",
    desc: "Production-ready digitizing for caps, jackets, polos, left chest logos, small text, and high-detail commercial embroidery.",
    tags: ["Left Chest", "Cap / Hat", "3D Puff", "Jacket Back"],
    color: "#2563EB",
    grad: "linear-gradient(135deg, #2563EB, #1D4ED8)",
  },
  vector: {
    emoji: "✏️",
    title: "Vector Art Conversion",
    desc: "Clean, scalable logo rebuilds for apparel decoration, print workflows, signage, and brand asset systems.",
    tags: ["JPG to Vector", "Logo Redraw", "Print-Ready", "DTF / DTG"],
    color: "#F97316",
    grad: "linear-gradient(135deg, #F97316, #EA580C)",
  },
  sewout: {
    emoji: "🏷️",
    title: "Patch Design",
    desc: "Structured patch planning for embroidered, woven, PVC, leather, and specialty patch production. Bulk discounts from 20%.",
    // "500+ patches" was invented and "Bulk 50% Off" overstated the coupons
    // table, which carries BULK20 (5+ designs) and BULK30 (10+ designs).
    tags: ["Embroidered", "Chenille", "PVC / Woven", "Leather", "Bulk Discounts"],
    color: "#16A34A",
    grad: "linear-gradient(135deg, #16A34A, #15803D)",
  },
};

const PROCESS = [
  {
    n: "01",
    title: "Upload Design",
    desc: "Send your logo or artwork with size and placement details.",
    icon: "📤",
  },
  {
    n: "02",
    title: "Proof Ready",
    desc: "We digitize your design and send a proof for approval.",
    icon: "✅",
  },
  {
    n: "03",
    title: "Approve Changes",
    desc: "Request edits or approve the final embroidery proof.",
    icon: "🔄",
  },
  {
    n: "04",
    title: "Download Files",
    desc: "Receive DST, PES, EMB and production-ready files.",
    icon: "📥",
  },
];

// REMOVED: a six-entry TESTIMONIALS array that was invented wholesale — named
// people, companies, countries and star ratings for customers who never existed.
// The reviews table has always held zero rows and the orders table zero orders.
// Publishing fabricated testimonials is deceptive advertising (FTC Act §5 and
// equivalents) and, when it reaches schema.org markup, a Google structured-data
// violation that risks a manual action.
//
// Do not reintroduce this array. Render REAL reviews from the `reviews` table
// once they exist — it already has `stars`, `text` and `client_id`, and the
// column `is_published` exists to gate what shows. Until then, show portfolio
// work instead: 23 real images beat six testimonials nobody can verify.

const FAQS = [
  {
    q: "What file formats do you deliver?",
    a: "DST, PES, EMB, JEF, XXX, VIP, HUS, EXP — we cover every major machine format. Extra formats are always free.",
  },
  {
    q: "How long does digitizing take?",
    a: "Standard: 24 hours. Rush: 6 hours. Urgent: 3 hours. All timing options are free.",
  },
  {
    q: "Are revisions really free?",
    a: "Yes — unlimited revisions, no questions asked. We work until the file runs right on your machine.",
  },
  {
    q: "What artwork quality do you need?",
    a: "We accept anything — blurry JPGs, hand sketches, low-res PNGs. Our team will trace and redraw as needed.",
  },
  {
    q: "Do you offer rush delivery?",
    a: "Yes, and it's completely free. Rush is 6 hours, Urgent is 3 hours. No upcharge — it's included.",
  },
  {
    q: "Can you digitize cap/hat designs?",
    a: "Yes — caps are a specialty. We handle structural underlay, topping guidance, and stitch angles correctly.",
  },
  {
    q: "Do you handle puff/3D embroidery?",
    a: "Yes. Just note it in your order. We set the correct stitch type, density, and underlay for foam-backed 3D puff.",
  },
  {
    q: "How does payment work?",
    a: "Secure payment via Payoneer. Review your proof first — pay when satisfied with the digitized file.",
  },
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
      <VideoObjectSchema
        name="GenXdigitizing — Professional Embroidery Digitizing"
        description="See our embroidery digitizing process in action. Clean stitch paths, professional results for caps, jackets, and more."
        contentUrl="https://res.cloudinary.com/djoixgojj/video/upload/vc_h264,q_auto:good,w_1200/v1781040748/hero-bg-desktop_ogydtd.mp4"
        thumbnailUrl="https://res.cloudinary.com/djoixgojj/video/upload/q_auto:low,so_0,w_1200/v1781040748/hero-bg-desktop_ogydtd.jpg"
        uploadDate="2025-06-01T00:00:00+00:00"
      />
      <LandingClient
        liveStats={await getLiveStats()}
        services={services}
        process={PROCESS}
        faqs={FAQS}
      />
    </>
  );
}
