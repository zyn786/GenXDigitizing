// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_INFO, SITE_OG_IMAGE } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About genxdigitizing — Our Story, Mission & Team",
  description: `Professional embroidery digitizing team delivering production-ready files since ${SITE_INFO.founded}. Manual digitizing, unlimited free revisions, 3–24h turnaround. Meet the team behind your embroidery.`,
  keywords: [
    "about genx digitizing",
    "embroidery digitizing company",
    "professional digitizing team",
    "manual embroidery digitizing",
    "digitizing services about us",
  ],
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: "About genxdigitizing — Professional Embroidery Digitizing Team",
    description:
      "Meet the digitizers behind our production-ready embroidery files. Manual digitizing, free revisions, global delivery.",
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
