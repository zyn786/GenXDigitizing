import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuoteOrderBuilder } from "@/components/quote-order/quote-order-builder";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Start Order"),
};

export default async function OrderPage() {
  const session = await auth();

  // Logged-in users go to the client portal order flow
  if (session?.user?.id) {
    redirect("/client/orders/new");
  }

  // Guest users see the public direct order wizard
  return <QuoteOrderBuilder mode="order" flowContext="guest" />;
}
