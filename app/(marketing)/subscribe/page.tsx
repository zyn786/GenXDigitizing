import type { Metadata } from "next";
import { SubscribeContent } from "./SubscribeContent";

export const metadata: Metadata = {
  title: "Monthly Digitizing Plans — Save Up to 30% | genxdigitizing",
  description: "Professional embroidery digitizing subscriptions from $50/month. Fixed pricing, faster turnaround, priority support. Starter, Business & Pro plans for embroidery shops and apparel brands.",
};

export default function SubscribePage() {
  return <SubscribeContent />;
}
