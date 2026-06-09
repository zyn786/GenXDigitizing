// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_STATS, SITE_INFO, fmtPlus } from "@/lib/site-config";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/shared/StructuredData";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About genxdigitizing — Our Story, Mission & Team",
  description: `Professional embroidery digitizing team delivering production-ready files since ${SITE_INFO.founded}. ${fmtPlus(SITE_STATS.ordersCompleted)} orders, ${SITE_STATS.satisfactionRate}% satisfaction. Meet the team behind your embroidery.`,
  keywords: [
    "about genx digitizing",
    "embroidery digitizing company",
    "professional digitizing team",
    "manual embroidery digitizing",
    "digitizing services about us",
  ],
  openGraph: {
    title: "About genxdigitizing — Professional Embroidery Digitizing Team",
    description: `Meet the digitzers behind ${fmtPlus(SITE_STATS.ordersCompleted)} production-ready embroidery files. Manual digitizing, free revisions, global delivery.`,
    type: "website",
  },
};

export default async function AboutPage() {
  const supabase = createAdminClient();
  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <OrganizationSchema />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ]}
      />
      <AboutContent tiers={tiers || []} />
    </>
  );
}
