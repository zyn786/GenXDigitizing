import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { QuoteOrderOverlay } from "@/components/client/quote-order-overlay";

export const metadata: Metadata = { title: buildTitle("New Order") };

export default async function ClientNewOrderPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/client/orders/new");
  }

  return (
    <QuoteOrderOverlay
      mode="order"
      flowContext="client"
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
    />
  );
}
