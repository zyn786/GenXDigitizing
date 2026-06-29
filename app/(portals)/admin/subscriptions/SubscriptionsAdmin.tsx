// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Check, X, Crown, ExternalLink, Loader2, Clock, Link2, Ban, Send, Rocket, Pause, Play, Plus } from "lucide-react";
import { getPlanPrice, PLAN_CONFIG } from "@/lib/plans";
import { logAuditEvent } from "@/lib/audit-log";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";

function PlanPricingGrid() {
  const supabase = createClient();
  const [prices, setPrices] = useState<Record<string,number>>(() => {
    const init: Record<string,number> = {};
    for (const [k, v] of Object.entries(PLAN_CONFIG)) init[k] = v.price;
    return init;
  });
  const [loaded, setLoaded] = useState(false);

  // Load saved prices from DB on mount
  useEffect(() => {
    async function load() {
      const keys = ["starter","business","pro","pro_max"].map(p => `plan_${p}_price`);
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", keys);
      if (data?.length) {
        setPrices(prev => {
          const next = { ...prev };
          for (const row of data as any[]) {
            const plan = (row.key as string).replace("plan_", "").replace("_price", "");
            const val = parseInt(row.value);
            if (plan && !isNaN(val) && val > 0) {
              next[plan] = val;
              // Also update the live PLAN_CONFIG so all components see the override
              if (PLAN_CONFIG[plan]) PLAN_CONFIG[plan].price = val;
            }
          }
          return next;
        });
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function updatePrice(plan: string, val: number) {
    setPrices(prev => ({ ...prev, [plan]: val }));
    PLAN_CONFIG[plan].price = val;
    await supabase
      .from("platform_settings")
      .upsert({ key: `plan_${plan}_price`, value: String(val) }, { onConflict: "key" });
    toast.success(`${PLAN_CONFIG[plan].label}: $${val}/mo`);
  }

  if (!loaded) return <div className="text-center py-4"><div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {(["starter","business","pro","pro_max"] as const).map(p => {
        const cfg = PLAN_CONFIG[p];
        return (
          <div key={p} className="p-2 rounded-lg border text-center" style={{ borderColor: "var(--border2)" }}>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "var(--txt)" }}>{cfg.label}</p>
            <input
              type="number"
              value={prices[p] ?? cfg.price}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setPrices(prev => ({ ...prev, [p]: v }));
              }}
              onBlur={async e => {
                const v = parseInt(e.target.value);
                if (v && v > 0) await updatePrice(p, v);
              }}
              className="w-16 text-center rounded border text-[11px] py-0.5 mx-auto block"
              style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt)" }}
            />
            <p className="text-[9px] mt-0.5" style={{ color: txt3 }}>{cfg.designs} designs</p>
          </div>
        );
      })}
    </div>
  );
}

function CreateSubForm({subs,invoices,onCreated}:{subs:any[];invoices:any[];onCreated:(sub:any)=>void}){
  const [clientEmail,setClientEmail]=useState("");
  const [plan,setPlan]=useState("business");
  const [busy,setBusy]=useState(false);
  async function create(){
    if(!clientEmail.trim()){toast.error("Enter client email");return;}
    setBusy(true);
    try{
      const res=await fetch("/api/admin/subscriptions/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:clientEmail.trim(),plan})});
      const d=await res.json();
      if(!res.ok){toast.error(d.error||"Failed");return;}
      onCreated(d.subscription);
      setClientEmail("");
    }catch{toast.error("Network error");}
    finally{setBusy(false);}
  }
  return(
    <div className="flex items-center gap-2 flex-wrap">
      <input value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="client@email.com" className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-[12px] border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:"var(--txt)",outline:"none"}}/>
      <select value={plan} onChange={e=>setPlan(e.target.value)} className="rounded-lg px-2 py-2 text-[12px] border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:"var(--txt)"}}>{["starter","business","pro","pro_max"].map(p=><option key={p} value={p}>{PLAN_CONFIG[p].label} ({PLAN_CONFIG[p].designs} designs/${PLAN_CONFIG[p].price}/mo)</option>)}</select>
      <button onClick={create} disabled={busy} className="px-4 py-2 rounded-lg text-[12px] font-bold text-white border-none cursor-pointer disabled:opacity-50" style={{background:"#16A34A"}}>{busy?"Creating…":"Create"}</button>
    </div>
  );
}

