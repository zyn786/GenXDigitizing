// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Check, Crown, ArrowRight, Sparkles, Shield, Zap, Clock, Headphones, Loader2, XCircle, Calendar, CreditCard, FileText, BarChart3, TrendingUp, Download, MessageSquare, AlertTriangle } from "lucide-react";
import { PLAN_CONFIG, getPlanPrice } from "@/lib/plans";
import { CANCELLATION_REASONS, type CancellationReason } from "@/types";

interface PlanUI {
  id: string;
  name: string;
  emoji: string;
  price: number;
  designs: number;
  desc: string;
  features: string[];
  savings: string;
  popular?: boolean;
}

const PLANS: PlanUI[] = [
  {
    id: "starter", ...PLAN_CONFIG.starter, name: PLAN_CONFIG.starter.label,
    desc: "Perfect for small businesses.",
    savings: "Save 20%",
  },
  {
    id: "business", ...PLAN_CONFIG.business, name: PLAN_CONFIG.business.label, popular: true,
    desc: "Ideal for growing embroidery businesses.",
    savings: "Save More Every Month",
  },
  {
    id: "pro", ...PLAN_CONFIG.pro, name: PLAN_CONFIG.pro.label,
    desc: "For heavy production businesses.",
    savings: "Best Value",
  },
  {
    id: "pro_max", ...PLAN_CONFIG.pro_max, name: PLAN_CONFIG.pro_max.label,
    desc: "For large-scale production & agencies.",
    savings: "Maximum Output",
  },
];

