import type { Metadata } from "next";
import { buildTitle } from "@/lib/site";
import { OrderStatusLookup } from "./order-status-lookup";

export const metadata: Metadata = {
  title: buildTitle("Track Your Order"),
  description: "Check the current status of your GenX Digitizing order.",
};

type Props = {
  searchParams: Promise<{ number?: string; email?: string }>;
};

export default async function OrderStatusPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <section className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300">
            Order tracking
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Track your order
          </h1>
          <p className="mt-3 text-sm text-white/50">
            Enter your order number and email address to see live status updates.
          </p>
        </div>

        <OrderStatusLookup
          initialNumber={params.number ?? ""}
          initialEmail={params.email ?? ""}
        />

        <p className="mt-8 text-center text-xs text-white/25">
          Need help?{" "}
          <a href="/contact" className="text-white/45 underline underline-offset-2 hover:text-white/70 transition">
            Contact support
          </a>
        </p>
      </div>
    </section>
  );
}