interface Props {
  subscriptions: any[];
  invoices: any[];
  universalPaymentLink: string;
}

export function SubscriptionsAdmin({ subscriptions: initialSubs, invoices: initialInvoices, universalPaymentLink: initialLink }: Props) {
  const supabase = createClient();
  const [subs, setSubs] = useState(initialSubs);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [universalLink, setUniversalLink] = useState(initialLink);
  const [linkInput, setLinkInput] = useState(initialLink);
  const [loading, setLoading] = useState<string | null>(null);

  // Real-time: listen for subscription changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-subs")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "client_subscriptions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSubs(prev => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSubs(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s));
          } else if (payload.eventType === "DELETE") {
            setSubs(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Find subscription invoice for a client (match by "Subscription:" in notes, most recent first)
  function getSubscriptionInvoice(clientId: string) {
    return invoices.find(inv =>
      inv.client_id === clientId &&
      inv.notes?.toLowerCase().includes("subscription")
    );
  }

  async function saveUniversalLink() {
    if (!linkInput.trim()) { toast.error("Enter a payment link"); return; }
    setLoading("universal-link");
    try {
      await supabase.from("platform_settings").upsert(
        { key: "subscription_payment_link", value: linkInput.trim() },
        { onConflict: "key" }
      );
      setUniversalLink(linkInput.trim());
      toast.success("Universal payment link saved! Applies to all subscriptions.");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(null); }
  }

  async function sendPaymentLink(subId: string, clientId: string, clientEmail: string) {
    if (!universalLink) { toast.error("Set a payment link first"); return; }
    setLoading(subId);
    try {
      const sub = subs.find(s => s.id === subId);
      // Update invoice with payment link
      const inv = getSubscriptionInvoice(clientId);
      if (inv) {
        await supabase.from("invoices").update({ payoneer_checkout_url: universalLink }).eq("id", inv.id);
        setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, payoneer_checkout_url: universalLink } : i));
      }
      // Notify client with payment link + web push
      const { data: clientUser } = await supabase.from("clients").select("user_id").eq("id", clientId).single();
      if (clientUser?.user_id) {
        const price = getPlanPrice(sub?.plan);
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: clientUser.user_id,
            type: "payment",
            title: "💳 Payment link ready — " + sub?.plan?.toUpperCase() + " Plan",
            body: `Your ${sub?.designs_total} designs/month plan (${price}/mo) is approved! Pay here to activate: ${universalLink}`,
            action_url: universalLink,
          }),
        }).catch(e => console.error("[sendPaymentLink] Notif error:", e));
      }
      // Send payment link email
      if (clientEmail && sub) {
        const planCfg = PLAN_CONFIG[sub.plan];
        const { emailPaymentLinkSent } = await import("@/lib/email/subscription");
        emailPaymentLinkSent(clientEmail, planCfg.label, planCfg.price, planCfg.designs, universalLink).catch(e => console.error("[sendPaymentLink] Email failed:", e));
      }
      // Audit log
      logAuditEvent({ action: "subscription_payment_link_sent", entity: "subscription", entityId: subId, newData: { payment_link: universalLink } });

      toast.success("Payment link sent to client!");
    } catch { toast.error("Failed to send payment link"); }
    finally { setLoading(null); }
  }

  async function approveSubscription(subId: string, clientId: string, clientEmail: string) {
    setLoading(subId);
    try {
      // Atomic approval via RPC — activates sub, marks invoice paid, upgrades tier in one transaction
      const { data: result, error: rpcErr } = await supabase.rpc("approve_subscription", {
        p_sub_id: subId,
        p_client_id: clientId,
        p_payment_link: universalLink || null,
      });

      if (rpcErr || !result?.success) {
        toast.error(result?.error || rpcErr?.message || "Approval failed");
        return;
      }

      const sub = subs.find(s => s.id === subId);

      // Notify client (outside of RPC since it's cross-table + needs user_id)
      const { data: clientUser } = await supabase.from("clients").select("user_id").eq("id", clientId).single();
      if (clientUser?.user_id) {
        const price = getPlanPrice(sub?.plan);
        const body = universalLink
          ? `Your ${sub?.plan?.toUpperCase()} plan is now active. ${sub?.designs_total} designs/month at ${price}/mo. Pay here: ${universalLink}`
          : `Your ${sub?.plan?.toUpperCase()} plan is now active. ${sub?.designs_total} designs/month at ${price}/mo. Start ordering!`;
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: clientUser.user_id,
            type: "system",
            title: "Subscription activated! 🎉",
            body,
            action_url: "/client/new-order",
          }),
        }).catch(e => console.error("[approve] Notif error:", e));
      }

      // Update local state
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "active" } : s));
      const inv = getSubscriptionInvoice(clientId);
      if (inv) {
        setInvoices(prev => prev.map(i => {
          if (i.id !== inv.id) return i;
          const updated: any = { ...i, status: "paid", paid_at: new Date().toISOString() };
          if (universalLink) updated.payoneer_checkout_url = universalLink;
          return updated;
        }));
      }

      // Send activation email + receipt
      if (clientEmail && sub) {
        const planCfg = PLAN_CONFIG[sub.plan];
        const { emailSubscriptionApproved, emailSubscriptionReceipt } = await import("@/lib/email/subscription");
        emailSubscriptionApproved(clientEmail, planCfg.label, planCfg.price, planCfg.designs, universalLink, planCfg.features).catch(e => console.error("[approve] Activation email failed:", e));
        emailSubscriptionReceipt(clientEmail, planCfg.label, inv?.invoice_number || "N/A", planCfg.price, planCfg.designs, planCfg.features).catch(e => console.error("[approve] Receipt email failed:", e));
      }

      // Generate invoice PDF
      if (inv?.id) {
        fetch(`/api/invoices/${inv.id}/pdf`).catch(e => console.error("[approve] PDF generation failed:", e));
      }

      // Audit log
      logAuditEvent({ action: "subscription_approved", entity: "subscription", entityId: subId, newData: { plan: sub?.plan, clientId } });

      toast.success("Subscription approved! Client notified by email.");
    } catch { toast.error("Failed to approve"); }
    finally { setLoading(null); }
  }

  async function pauseSubscription(subId: string) {
    setLoading(subId);
    try {
      await supabase.from("client_subscriptions").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", subId);
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "paused" } : s));
      logAuditEvent({ action: "subscription_paused", entity: "subscription", entityId: subId });

      toast.success("Subscription paused");
    } catch { toast.error("Failed to pause"); }
    finally { setLoading(null); }
  }

  async function resumeSubscription(subId: string) {
    setLoading(subId);
    try {
      await supabase.from("client_subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", subId);
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "active" } : s));
      logAuditEvent({ action: "subscription_resumed", entity: "subscription", entityId: subId });

      toast.success("Subscription resumed");
    } catch { toast.error("Failed to resume"); }
    finally { setLoading(null); }
  }

  async function cancelSubscription(subId: string, clientId: string, clientEmail: string) {
    setLoading(subId);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientEmail, reason: "cancelled_by_admin" }),
      });
      if (!res.ok) { toast.error("Failed to cancel"); return; }

      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "cancelled", cancellation_reason: "cancelled_by_admin" } : s));
      logAuditEvent({ action: "subscription_cancelled", entity: "subscription", entityId: subId, newData: { cancelled_by: "admin", clientId } });
      toast.success("Subscription cancelled. Client notified by email.");
    } catch { toast.error("Failed to cancel"); }
    finally { setLoading(null); }
  }

  async function rejectSubscription(subId: string, clientId: string, clientEmail: string) {
    setLoading(subId);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientEmail, reason: "rejected_by_admin" }),
      });
      if (!res.ok) { toast.error("Failed to reject"); return; }

      // Cancel associated pending invoice
      const inv = getSubscriptionInvoice(clientId);
      if (inv) {
        await supabase.from("invoices").update({ status: "cancelled" as any }).eq("id", inv.id);
      }

      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "cancelled", cancellation_reason: "rejected_by_admin" } : s));
      if (inv) setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "cancelled" } : i));
      logAuditEvent({ action: "subscription_rejected", entity: "subscription", entityId: subId, newData: { rejected_by: "admin", clientId } });

      toast.success("Subscription rejected. Client notified.");
    } catch { toast.error("Failed to reject"); }
    finally { setLoading(null); }
  }

  const pending = subs.filter(s => s.status === "pending");
  const cancelRequested = subs.filter(s => s.status === "cancellation_requested");
  const active = subs.filter(s => s.status === "active");
  const paused = subs.filter(s => s.status === "paused");
  const cancelled = subs.filter(s => s.status === "cancelled");

  async function approveCancellation(subId: string) {
    setLoading(subId);
    try {
      const res = await fetch("/api/subscriptions/cancel-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subId, action: "approve" }),
      });
      if (!res.ok) { toast.error("Failed to approve"); return; }
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "cancelled" } : s));
      logAuditEvent({ action: "cancellation_approved", entity: "subscription", entityId: subId });
      toast.success("Cancellation approved. Client notified by email.");
    } catch { toast.error("Failed to approve"); }
    finally { setLoading(null); }
  }

  async function denyCancellation(subId: string) {
    setLoading(subId);
    try {
      const res = await fetch("/api/subscriptions/cancel-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subId, action: "deny" }),
      });
      if (!res.ok) { toast.error("Failed to deny"); return; }
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: "active", cancellation_reason: "request_denied", cancellation_notes: null } : s));
      logAuditEvent({ action: "cancellation_denied", entity: "subscription", entityId: subId });
      toast.success("Cancellation denied. Client notified.");
    } catch { toast.error("Failed to deny"); }
    finally { setLoading(null); }
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      <div className="max-w-[900px] mx-auto">

        {/* Universal Payment Link */}
        <section className="mb-6 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "rgba(37,99,235,0.2)" }}>
          <h3 className="font-syne font-bold text-[14px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
            <Link2 size={16} style={{ color: "#2563EB" }} /> Universal Subscription Payment Link
          </h3>
          <p className="text-[11px] mb-3" style={{ color: "var(--txt3)" }}>
            Set once — applied to all subscription invoices. Clients see this link to pay.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://payoneer.com/your-payment-link"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              className="flex-1 text-[12px] px-3 py-2 rounded-lg border outline-none focus:border-[#2563EB]"
              style={{ background: "var(--surface)", borderColor: "var(--border2)", color: "var(--txt)" }}
            />
            <button onClick={saveUniversalLink} disabled={loading === "universal-link"}
              className="px-4 py-2 rounded-lg text-[12px] font-bold border-none cursor-pointer disabled:opacity-50 text-white"
              style={{ background: "#2563EB" }}>
              {loading === "universal-link" ? <Loader2 size={12} className="animate-spin" /> : "Save"}
            </button>
          </div>
          {universalLink && (
            <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: "#16A34A" }}>
              <Check size={12} /> Active link: <a href={universalLink} target="_blank" rel="noreferrer" className="underline" style={{ color: "#2563EB" }}>{universalLink}</a>
            </div>
          )}
        </section>

        {/* Plan Pricing — editable from admin */}
        <section className="mb-6 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "rgba(245,158,11,0.2)" }}>
          <h3 className="font-syne font-bold text-[14px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
            <Crown size={16} style={{ color: "#F59E0B" }} /> Plan Pricing
          </h3>
          <PlanPricingGrid />
          <p className="text-[10px]" style={{color:txt3}}>100+ designs/month? Clients request via <Link href="/contact" className="font-bold" style={{color:"#2563EB"}}>Contact</Link> — admin creates custom enterprise plan.</p>
        </section>

        {/* Admin Create Subscription */}
        <section className="mb-6 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "rgba(22,163,74,0.2)" }}>
          <h3 className="font-syne font-bold text-[14px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
            <Plus size={16} style={{ color: "#16A34A" }} /> Create Subscription for Client
          </h3>
          <CreateSubForm subs={subs} invoices={invoices} onCreated={(sub:any)=>{setSubs(p=>[sub,...p]);toast.success("Subscription created!");}} />
        </section>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h3 className="font-syne font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
              <Clock size={18} style={{ color: "#F97316" }} /> Pending Approval ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.map(sub => {
                const inv = getSubscriptionInvoice(sub.clients?.id || sub.client_id);
                return (
                  <div key={sub.id} className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "rgba(245,158,11,0.3)" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "#F97316", color: "#fff" }}>{sub.plan}</span>{sub.subscription_number && <span className="text-[9px] font-mono ml-1.5" style={{ color: "var(--txt3)" }}>{sub.subscription_number}</span>}
                          <span className="text-[13px] font-semibold" style={{ color: "var(--txt)" }}>{sub.clients?.user?.email || sub.clients?.email || sub.client_id}</span>
                        </div>
                        <p className="text-[12px]" style={{ color: "var(--txt2)" }}>
                          {sub.clients?.company_name && <>{sub.clients.company_name} · </>}
                          {sub.designs_total} designs/month · {getPlanPrice(sub.plan)}/mo
                        </p>
                        {!universalLink && (
                          <p className="text-[10px] mt-1" style={{ color: "#DC2626" }}>⚠ Set universal payment link above first</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {universalLink ? (
                          <button onClick={() => sendPaymentLink(sub.id, sub.clients?.id || sub.client_id, sub.clients?.user?.email || "")} disabled={loading === sub.id}
                            className="px-3 py-2 rounded-lg text-[11px] font-bold border-none cursor-pointer disabled:opacity-50 text-white flex items-center gap-1"
                            style={{ background: "#2563EB" }}>
                            {loading === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Send Payment Link
                          </button>
                        ) : (
                          <span className="text-[10px] px-2 py-1 rounded" style={{ color: "#DC2626", background: "rgba(220,38,38,0.06)" }}>⚠ Set payment link</span>
                        )}
                        <button onClick={() => approveSubscription(sub.id, sub.clients?.id || sub.client_id, sub.clients?.user?.email || "")} disabled={loading === sub.id}
                          className="px-3 py-2 rounded-lg text-[11px] font-bold border-none cursor-pointer disabled:opacity-50 text-white flex items-center gap-1"
                          style={{ background: "#16A34A" }}
                          title="Activate subscription (use after payment confirmed)">
                          {loading === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />} Activate
                        </button>
                        <button onClick={() => rejectSubscription(sub.id, sub.clients?.id || sub.client_id, sub.clients?.user?.email || "")} disabled={loading === sub.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }}>
                          {loading === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />} Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cancellation Requests */}
        {cancelRequested.length > 0 && (
          <section className="mb-6 p-4 rounded-xl border" style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.3)" }}>
            <h3 className="font-syne font-bold text-[14px] mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
              <Clock size={18} style={{ color: "#F59E0B" }} /> Cancellation Requests ({cancelRequested.length})
            </h3>
            <div className="space-y-2">
              {cancelRequested.map(sub => {
                const reasonLabels: Record<string, string> = {
                  too_expensive: "Too expensive",
                  not_enough_designs: "Not enough designs",
                  found_alternative: "Found alternative",
                  not_using_enough: "Not using enough",
                  poor_quality: "Quality concerns",
                  other: "Other",
                };
                return (
                  <div key={sub.id} className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "#F59E0B", color: "#fff" }}>{sub.plan}</span>
                          <span className="text-[12px] font-medium" style={{ color: "var(--txt)" }}>{sub.clients?.user?.email || sub.clients?.email || sub.client_id}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                            {sub.designs_total} designs/month · {getPlanPrice(sub.plan)}/mo
                          </span>
                          {sub.cancellation_reason && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                              {reasonLabels[sub.cancellation_reason] || sub.cancellation_reason}
                            </span>
                          )}
                        </div>
                        {sub.cancellation_notes && (
                          <p className="text-[10px] italic mt-1" style={{ color: "var(--txt3)" }}>"{sub.cancellation_notes}"</p>
                        )}
                        <p className="text-[9px] mt-1" style={{ color: "var(--txt3)" }}>
                          Requested {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => approveCancellation(sub.id)} disabled={loading === sub.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer disabled:opacity-50 text-white flex items-center gap-1"
                          style={{ background: "#16A34A" }}>
                          {loading === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Approve
                        </button>
                        <button onClick={() => denyCancellation(sub.id)} disabled={loading === sub.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }}>
                          <X size={11} /> Deny
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Active subscriptions */}
        <section className="mb-8">
          <h3 className="font-syne font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
            <Crown size={18} style={{ color: "#F59E0B" }} /> Active ({active.length})
          </h3>
          {active.length === 0 ? (
            <p className="text-[13px] text-center py-8" style={{ color: "var(--txt3)" }}>No active subscriptions yet</p>
          ) : (
            <div className="space-y-2">
              {active.map(sub => (
                <div key={sub.id} className="p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <Crown size={18} style={{ color: "#F59E0B" }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "#7C3AED", color: "#fff" }}>{sub.plan}</span>
                        <span className="text-[12px] font-semibold" style={{ color: "var(--txt)" }}>{sub.clients?.user?.email || sub.clients?.email || sub.client_id}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--txt3)" }}>
                        {sub.designs_used}/{sub.designs_total} used
                        {(sub.designs_rolled_over || 0) > 0 && <span style={{ color: "#16A34A" }}> · +{sub.designs_rolled_over} rollover</span>}
                        {" · "}Renews {new Date(sub.current_period_end).toLocaleDateString()}
                        {" · "}
                        {(() => {
                          const daysLeft = Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return <span style={{ color: daysLeft <= 7 ? "#DC2626" : daysLeft <= 14 ? "#F59E0B" : "var(--txt3)" }}>{daysLeft}d left</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => pauseSubscription(sub.id)} disabled={loading === sub.id}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      style={{ color: "#F59E0B", borderColor: "rgba(245,158,11,0.3)" }}>
                      <Pause size={10} /> Pause
                    </button>
                    <button onClick={() => cancelSubscription(sub.id, sub.clients?.id || sub.client_id, sub.clients?.user?.email || "")} disabled={loading === sub.id}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }}>
                      {loading === sub.id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Paused subscriptions */}
        {paused.length > 0 && (
          <section className="mb-8">
            <h3 className="font-syne font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--txt)" }}>
              <Pause size={16} style={{ color: "#F59E0B" }} /> Paused ({paused.length})
            </h3>
            <div className="space-y-2">
              {paused.map(sub => (
                <div key={sub.id} className="p-3 rounded-xl border flex items-center justify-between gap-2"
                  style={{ background: "var(--surface)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>{sub.plan}</span>
                    <span className="text-[11px]" style={{ color: "var(--txt)" }}>{sub.clients?.user?.email || sub.clients?.email || sub.client_id}</span>
                  </div>
                  <button onClick={() => resumeSubscription(sub.id)} disabled={loading === sub.id}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    style={{ color: "#16A34A", borderColor: "rgba(22,163,74,0.3)" }}>
                    <Play size={10} /> Resume
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cancelled/Rejected history */}
        {cancelled.length > 0 && (
          <section>
            <h3 className="font-syne font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--txt3)" }}>
              Cancelled / Rejected ({cancelled.length})
            </h3>
            <div className="space-y-2">
              {cancelled.slice(0, 20).map(sub => {
                const reasonLabels: Record<string, string> = {
                  too_expensive: "Too expensive",
                  not_enough_designs: "Not enough designs",
                  found_alternative: "Found alternative",
                  not_using_enough: "Not using enough",
                  poor_quality: "Quality concerns",
                  cancelled_by_admin: "By admin",
                  rejected_by_admin: "Rejected by admin",
                  plan_change: "Changed plan",
                  other: "Other",
                };
                const reasonLabel = sub.cancellation_reason ? (reasonLabels[sub.cancellation_reason] || sub.cancellation_reason) : null;
                return (
                  <div key={sub.id} className="p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.7 }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "var(--border2)", color: "var(--txt3)" }}>{sub.plan}</span>
                        <span className="text-[11px] font-medium" style={{ color: "var(--txt)" }}>{sub.clients?.user?.email || sub.clients?.email || sub.client_id}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                        {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {reasonLabel && (
                      <div className="flex items-start gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold" style={{ color: "var(--txt3)" }}>Reason:</span>
                        <span className="text-[10px]" style={{ color: "var(--txt2)" }}>{reasonLabel}</span>
                        {sub.cancellation_notes && (
                          <span className="text-[10px] italic ml-1" style={{ color: "var(--txt3)" }}>— "{sub.cancellation_notes}"</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
