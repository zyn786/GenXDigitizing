"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Clock, Headphones, ArrowRight, ChevronDown, ChevronUp, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAN_CONFIG } from "@/lib/plans";
import { SITE_INFO } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/client";

/* ── Plan data (derived from lib/plans.ts — single source of truth) ── */
const PLAN_META: Record<string, { desc: string; popular: boolean; cta: string }> = {
  starter:  { desc: "Perfect for small businesses.", popular: false, cta: "Subscribe Now" },
  business: { desc: "Ideal for growing embroidery businesses.", popular: true, cta: "Get Business Plan" },
  pro:      { desc: "For heavy production businesses.", popular: false, cta: "Start Pro Plan" },
  pro_max:  { desc: "For large-scale production & agencies.", popular: false, cta: "Go Pro Max" },
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
      .in("key", ["plan_starter_price","plan_business_price","plan_pro_price","plan_pro_max_price"])
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
      <section className="relative text-center pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-20 md:pb-14 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Pill badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 mb-4 sm:mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
            Subscription Plans
          </span>
          <h1 className="font-syne font-bold text-[28px] sm:text-[36px] lg:text-[44px] mb-3 sm:mb-4 tracking-tight max-w-[720px] mx-auto leading-tight">
            Professional Digitizing, Fixed Monthly Price
          </h1>
          <p className="text-[14px] sm:text-base text-[var(--txt2)] max-w-[560px] mx-auto mb-6 sm:mb-8">
            Get professional embroidery digitizing every month with fixed pricing, faster turnaround, and priority support. Perfect for businesses with recurring embroidery needs.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="#plans">
              <Button variant="grad" size="lg" rightIcon={<ArrowRight size={16} />}>Choose Your Plan</Button>
            </a>
            {!authChecked ? (
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border2)] text-[var(--txt3)] text-[14px]">
                <Loader2 size={14} className="animate-spin" />
              </span>
            ) : isLoggedIn ? (
              <Link
                href="/client/subscribe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border2)] text-[var(--txt2)] font-semibold text-[14px] no-underline hover:bg-[var(--surface)] transition-all"
              >
                My Dashboard
              </Link>
            ) : (
              <a
                href={`https://wa.me/${SITE_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border2)] text-[var(--txt2)] font-semibold text-[14px] no-underline hover:bg-[var(--surface)] transition-all"
              >
                Contact Sales
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* ═══ WHY SUBSCRIBE ═══════════════════════ */}
      <section className="px-4 pb-6 sm:pb-8">
        <div className="max-w-[720px] mx-auto rounded-2xl bg-gradient-to-r from-[#7C3AED]/10 via-[#2563EB]/10 to-[#F97316]/10 border border-[#7C3AED]/20 p-5 sm:p-6 text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold text-[#7C3AED] uppercase tracking-wider mb-2">Why Businesses Choose Our Plans</p>
          <p className="font-syne font-bold text-[20px] sm:text-[24px] text-[var(--txt)] mb-3">Fixed Pricing. Faster Delivery. Less Cost.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-[600px] mx-auto">
            {[
              ["💰", "Save vs pay-per-order"],
              ["⚡", "Priority turnaround"],
              ["🔄", "Credits roll over 30 days"],
              ["🎧", "Dedicated support manager"],
            ].map(([emoji, text]) => (
              <div key={text} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/60 border border-[var(--border)]">
                <span className="text-lg sm:text-xl">{emoji}</span>
                <span className="text-[11px] sm:text-[12px] font-semibold text-[var(--txt)]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLAN CARDS ═════════════════════════ */}
      <section id="plans" className="px-4 pb-8 sm:pb-12">
        <h2 className="font-syne font-bold text-[22px] sm:text-[28px] text-center mb-2">Choose Your Plan</h2>
        <p className="text-[13px] text-[var(--txt3)] text-center mb-6 sm:mb-8">All plans include free format conversions, free minor edits, and rollover credits</p>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {buildPlans().map((plan, i) => {
            const perDesign = (plan.price / (parseInt(String(plan.designs)) || 1)).toFixed(2);
            return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl border-2 p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.popular
                  ? "border-[#2563EB] bg-gradient-to-b from-[#2563EB]/5 to-[#7C3AED]/3 shadow-[0_8px_32px_rgba(37,99,235,0.15)]"
                  : "border-[var(--border2)] bg-[var(--surface)] hover:border-[#2563EB]/30"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Star size={11} fill="white" /> Most Popular
                </span>
              )}

              {/* Plan header */}
              <div className="text-center mb-4">
                <span className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-3xl sm:text-4xl mb-3"
                  style={{ background: plan.popular ? "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))" : "var(--elevated)" }}>
                  {plan.emoji}
                </span>
                <h3 className="font-syne font-bold text-[16px] sm:text-[18px] mb-0.5">{plan.name}</h3>
                <p className="text-[11px] sm:text-[12px] text-[var(--txt3)]">{plan.designs}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-syne font-bold text-[34px] sm:text-[40px] leading-none" style={{ color: plan.popular ? "#2563EB" : "var(--txt)" }}>${plan.price}</span>
                  <span className="text-[13px] text-[var(--txt3)]">/mo</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[var(--txt3)] mt-1">${perDesign}/design</p>
              </div>

              <p className="text-[11px] sm:text-[12px] text-[var(--txt2)] text-center mb-4">{plan.desc}</p>

              {/* Features */}
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[11px] sm:text-[12px] text-[var(--txt2)]">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(22,163,74,0.15)" }}>
                      <Check size={10} className="text-[#16A34A]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Savings badge */}
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1.5 rounded-full text-[11px] font-bold"
                  style={{ background: plan.popular ? "rgba(37,99,235,0.1)" : "rgba(22,163,74,0.08)", color: plan.popular ? "#2563EB" : "#16A34A" }}>
                  {plan.savings === "Best Value" ? "🏆 " : plan.savings === "Maximum Output" ? "🚀 " : "💰 "}
                  {plan.savings === "Best Value" ? "Best Value" : plan.savings === "Maximum Output" ? "Maximum Output" : `Save ${plan.savings}`}
                </span>
              </div>

              {/* CTA */}
              {!authChecked ? (
                <span className="block w-full text-center py-3 rounded-2xl bg-[var(--border2)] text-[var(--txt3)] font-bold text-[13px]">
                  <Loader2 size={14} className="animate-spin inline mr-1" /> Loading…
                </span>
              ) : (
                <Link
                  href={getPlanHref(plan.id)}
                  className={`block w-full text-center py-3 sm:py-3.5 rounded-2xl text-white font-bold text-[13px] sm:text-[14px] no-underline active:scale-[0.98] transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_28px_rgba(37,99,235,0.45)]"
                      : "bg-gradient-to-r from-[#374151] to-[#1F2937] hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]"
                  }`}
                >
                  {isLoggedIn ? `Get ${plan.name}` : plan.cta}
                </Link>
              )}
            </motion.div>
          )})}
        </div>
      </section>

      {/* ═══ WHY SUBSCRIBE ══════════════════════ */}
      <section className="px-4 pb-8 sm:pb-12">
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="font-syne font-bold text-[24px] sm:text-[28px] mb-2">Why Subscribe?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6">
            {([
              [Zap, "Lower price per design"],
              [Clock, "Priority turnaround"],
              [Headphones, "Dedicated support"],
              [Shield, "Consistent quality"],
              [Sparkles, "Unused roll over 30 days"],
            ] as const).map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <Icon size={20} className="text-[#2563EB]" />
                <span className="text-[11px] sm:text-[12px] font-semibold text-[var(--txt2)] text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ENTERPRISE ═════════════════════════ */}
      <section className="px-4 pb-8 sm:pb-12">
        <div className="max-w-[720px] mx-auto rounded-2xl bg-gradient-to-r from-[#050816] to-[#1a1a2e] p-6 sm:p-8 text-center">
          <span className="text-3xl sm:text-4xl mb-3 block">💼</span>
          <h2 className="font-syne font-bold text-[22px] sm:text-[26px] text-white mb-2">Enterprise Plan</h2>
          <p className="text-[13px] sm:text-sm text-gray-400 mb-5 max-w-[480px] mx-auto">
            Need 100+ designs per month? Get a custom quote with exclusive pricing, dedicated project management, and flexible turnaround times tailored to your production volume.
          </p>
          <a
            href={`https://wa.me/${SITE_INFO.whatsapp}?text=Hi! I'd like a custom Enterprise plan quote for 100+ designs/month`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#050816] font-bold text-[14px] no-underline active:scale-[0.98] transition-all hover:bg-gray-100"
          >
            Contact Sales <ArrowRight size={15} />
          </a>
          <span className="block text-[11px] text-[var(--txt3)] mt-2">
            For plans up to 75 designs/month,{" "}
            <Link href={isLoggedIn ? "/client/subscribe" : `/register?redirect=${encodeURIComponent("/client/subscribe")}`} className="text-[#2563EB] underline font-semibold">
              subscribe online
            </Link>
          </span>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════ */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="max-w-[640px] mx-auto">
          <h2 className="font-syne font-bold text-[22px] sm:text-[26px] text-center mb-6 sm:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 transition-all hover:border-[var(--border3)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[var(--txt)]">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-[var(--txt3)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--txt3)] flex-shrink-0" />}
                </div>
                {openFaq === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[12px] sm:text-[13px] text-[var(--txt2)] mt-3 pt-3 border-t border-[var(--border)]"
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
        <div className="max-w-[560px] mx-auto text-center">
          <p className="font-syne font-bold text-[20px] sm:text-[24px] mb-2">Ready to save on digitizing?</p>
          <p className="text-[13px] sm:text-sm text-[var(--txt2)] mb-5">Join hundreds of embroidery shops already saving with monthly plans.</p>
          <a href="#plans">
            <Button variant="grad" size="lg" rightIcon={<ArrowRight size={16} />}>View Plans</Button>
          </a>
        </div>
      </section>
    </div>
  );
}
