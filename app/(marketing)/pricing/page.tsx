// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { PricingContent } from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing — Embroidery Digitizing from $7 — genxdigitizing",
  description: "Simple, transparent pricing. Embroidery digitizing from $7, vector redraw from $8, patch design from $5. Free revisions, free format conversions, free rush delivery.",
};

export default async function PricingPage() {
  const supabase = createAdminClient();
  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Pricing", url: "/pricing" }]} />
      <PricingContent tiers={tiers || []} />
    </>
  );
}
