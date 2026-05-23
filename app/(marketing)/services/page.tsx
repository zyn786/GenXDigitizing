// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { ServicesContent } from "./ServicesContent";

export const metadata: Metadata = {
  title: "Services — Embroidery Digitizing, Vector Art & Custom Patches",
  description: "Production-ready embroidery digitizing for caps, jackets, and more. Vector art conversion and custom patch design. Proof-first workflow, free revisions, 12hr turnaround.",
};

export default async function ServicesPage() {
  const supabase = createAdminClient();
  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return <ServicesContent tiers={tiers || []} />;
}
