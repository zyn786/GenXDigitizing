import type { Metadata } from "next";
import { QuoteOrderBuilder } from "@/components/quote-order/quote-order-builder";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Request Quote"),
};

export default function QuotePage() {
  return <QuoteOrderBuilder mode="quote" />;
}
