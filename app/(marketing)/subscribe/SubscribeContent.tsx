"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Headphones,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAN_CONFIG } from "@/lib/plans";
import { SITE_INFO } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/client";

/* ── Plan data (derived from lib/plans.ts — single source of truth) ── */
const PLAN_META: Record<string, { desc: string; popular: boolean; cta: string }> = {
  starter: { desc: "Perfect for small businesses.", popular: false, cta: "Subscribe Now" },
  business: {
    desc: "Ideal for growing embroidery businesses.",
    popular: true,
    cta: "Get Business Plan",
  },
  pro: { desc: "For heavy production businesses.", popular: false, cta: "Start Pro Plan" },
  pro_max: { desc: "For large-scale production & agencies.", popular: false, cta: "Go Pro Max" },
};

function buildPlans() {
  return Object.entries(PLAN_CONFIG).map(([id, cfg]) => ({
    id,
    name: cfg.label,
    emoji: cfg.emoji,
    designs: `${cfg.designs} Basic Designs / Month`,
    price: cfg.price,
    desc: PLAN_META[id]?.desc ?? "",
    popular: PLAN_META[id]?.popular ?? false,
    features: cfg.features,
    savings: cfg.savings,
    cta: PLAN_META[id]?.cta ?? "Subscribe Now",
  }));
}

const FAQS = [
  {
    q: "Can I use unused designs next month?",
    a: "Yes! Unused credits can roll over for up to 30 days.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription before your next billing cycle.",
  },
  {
    q: "What is considered a Basic Design?",
    a: "Basic designs include standard logos and simple artwork with normal stitch counts. Complex designs may require additional credits.",
  },
  {
    q: "Can I upgrade my plan?",
    a: "Yes! You can upgrade or downgrade your subscription at any time.",
  },
];