export function SubscribePlans() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [invoices, setInvoices] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [buying, setBuying] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason | "">("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const preselectedPlan = searchParams.get("plan");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: client } = await supabase.from("clients").select("id, tier, company_name, credit_balance").eq("user_id", user.id).single();
      setProfile({ id: client?.id, email: user.email, company: client?.company_name, tier: client?.tier, credit_balance: client?.credit_balance ?? 0 });
      if (client?.id) {
        const { data: sub } = await supabase.from("client_subscriptions").select("*").eq("client_id", client.id).in("status", ["active", "pending", "cancellation_requested"]).maybeSingle();
        setCurrentSub(sub);
        // Subscription history (all past + current)
        const { data: history } = await supabase.from("client_subscriptions").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(20);
        setSubHistory(history || []);
        // Billing history
        const { data: invs } = await supabase.from("invoices").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(20);
        setInvoices(invs || []);
        // Orders this period
        if (sub) {
          const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("client_id", client.id).gte("created_at", sub.current_period_start);
          setOrderCount(count || 0);
        }
      }
      setLoaded(true);
    }
    load();
  }, []);

  // Real-time: listen for subscription status changes (admin approve/deny cancel, etc.)
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`client-sub-${profile.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "client_subscriptions", filter: `client_id=eq.${profile.id}` },
        (payload) => {
          setCurrentSub(prev => {
            if (prev && prev.id === payload.new.id) return { ...prev, ...payload.new };
            return prev;
          });
        }
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_subscriptions", filter: `client_id=eq.${profile.id}` },
        (payload) => {
          setCurrentSub(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  // Scroll to preselected plan on load
  useEffect(() => {
    if (preselectedPlan && loaded) {
      setTimeout(() => {
        const el = document.getElementById(`plan-card-${preselectedPlan}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [preselectedPlan, loaded]);

  async function requestPlan(planId) {
    if (!profile?.id) { toast.error("Profile not loaded"); return; }
    setBuying(planId);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, clientId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      // Show downgrade warning if switching to smaller plan
      if (data.downgradeWarning) {
        toast.warning(data.downgradeWarning, { duration: 8000 });
      }
      // Show pending state immediately
      if (data.subscription) setCurrentSub(data.subscription);
      router.refresh();
      // Redirect to payment link if available, otherwise show toast
      if (data.paymentLink) {
        toast.success("Redirecting to payment...");
        window.open(data.paymentLink, "_blank");
      } else {
        toast.success("Plan requested! Admin will send payment link within 1 hour.");
      }
    } catch { toast.error("Network error"); }
    finally { setBuying(null); }
  }

  async function cancelPlan(reason?: string, notes?: string) {
    if (!profile?.id) { toast.error("Profile not loaded"); return; }
    // Optimistic: update local state immediately
    setCurrentSub((prev: any) => prev ? { ...prev, status: "cancellation_requested", cancellation_reason: reason, cancellation_notes: notes } : null);
    setShowCancelModal(false);
    setCancelReason("");
    setCancelNotes("");
    toast.success("Cancellation requested. Our team will review and confirm.");

    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes }),
      });
      if (!res.ok) {
        // Revert on failure
        setCurrentSub((prev: any) => prev ? { ...prev, status: "active", cancellation_reason: null, cancellation_notes: null } : null);
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to cancel");
      }
    } catch {
      setCurrentSub((prev: any) => prev ? { ...prev, status: "active", cancellation_reason: null, cancellation_notes: null } : null);
      toast.error("Network error");
    }
  }

  async function withdrawRequest() {
    if (!currentSub?.id) { toast.error("No active request"); return; }
    // Optimistic: revert to active instantly
    setCurrentSub((prev: any) => prev ? { ...prev, status: "active", cancellation_reason: null, cancellation_notes: null } : null);
    toast.success("Request withdrawn. Plan is active.");

    try {
      const res = await fetch("/api/subscriptions/cancel-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subId: currentSub.id, action: "deny" }),
      });
      if (!res.ok) {
        // Revert on failure
        setCurrentSub((prev: any) => prev ? { ...prev, status: "cancellation_requested" } : null);
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to withdraw");
      }
    } catch {
      setCurrentSub((prev: any) => prev ? { ...prev, status: "cancellation_requested" } : null);
      toast.error("Network error");
    }
  }

  if (!loaded) return <div className="portal-content flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>;

  // Labels for display
  const reasonLabels: Record<string, string> = {
    too_expensive: "Too expensive",
    not_enough_designs: "Not enough designs",
    found_alternative: "Found an alternative",
    not_using_enough: "Not using it enough",
    poor_quality: "Quality concerns",
    other: "Other",
  };

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Crown size={28} className="mx-auto mb-2" style={{ color: "#F59E0B" }} />
          <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2" style={{ color: "var(--txt)" }}>
            {!currentSub ? "Choose Your Plan"
              : currentSub.status === "active" ? "Your Subscription"
              : currentSub.status === "pending" ? "Awaiting Approval"
              : currentSub.status === "cancellation_requested" ? "Cancellation Under Review"
              : "Choose Your Plan"}
          </h2>
          <p className="text-[13px] sm:text-sm" style={{ color: "var(--txt2)" }}>
            {!currentSub ? "Get fixed pricing, faster turnaround, and priority support"
              : currentSub.status === "active" ? "Manage your plan, credits, and billing"
              : currentSub.status === "pending" ? "Your plan is being reviewed by our team"
              : currentSub.status === "cancellation_requested" ? "Our team is reviewing your cancellation request"
              : "Get fixed pricing, faster turnaround, and priority support"}
          </p>
        </div>

        {/* ═══ Subscription Dashboard ═══ */}
        {currentSub && currentSub.status === "active" && (() => {
          const extraCredits = profile?.credit_balance || 0;
          const remaining = currentSub.designs_total - currentSub.designs_used + (currentSub.designs_rolled_over || 0) + extraCredits;
          const total = currentSub.designs_total + (currentSub.designs_rolled_over || 0) + extraCredits;
          const pct = total > 0 ? Math.round((currentSub.designs_used / total) * 100) : 0;
          const renewalDate = new Date(currentSub.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          return (
            <div className="mb-6 space-y-4">
              {/* Status Card */}
              <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))", borderColor: "rgba(245,158,11,0.25)" }}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Crown size={20} style={{ color: "#F59E0B" }} />
                    <div>
                      <h3 className="font-syne font-bold text-[16px] sm:text-[18px]" style={{ color: "var(--txt)" }}>
                        {currentSub.plan.toUpperCase()} Plan
                      </h3>
                      <p className="text-[11px]" style={{ color: "var(--txt3)" }}>
                        {getPlanPrice(currentSub.plan)}/month · {currentSub.designs_total} designs/mo
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.25)" }}>
                    ● Active
                  </span>
                </div>

                {/* Usage Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "var(--txt2)" }}>
                    <span><strong style={{ color: "var(--txt)" }}>{remaining}</strong> credits remaining</span>
                    <span>{currentSub.designs_used} of {total} used</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border2)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: pct > 80 ? "linear-gradient(90deg, #F97316, #DC2626)" : pct > 50 ? "linear-gradient(90deg, #F59E0B, #F97316)" : "linear-gradient(90deg, #2563EB, #7C3AED)",
                    }} />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-4">
                  {[
                    [Crown, "Plan Credits", `${remaining} left of ${total}`],
                    [Calendar, "Renews", renewalDate],
                    [BarChart3, "Orders", `${orderCount} this period`],
                    [TrendingUp, "Rollover", `${currentSub.designs_rolled_over || 0} credits`],
                    [CreditCard, "Extra Credits", `${profile?.credit_balance || 0} credits`],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="p-2.5 rounded-xl text-center relative group" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <Icon size={13} style={{ color: label === "Extra Credits" ? "#F59E0B" : label === "Plan Designs" ? "#7C3AED" : "#2563EB" }} className="mx-auto mb-1" />
                      <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--txt3)" }}>{label}</p>
                      <p className="text-[11px] font-bold" style={{ color: "var(--txt)" }}>{value}</p>
                      {label === "Extra Credits" && (
                        <p className="text-[8px] mt-0.5" style={{ color: "var(--txt3)" }}>
                          <a onClick={(e) => { e.preventDefault(); document.getElementById("extra-credits")?.scrollIntoView({ behavior: "smooth" }); }} style={{ color: "#F59E0B", cursor: "pointer", textDecoration: "underline" }}>Buy more ↓</a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setCancelReason(""); setCancelNotes(""); setShowCancelModal(true); }}
                    disabled={false}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold border cursor-pointer disabled:opacity-50 transition-all"
                    style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }}
                  >
                    <XCircle size={12} className="inline mr-1" />
                    Cancel Plan
                  </button>
                </div>
              </div>

              {/* Billing History */}
              {invoices.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <h4 className="font-syne font-bold text-[14px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
                    <FileText size={16} style={{ color: "#2563EB" }} /> Billing & Credits History
                  </h4>
                  <div className="space-y-1.5">
                    {invoices.slice(0, 5).map((inv: any) => {
                      const notes: string = inv.notes || "";
                      const isSubscription = notes.toLowerCase().includes("subscription");
                      const isExtraCredits = notes.toLowerCase().includes("extra credits");
                      const creditMatch = notes.match(/Extra credits:\s*(\d+)\s*design credits/i);
                      const typeLabel = isSubscription ? "Plan" : isExtraCredits ? "Credits" : "Order";
                      const typeIcon = isSubscription ? "📦" : isExtraCredits ? "⚡" : "🧾";
                      const typeColor = isSubscription ? "#7C3AED" : isExtraCredits ? "#F59E0B" : "#2563EB";
                      return (
                      <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs">{typeIcon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[12px] font-semibold" style={{ color: "var(--txt)" }}>
                                {inv.invoice_number || "INV-—"} · ${Number(inv.amount).toFixed(0)}
                              </p>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${typeColor}15`, color: typeColor }}>
                                {typeLabel}
                              </span>
                            </div>
                            <p className="text-[10px]" style={{ color: "var(--txt3)" }}>
                              {new Date(inv.created_at).toLocaleDateString()}
                              {isExtraCredits && creditMatch && (
                                <span style={{ color: "#F59E0B" }}> · +{creditMatch[1]} credits</span>
                              )}
                              {isSubscription && (
                                <span style={{ color: "#7C3AED" }}> · {notes.split("—")[0]?.replace("Subscription:", "").trim() || ""}</span>
                              )}
                              <span> · </span>
                              <span style={{ color: inv.status === "paid" ? "#16A34A" : inv.status === "pending" ? "#F59E0B" : "var(--txt3)" }}>{inv.status}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-[var(--elevated)] transition-all flex-shrink-0"
                          style={{ color: "#2563EB" }}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )})}
                  </div>
                  {invoices.length > 5 && (
                    <Link href="/client/invoices" className="block text-center mt-3 text-[11px] font-semibold" style={{ color: "#2563EB" }}>
                      View all {invoices.length} invoices →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {currentSub && currentSub.status === "pending" && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl border" style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.3)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <Clock size={20} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <h3 className="font-syne font-bold text-[14px] sm:text-[15px]" style={{ color: "var(--txt)" }}>
                  {currentSub.plan.toUpperCase()} Plan — Awaiting Approval
                </h3>
                <p className="text-[11px]" style={{ color: "var(--txt3)" }}>
                  {getPlanPrice(currentSub.plan)}/month · {currentSub.designs_total} designs/mo
                </p>
              </div>
            </div>
            {/* Progress steps — derive from actual invoice state */}
            {(() => {
              const subInv = invoices.find((inv: any) =>
                inv.client_id === profile?.id &&
                inv.notes?.toLowerCase().includes("subscription") &&
                (inv.status === "pending" || inv.status === "paid")
              );
              const linkSent = !!(subInv?.payoneer_checkout_url);
              const paymentConfirmed = subInv?.status === "paid";
              const currentStepIdx = linkSent && paymentConfirmed ? 3 : linkSent ? 2 : 1;
              const steps = [
                { icon: "✓", label: "Requested", done: true },
                { icon: linkSent ? "✓" : "●", label: "Payment Link", done: linkSent },
                { icon: paymentConfirmed ? "✓" : (linkSent ? "●" : "○"), label: "Payment", done: paymentConfirmed },
                { icon: "○", label: "Activated", done: false },
              ];
              const doneBg = "rgba(22,163,74,0.08)";
              const doneColor = "#16A34A";
              const activeBg = "rgba(37,99,235,0.08)";
              const activeColor = "#2563EB";
              return (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    {steps.map((step, i) => {
                      const isDone = step.done;
                      const isCurrent = i === currentStepIdx && !isDone;
                      const bg = isDone ? doneBg : isCurrent ? activeBg : "var(--elevated)";
                      const clr = isDone ? doneColor : isCurrent ? activeColor : "var(--txt3)";
                      return (
                        <div key={step.label} className="flex-1 flex items-center gap-1">
                          <div className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: bg, color: clr }}>
                            {step.icon} {step.label}
                          </div>
                          {i < steps.length - 1 && <span style={{ color: "var(--border2)" }}>→</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-center mb-2" style={{ color: "var(--txt3)" }}>
                    {!linkSent
                      ? "Our team reviews subscriptions within 1 business hour."
                      : !paymentConfirmed
                        ? "Payment link sent! Complete payment to activate your plan."
                        : "Payment confirmed! Your plan will be activated shortly."}
                  </p>
                  {linkSent && !paymentConfirmed && subInv?.payoneer_checkout_url && (
                    <div className="text-center">
                      <a
                        href={subInv.payoneer_checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-[12px] no-underline active:scale-[0.98] transition-all"
                        style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
                      >
                        <CreditCard size={14} /> Pay Now — {getPlanPrice(currentSub.plan)}
                      </a>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {currentSub && currentSub.status === "cancellation_requested" && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl border" style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.3)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <Clock size={20} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <h3 className="font-syne font-bold text-[14px] sm:text-[15px]" style={{ color: "var(--txt)" }}>
                  Cancellation Requested — Under Review
                </h3>
                <p className="text-[11px]" style={{ color: "var(--txt3)" }}>
                  {currentSub.plan.toUpperCase()} Plan · {getPlanPrice(currentSub.plan)}/month · {currentSub.designs_total} designs/mo
                </p>
              </div>
            </div>
            {currentSub.cancellation_reason && (
              <div className="mb-3 p-3 rounded-xl" style={{ background: "var(--elevated)", border: "1px solid var(--border2)" }}>
                <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--txt3)" }}>Your reason:</p>
                <p className="text-[12px]" style={{ color: "var(--txt)" }}>
                  {reasonLabels[currentSub.cancellation_reason] || currentSub.cancellation_reason}
                  {currentSub.cancellation_notes && (
                    <span className="italic ml-1" style={{ color: "var(--txt3)" }}>— "{currentSub.cancellation_notes}"</span>
                  )}
                </p>
              </div>
            )}
            <p className="text-[11px] mb-3" style={{ color: "var(--txt3)" }}>
              Our team will review your request. Your plan remains active until confirmed.
            </p>
            <button
              onClick={withdrawRequest}
              disabled={false}
              className="py-2.5 px-4 rounded-xl text-[12px] font-semibold border cursor-pointer disabled:opacity-50 transition-all"
              style={{ color: "var(--txt)", borderColor: "var(--border2)" }}
            >
                            Withdraw Request
            </button>
          </div>
        )}

        {/* Plan cards — collapsed if client already subscribed */}
        {currentSub ? (
          <div className="mb-6">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="w-full p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all hover:border-[#2563EB]/30"
              style={{ background: "var(--surface)", borderColor: "var(--border2)", color: "var(--txt)" }}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <ArrowRight size={14} style={{ transform: showPlans ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                {showPlans ? "Hide Plans" : "Upgrade / Change Plan"}
              </span>
              <span className="text-[11px]" style={{ color: "var(--txt3)" }}>4 plans available</span>
            </button>
          </div>
        ) : null}
        {(!currentSub || showPlans) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {PLANS.map(plan => {
            const isCurrent = currentSub?.plan === plan.id && currentSub?.status === "active";
            const isPending = currentSub?.plan === plan.id && currentSub?.status === "pending";
            const isCancelRequested = currentSub?.plan === plan.id && currentSub?.status === "cancellation_requested";
            const isDisabled = isCurrent || isPending || isCancelRequested;
            return (
              <div key={plan.id} id={`plan-card-${plan.id}`} className={`relative rounded-2xl border-2 p-5 sm:p-6 flex flex-col transition-all ${
                plan.popular ? "border-[#2563EB] bg-[#2563EB]/3 shadow-[0_4px_20px_rgba(37,99,235,0.1)]" : "border-[var(--border2)] bg-[var(--surface)]"
              } ${preselectedPlan === plan.id ? "ring-2 ring-[#F59E0B] ring-offset-2" : ""}`}>
                {plan.popular && !isCurrent && !isPending && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown size={10} /> Current Plan
                  </span>
                )}
                {isPending && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Pending Approval
                  </span>
                )}

                <div className="text-center mb-4">
                  <span className="text-2xl sm:text-3xl">{plan.emoji}</span>
                  <h3 className="font-syne font-bold text-[18px] sm:text-[20px] mt-2 mb-1" style={{ color: "var(--txt)" }}>{plan.name}</h3>
                  <p className="text-[12px]" style={{ color: "var(--txt2)" }}>{plan.designs} designs/month</p>
                </div>

                <div className="text-center mb-4">
                  <span className="font-syne font-bold text-[30px] sm:text-[36px]" style={{ color: "var(--txt)" }}>${plan.price}</span>
                  <span className="text-[13px]" style={{ color: "var(--txt3)" }}>/month</span>
                </div>

                <p className="text-[12px] text-center mb-4" style={{ color: "var(--txt2)" }}>{plan.desc}</p>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[11px] sm:text-[12px]" style={{ color: "var(--txt2)" }}>
                      <Check size={13} className="text-[#16A34A] flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="text-center mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                    💰 {plan.savings}
                  </span>
                </div>

                <button onClick={() => requestPlan(plan.id)} disabled={buying === plan.id || isDisabled}
                  className="w-full py-3 rounded-2xl text-white font-bold text-[13px] sm:text-[14px] border-none cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: isDisabled ? "var(--border2)" : "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  {isCurrent ? "Current Plan" : isPending ? "Awaiting Approval" : isCancelRequested ? "Under Review" : buying === plan.id ? "Requesting…" : <>Request Plan <ArrowRight size={14} /></>}
                </button>
              </div>
            );
          })}
        </div>
        )}

        {/* Buy Extra Credits — one-time add-on */}
        {currentSub && currentSub.status === "active" && (
          <div id="extra-credits" className="mb-6 p-4 sm:p-5 rounded-2xl border text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {/* Credit cost guide */}
            <div className="mb-4 p-3 rounded-xl text-left" style={{ background: "var(--elevated)", border: "1px solid var(--border2)" }}>
              <p className="text-[10px] font-bold mb-1.5" style={{ color: "var(--txt)" }}>📐 How Credits Work</p>
              <div className="space-y-1 text-[10px]" style={{ color: "var(--txt2)" }}>
                <p>• <strong>1 credit</strong> = 1 standard design (left chest, cap, simple logo)</p>
                <p>• <strong>2 credits</strong> = 1 complex design (jacket back, large print)</p>
                <p>• <strong>3 credits</strong> = 1 extra-complex design (high stitch count, detailed)</p>
              </div>
              {currentSub && (
                <p className="text-[9px] mt-1.5" style={{ color: "var(--txt3)" }}>
                  Your {currentSub.plan.toUpperCase()} plan: big designs cost {PLAN_CONFIG[currentSub.plan]?.creditCostBigDesign || "—"} credit(s) each
                </p>
              )}
            </div>
            <h3 className="font-syne font-bold text-[14px] sm:text-[15px] mb-1" style={{ color: "var(--txt)" }}>
              <Sparkles size={14} className="inline text-[#F59E0B] mr-1" /> Top Up Your Credits
            </h3>
            <p className="text-[11px] sm:text-[12px] mb-4" style={{ color: "var(--txt3)" }}>
              One-time packs — no subscription needed, credits never expire
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[600px] mx-auto">
              {[
                { count: 5, price: 25, icon: "⚡", label: "Starter Pack" },
                { count: 10, price: 45, icon: "🔥", label: "Value Pack", popular: true },
                { count: 25, price: 99, icon: "💎", label: "Pro Pack", bestValue: true },
              ].map(pkg => (
                <button
                  key={pkg.count}
                  onClick={async () => {
                    if (!profile?.id) return;
                    try {
                      const res = await fetch("/api/subscriptions/extra-credits", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ clientId: profile.id, credits: pkg.count, amount: pkg.price }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.paymentLink) {
                          toast.success("Redirecting to payment...");
                          window.open(data.paymentLink, "_blank");
                        } else {
                          toast.success(`${pkg.count} extra credits requested! Admin will send payment link.`);
                        }
                        router.refresh();
                      } else {
                        const d = await res.json();
                        toast.error(d.error || "Failed");
                      }
                    } catch { toast.error("Network error"); }
                  }}
                  className={`relative p-4 rounded-2xl border-2 text-center cursor-pointer transition-all active:scale-[0.98] ${
                    pkg.popular
                      ? "border-[#F59E0B] bg-[#F59E0B]/5 hover:shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
                      : pkg.bestValue
                        ? "border-[#7C3AED] bg-[#7C3AED]/5 hover:shadow-[0_4px_16px_rgba(124,58,237,0.2)]"
                        : "border-[var(--border2)] bg-[var(--elevated)] hover:border-[#2563EB]/30"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Most Popular</span>
                  )}
                  {pkg.bestValue && !pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Best Value</span>
                  )}
                  <span className="text-2xl mb-2 block">{pkg.icon}</span>
                  <p className="font-syne font-bold text-[20px] sm:text-[24px] mb-0.5" style={{ color: "var(--txt)" }}>+{pkg.count}</p>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--txt3)" }}>{pkg.label}</p>
                  <p className="text-[22px] font-bold mb-1" style={{ color: pkg.popular ? "#F59E0B" : pkg.bestValue ? "#7C3AED" : "#2563EB" }}>${pkg.price}</p>
                  <p className="text-[11px] font-medium" style={{ color: "var(--txt3)" }}>
                    ${(pkg.price / pkg.count).toFixed(2)}/credit
                    {pkg.count === 5 ? " · $5.00" : pkg.count === 10 ? " · save 10%" : " · save 21%"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subscription & Activity History */}
        {(subHistory.length > 0 || invoices.length > 0) && (
          <div className="mb-6 rounded-2xl p-4 sm:p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-syne font-bold text-[14px] sm:text-[16px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
              <Clock size={16} style={{ color: "#7C3AED" }} /> Subscription & Activity History
            </h3>
            <div className="space-y-1.5">
              {/* Subscription entries */}
              {subHistory.map((sub: any) => {
                const statusColors: Record<string, { bg: string; color: string; label: string }> = {
                  active: { bg: "rgba(22,163,74,0.1)", color: "#16A34A", label: "Active" },
                  pending: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", label: "Pending" },
                  paused: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", label: "Paused" },
                  cancelled: { bg: "rgba(220,38,38,0.08)", color: "#DC2626", label: "Cancelled" },
                  expired: { bg: "rgba(156,163,175,0.1)", color: "#9CA3AF", label: "Expired" },
                  cancellation_requested: { bg: "rgba(249,115,22,0.1)", color: "#F97316", label: "Under Review" },
                };
                const sc = statusColors[sub.status] || { bg: "var(--elevated)", color: "var(--txt3)", label: sub.status };
                const started = new Date(sub.current_period_start).toLocaleDateString();
                const ended = new Date(sub.current_period_end).toLocaleDateString();
                const reasonLabels: Record<string, string> = {
                  too_expensive: "Too expensive",
                  not_enough_designs: "Not enough designs",
                  found_alternative: "Found alternative",
                  not_using_enough: "Not using enough",
                  poor_quality: "Quality concerns",
                  plan_change: "Changed plan",
                  cancelled_by_admin: "By admin",
                  rejected_by_admin: "Rejected",
                  request_denied: "Request denied",
                  other: "Other",
                };
                return (
                  <div key={`sub-${sub.id}`} className="flex items-center justify-between p-2.5 rounded-lg" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>
                        {sub.plan}
                      </span>
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                      {sub.subscription_number && (
                        <span className="text-[10px] font-mono" style={{ color: "var(--txt3)" }}>{sub.subscription_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.cancellation_reason && (
                        <span className="text-[10px] italic hidden sm:inline" style={{ color: "var(--txt3)" }}>
                          {reasonLabels[sub.cancellation_reason] || sub.cancellation_reason}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                        {started} — {sub.status === "active" || sub.status === "cancellation_requested" ? "Present" : ended}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Extra credit purchases */}
              {invoices.filter((inv: any) => (inv.notes || "").toLowerCase().includes("extra credits")).slice(0, 5).map((inv: any) => {
                const creditMatch = (inv.notes || "").match(/Extra credits:\s*(\d+)\s*design credits/i);
                const creditCount = creditMatch ? creditMatch[1] : "?";
                return (
                  <div key={`credit-${inv.id}`} className="flex items-center justify-between p-2.5 rounded-lg" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                        +{creditCount}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(22,163,74,0.08)", color: inv.status === "paid" ? "#16A34A" : "#F59E0B" }}>
                        {inv.status === "paid" ? "Credited" : "Pending"}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: "var(--txt3)" }}>{inv.invoice_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold" style={{ color: "var(--txt)" }}>${Number(inv.amount).toFixed(0)}</span>
                      <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Why subscribe — only for non-subscribers */}
        {!currentSub && <div className="text-center mb-6">
          <h3 className="font-syne font-bold text-[18px] sm:text-[22px] mb-4" style={{ color: "var(--txt)" }}>Why Subscribe?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              [Zap, "Lower price per design"],
              [Clock, "Priority turnaround"],
              [Headphones, "Dedicated support"],
              [Shield, "Consistent quality"],
              [Sparkles, "Roll over 30 days"],
            ].map(([Icon, text]) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Icon size={18} style={{ color: "#2563EB" }} />
                <span className="text-[10px] sm:text-[11px] font-semibold text-center" style={{ color: "var(--txt2)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        }

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 " onClick={() => setShowCancelModal(false)} />
            {/* Modal */}
            <div className="relative w-full max-w-[420px] rounded-2xl p-5 sm:p-6 shadow-2xl animate-fade-in-up" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(220,38,38,0.1)" }}>
                  <AlertTriangle size={24} style={{ color: "#DC2626" }} />
                </div>
                <h3 className="font-syne font-bold text-[16px] sm:text-[18px]" style={{ color: "var(--txt)" }}>
                  Cancel {currentSub?.plan?.toUpperCase()} Plan?
                </h3>
                <p className="text-[12px] mt-1" style={{ color: "var(--txt3)" }}>
                  Your cancellation will be reviewed by our team before processing. Your plan remains active until confirmed.
                </p>
              </div>

              {/* Reason selector */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold mb-2" style={{ color: "var(--txt2)" }}>
                  <MessageSquare size={12} className="inline mr-1" />
                  Why are you cancelling?
                </label>
                <div className="space-y-1.5">
                  {CANCELLATION_REASONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border text-[12px] font-medium ${
                        cancelReason === value
                          ? "border-[#DC2626]/30 bg-[#DC2626]/5"
                          : "border-transparent hover:bg-[var(--elevated)]"
                      }`}
                      style={{ color: cancelReason === value ? "#DC2626" : "var(--txt2)" }}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={value}
                        checked={cancelReason === value}
                        onChange={e => setCancelReason(e.target.value as CancellationReason)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        cancelReason === value ? "border-[#DC2626]" : "border-[var(--border2)]"
                      }`}>
                        {cancelReason === value && <div className="w-2 h-2 rounded-full bg-[#DC2626]" />}
                      </div>
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional notes */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--txt2)" }}>
                  Additional feedback (optional)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={e => setCancelNotes(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl text-[12px] resize-none outline-none transition-all"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--border2)",
                    color: "var(--txt)",
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={false}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold border cursor-pointer disabled:opacity-50 transition-all"
                  style={{ borderColor: "var(--border2)", color: "var(--txt2)" }}
                >
                  Keep Plan
                </button>
                <button
                  onClick={() => cancelPlan(cancelReason || undefined, cancelNotes || undefined)}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border-none cursor-pointer transition-all text-white"
                  style={{ background: "#DC2626" }}
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
