import type { Metadata } from "next";
import { QuoteOrderBuilder } from "@/components/quote-order/quote-order-builder";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Start Order"),
};

export default function OrderPage() {
  return <QuoteOrderBuilder mode="order" flowContext="guest" />;
}
