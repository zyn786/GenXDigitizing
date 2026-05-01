import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { QuoteOrderOverlay } from "@/components/client/quote-order-overlay";

export const metadata: Metadata = { title: buildTitle("Place Order") };

export default async function ClientOrderPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/order");

  return <QuoteOrderOverlay mode="order" />;
}
