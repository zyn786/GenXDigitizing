import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { SubscribeContent } from "./SubscribeContent";

export const metadata: Metadata = {
  title: "Professional Digitizing, Fixed Monthly Price — genxdigitizing",
  description: "Professional embroidery digitizing subscriptions from $50/month. Fixed pricing, faster turnaround, priority support. Starter, Business & Pro plans for embroidery shops and apparel brands.",
};

export default function SubscribePage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Subscribe", url: "/subscribe" }]} />
      <SubscribeContent />
    </>
  );
}
