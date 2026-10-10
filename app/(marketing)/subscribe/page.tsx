import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { createAdminClient } from "@/lib/supabase/server";
import { SubscribeContent } from "./SubscribeContent";

// Live subscriber count must not be frozen at build time.
export const revalidate = 300;

async function getActiveSubscriberCount() {
  // Fail soft: this also runs during `next build`, where the Supabase env can
  // be a placeholder. Any error degrades to 0 and the page falls back to a
  // policy line instead of a count.
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("client_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    return count || 0;
  } catch (e) {
    console.error("[subscribe] subscriber count unavailable:", e);
    return 0;
  }
}

export const metadata: Metadata = {
  alternates: { canonical: "/subscribe" },
  title: "Professional Digitizing, Fixed Monthly Price — genxdigitizing",
  description:
    "Professional embroidery digitizing subscriptions from $50/month. Fixed pricing, faster turnaround, priority support. Starter, Business & Pro plans for embroidery shops and apparel brands.",
};

export default async function SubscribePage() {
  const activeSubscribers = await getActiveSubscriberCount();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Subscribe", url: "/subscribe" },
        ]}
      />
      <SubscribeContent activeSubscribers={activeSubscribers} />
    </>
  );
}
