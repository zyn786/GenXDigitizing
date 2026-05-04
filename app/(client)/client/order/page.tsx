import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { QuoteOrderOverlay } from "@/components/client/quote-order-overlay";

export const metadata: Metadata = { title: buildTitle("Place Order") };

export default async function ClientOrderPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/order");

  // Determine if this is the client's first order
  let isFirstOrder = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = await (prisma as any).clientProfile?.findUnique({
      where: { userId: session.user.id },
      select: { totalOrderCount: true, freeDesignUsed: true },
    });
    isFirstOrder = (profile?.totalOrderCount ?? 0) === 0;
  } catch {
    // Non-fatal — assume first order optimistically
    isFirstOrder = true;
  }

  return (
    <QuoteOrderOverlay
      mode="order"
      flowContext="client"
      user={{ name: session.user.name, email: session.user.email }}
      isFirstOrder={isFirstOrder}
    />
  );
}