/* ── Component ──────────────────────────────────── */
export function SubscribeContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    });
    // Load plan price overrides from platform_settings
    supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "plan_starter_price",
        "plan_business_price",
        "plan_pro_price",
        "plan_pro_max_price",
      ])
      .then(({ data: settings }) => {
        if (settings?.length) {
          for (const row of settings as any[]) {
            const plan = row.key.replace("plan_", "").replace("_price", "");
            const val = parseInt(row.value);
            if (plan && !isNaN(val) && val > 0 && PLAN_CONFIG[plan]) {
              PLAN_CONFIG[plan].price = val;
            }
          }
        }
      });
  }, []);

  function getPlanHref(planId: string): string {
    return isLoggedIn
      ? `/client/subscribe?plan=${planId}`
      : `/register?redirect=${encodeURIComponent(`/client/subscribe?plan=${planId}`)}`;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--txt)]">
      {/* ═══ HERO ══════════════════════════════ */}
      <section className="relative px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16 md:pb-14 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Pill badge */}
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#F97316] sm:mb-5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F97316]" />
            Subscription Plans
          </span>
          <h1 className="mx-auto mb-3 max-w-[720px] font-syne text-[28px] font-bold leading-tight tracking-tight sm:mb-4 sm:text-[36px] lg:text-[44px]">
            Professional Digitizing, Fixed Monthly Price
          </h1>
          <p className="mx-auto mb-6 max-w-[560px] text-[14px] text-[var(--txt2)] sm:mb-8 sm:text-base">
            Get professional embroidery digitizing every month with fixed pricing, faster
            turnaround, and priority support. Perfect for businesses with recurring embroidery
            needs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#plans">
              <Button variant="grad" size="lg" rightIcon={<ArrowRight size={16} />}>
                Choose Your Plan
              </Button>
            </a>
            {!authChecked ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border2)] px-6 py-3 text-[14px] text-[var(--txt3)]">
                <Loader2 size={14} className="animate-spin" />
              </span>
            ) : isLoggedIn ? (
              <Link
                href="/client/subscribe"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border2)] px-6 py-3 text-[14px] font-semibold text-[var(--txt2)] no-underline transition-all hover:bg-[var(--surface)]"
              >
                My Dashboard
              </Link>
            ) : (
              <a
                href={`https://wa.me/${SITE_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border2)] px-6 py-3 text-[14px] font-semibold text-[var(--txt2)] no-underline transition-all hover:bg-[var(--surface)]"
              >
                Contact Sales
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* ═══ WHY SUBSCRIBE ═══════════════════════ */}
      <section className="px-4 pb-6 sm:pb-8">
        <div className="mx-auto max-w-[720px] rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-r from-[#7C3AED]/10 via-[#2563EB]/10 to-[#F97316]/10 p-5 text-center sm:p-6">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#7C3AED] sm:text-[13px]">
            Why Businesses Choose Our Plans
          </p>
          <p className="mb-3 font-syne text-[20px] font-bold text-[var(--txt)] sm:text-[24px]">
            Fixed Pricing. Faster Delivery. Less Cost.
          </p>
          <div className="mx-auto grid max-w-[600px] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              ["💰", "Save vs pay-per-order"],
              ["⚡", "Priority turnaround"],
              ["🔄", "Credits roll over 30 days"],
              ["🎧", "Dedicated support manager"],
            ].map(([emoji, text]) => (
              <div
                key={text}
                className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-white/60 p-3"
              >
                <span className="text-lg sm:text-xl">{emoji}</span>
                <span className="text-[11px] font-semibold text-[var(--txt)] sm:text-[12px]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLAN CARDS ═════════════════════════ */}
      <section id="plans" className="px-4 pb-8 sm:pb-12">
        <h2 className="mb-2 text-center font-syne text-[22px] font-bold sm:text-[28px]">
          Choose Your Plan
        </h2>
        <p className="mb-6 text-center text-[13px] text-[var(--txt3)] sm:mb-8">
          All plans include free format conversions, free minor edits, and rollover credits
        </p>
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {buildPlans().map((plan, i) => {
            const perDesign = (plan.price / (parseInt(String(plan.designs)) || 1)).toFixed(2);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                  plan.popular
                    ? "to-[#7C3AED]/3 border-[#2563EB] bg-gradient-to-b from-[#2563EB]/5 shadow-[0_8px_32px_rgba(37,99,235,0.15)]"
                    : "border-[var(--border2)] bg-[var(--surface)] hover:border-[#2563EB]/30"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-4 py-1.5 text-[11px] font-bold text-white shadow-lg">
                    <Star size={11} fill="white" /> Most Popular
                  </span>
                )}

                {/* Plan header */}
                <div className="mb-4 text-center">
                  <span
                    className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-3xl sm:h-16 sm:w-16 sm:text-4xl"
                    style={{
                      background: plan.popular
                        ? "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))"
                        : "var(--elevated)",
                    }}
                  >
                    {plan.emoji}
                  </span>
                  <h3 className="mb-0.5 font-syne text-[16px] font-bold sm:text-[18px]">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] text-[var(--txt3)] sm:text-[12px]">{plan.designs}</p>
                </div>

                {/* Price */}
                <div className="mb-3 text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className="font-syne text-[34px] font-bold leading-none sm:text-[40px]"
                      style={{ color: plan.popular ? "#2563EB" : "var(--txt)" }}
                    >
                      ${plan.price}
                    </span>
                    <span className="text-[13px] text-[var(--txt3)]">/mo</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--txt3)] sm:text-[11px]">
                    ${perDesign}/design
                  </p>
                </div>

                <p className="mb-4 text-center text-[11px] text-[var(--txt2)] sm:text-[12px]">
                  {plan.desc}
                </p>

                {/* Features */}
                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[11px] text-[var(--txt2)] sm:text-[12px]"
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: "rgba(22,163,74,0.15)" }}
                      >
                        <Check size={10} className="text-[#16A34A]" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Savings badge */}
                <div className="mb-4 text-center">
                  <span
                    className="inline-block rounded-full px-3 py-1.5 text-[11px] font-bold"
                    style={{
                      background: plan.popular ? "rgba(37,99,235,0.1)" : "rgba(22,163,74,0.08)",
                      color: plan.popular ? "#2563EB" : "#16A34A",
                    }}
                  >
                    {plan.savings === "Best Value"
                      ? "🏆 "
                      : plan.savings === "Maximum Output"
                        ? "🚀 "
                        : "💰 "}
                    {plan.savings === "Best Value"
                      ? "Best Value"
                      : plan.savings === "Maximum Output"
                        ? "Maximum Output"
                        : `Save ${plan.savings}`}
                  </span>
                </div>

                {/* CTA */}
                {!authChecked ? (
                  <span className="block w-full rounded-2xl bg-[var(--border2)] py-3 text-center text-[13px] font-bold text-[var(--txt3)]">
                    <Loader2 size={14} className="mr-1 inline animate-spin" /> Loading…
                  </span>
                ) : (
                  <Link
                    href={getPlanHref(plan.id)}
                    className={`block w-full rounded-2xl py-3 text-center text-[13px] font-bold text-white no-underline transition-all active:scale-[0.98] sm:py-3.5 sm:text-[14px] ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_28px_rgba(37,99,235,0.45)]"
                        : "bg-gradient-to-r from-[#374151] to-[#1F2937] shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:from-[#2563EB] hover:to-[#1D4ED8] hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]"
                    }`}
                  >
                    {isLoggedIn ? `Get ${plan.name}` : plan.cta}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ WHY SUBSCRIBE ══════════════════════ */}
      <section className="px-4 pb-8 sm:pb-12">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="mb-2 font-syne text-[24px] font-bold sm:text-[28px]">Why Subscribe?</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {(
              [
                [Zap, "Lower price per design"],
                [Clock, "Priority turnaround"],
                [Headphones, "Dedicated support"],
                [Shield, "Consistent quality"],
                [Sparkles, "Unused roll over 30 days"],
              ] as const
            ).map(([Icon, label]) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <Icon size={20} className="text-[#2563EB]" />
                <span className="text-center text-[11px] font-semibold text-[var(--txt2)] sm:text-[12px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ENTERPRISE ═════════════════════════ */}
      <section className="px-4 pb-8 sm:pb-12">
        <div className="mx-auto max-w-[720px] rounded-2xl bg-gradient-to-r from-[#050816] to-[#1a1a2e] p-6 text-center sm:p-8">
          <span className="mb-3 block text-3xl sm:text-4xl">💼</span>
          <h2 className="mb-2 font-syne text-[22px] font-bold text-white sm:text-[26px]">
            Enterprise Plan
          </h2>
          <p className="mx-auto mb-5 max-w-[480px] text-[13px] text-gray-400 sm:text-sm">
            Need 100+ designs per month? Get a custom quote with exclusive pricing, dedicated
            project management, and flexible turnaround times tailored to your production volume.
          </p>
          <a
            href={`https://wa.me/${SITE_INFO.whatsapp}?text=Hi! I'd like a custom Enterprise plan quote for 100+ designs/month`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[#050816] no-underline transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            Contact Sales <ArrowRight size={15} />
          </a>
          <span className="mt-2 block text-[11px] text-[var(--txt3)]">
            For plans up to 75 designs/month,{" "}
            <Link
              href={
                isLoggedIn
                  ? "/client/subscribe"
                  : `/register?redirect=${encodeURIComponent("/client/subscribe")}`
              }
              className="font-semibold text-[#2563EB] underline"
            >
              subscribe online
            </Link>
          </span>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════ */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="mx-auto max-w-[640px]">
          <h2 className="mb-6 text-center font-syne text-[22px] font-bold sm:mb-8 sm:text-[26px]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:border-[var(--border3)] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-[var(--txt)] sm:text-[14px]">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp size={16} className="flex-shrink-0 text-[var(--txt3)]" />
                  ) : (
                    <ChevronDown size={16} className="flex-shrink-0 text-[var(--txt3)]" />
                  )}
                </div>
                {openFaq === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 border-t border-[var(--border)] pt-3 text-[12px] text-[var(--txt2)] sm:text-[13px]"
                  >
                    {faq.a}
                  </motion.p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ════════════════════════ */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="mb-2 font-syne text-[20px] font-bold sm:text-[24px]">
            Ready to save on digitizing?
          </p>
          <p className="mb-5 text-[13px] text-[var(--txt2)] sm:text-sm">
            Join hundreds of embroidery shops already saving with monthly plans.
          </p>
          <a href="#plans">
            <Button variant="grad" size="lg" rightIcon={<ArrowRight size={16} />}>
              View Plans
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
