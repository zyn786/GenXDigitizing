// @ts-nocheck
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Send, Trash2, Copy, Check, Ticket, Users, Loader2 } from "lucide-react";

export function CouponsAdmin({ coupons: initialCoupons, redemptions, clients }) {
  const supabase = createClient();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showCreate, setShowCreate] = useState(false);
  const [showSend, setShowSend] = useState(null);
  const [loading, setLoading] = useState(null);

  // Create form state
  const [form, setForm] = useState({ code: "", description: "", discount_type: "percentage", discount_value: "", min_file_count: "0", is_first_order_only: false });

  async function createCoupon() {
    if (!form.code || !form.discount_value) { toast.error("Code and discount required"); return; }
    setLoading("create");
    try {
      const { data, error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_file_count: Number(form.min_file_count) || 0,
        is_first_order_only: form.is_first_order_only,
        status: "active",
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setCoupons(prev => [data, ...prev]);
      setShowCreate(false);
      setForm({ code: "", description: "", discount_type: "percentage", discount_value: "", min_file_count: "0", is_first_order_only: false });
      toast.success("Coupon created!");
    } catch { toast.error("Failed"); }
    finally { setLoading(null); }
  }

  async function deleteCoupon(id) {
    setLoading("del-" + id);
    try {
      await supabase.from("coupons").update({ status: "disabled" }).eq("id", id);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: "disabled" } : c));
      toast.success("Coupon disabled");
    } catch { toast.error("Failed"); }
    finally { setLoading(null); }
  }

  async function sendCoupon(coupon: any, clientId: string, userId: string) {
    setLoading("send-" + coupon.id);
    try {
      // Generate unique code per client
      const client = clients.find(c => c.id === clientId);
      const code = coupon.code + "-" + clientId.slice(0, 4).toUpperCase();
      // Create a client-specific coupon
      await supabase.from("coupons").insert({
        code,
        description: `Sent to ${client?.email || clientId} — ${coupon.description || coupon.code}`,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        is_first_order_only: false,
        status: "active",
      });
      // Create notification for this specific client (use auth user ID, not client table ID)
      if (userId) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "system",
          title: "You received a discount!",
          body: `Use code ${code} for ${coupon.discount_value}${coupon.discount_type === "percentage" ? "%" : "$"} off your next order.`,
          action_url: "/client/new-order",
        });
      }
      toast.success(`Coupon ${code} sent to ${client?.email || clientId}`);
      setShowSend(null);
    } catch { toast.error("Failed to send"); }
    finally { setLoading(null); }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    toast.success("Copied: " + code);
  }

  const redemptionCounts = {};
  for (const r of redemptions) {
    redemptionCounts[r.coupon_id] = (redemptionCounts[r.coupon_id] || 0) + 1;
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1000px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-syne font-bold text-lg" style={{ color: "var(--txt)" }}>Coupons ({coupons.length})</h3>
            <p className="text-[12px]" style={{ color: "var(--txt3)" }}>Active · {redemptions.length} redemptions</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5"
            style={{ background: "#2563EB" }}>
            <Plus size={15} /> Create Coupon
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="mb-5 p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-syne font-bold text-[15px]" style={{ color: "var(--txt)" }}>New Coupon</h4>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--elevated)]"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--txt2)" }}>Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SUMMER20"
                  className="w-full px-3 py-2 rounded-lg text-[13px] border outline-none uppercase" style={{ borderColor: "var(--border2)", background: "var(--surface)", color: "var(--txt)" }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--txt2)" }}>Discount</label>
                <div className="flex gap-2">
                  <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}
                    className="px-2 py-2 rounded-lg text-[12px] border" style={{ borderColor: "var(--border2)", background: "var(--surface)", color: "var(--txt)" }}>
                    <option value="percentage">%</option>
                    <option value="fixed_amount">$</option>
                  </select>
                  <input value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder="20"
                    className="flex-1 px-3 py-2 rounded-lg text-[13px] border outline-none" style={{ borderColor: "var(--border2)", background: "var(--surface)", color: "var(--txt)" }} type="number" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--txt2)" }}>Min Files</label>
                <input value={form.min_file_count} onChange={e => setForm({ ...form, min_file_count: e.target.value })} type="number"
                  className="w-full px-3 py-2 rounded-lg text-[13px] border outline-none" style={{ borderColor: "var(--border2)", background: "var(--surface)", color: "var(--txt)" }} />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
                className="flex-1 px-3 py-2 rounded-lg text-[13px] border outline-none" style={{ borderColor: "var(--border2)", background: "var(--surface)", color: "var(--txt)" }} />
              <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: "var(--txt2)" }}>
                <input type="checkbox" checked={form.is_first_order_only} onChange={e => setForm({ ...form, is_first_order_only: e.target.checked })} />
                First order only
              </label>
            </div>
            <button onClick={createCoupon} disabled={loading === "create"}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer disabled:opacity-50"
              style={{ background: "#16A34A" }}>
              {loading === "create" ? <Loader2 size={14} className="animate-spin inline" /> : <Plus size={14} className="inline" />} Create Coupon
            </button>
          </div>
        )}

        {/* Coupon list */}
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c.id} className="p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ background: "var(--surface)", borderColor: c.status === "active" ? "var(--border)" : "rgba(220,38,38,0.2)", opacity: c.status === "disabled" ? 0.5 : 1 }}>
              <div className="flex items-center gap-3">
                <Ticket size={18} style={{ color: c.status === "active" ? "#2563EB" : "#DC2626" }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] sm:text-[14px] font-bold" style={{ color: "var(--txt)" }}>{c.code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: c.discount_type === "percentage" ? "rgba(37,99,235,0.1)" : "rgba(16,185,129,0.1)", color: c.discount_type === "percentage" ? "#2563EB" : "#16A34A" }}>
                      {c.discount_value}{c.discount_type === "percentage" ? "%" : "$"} off
                    </span>
                    {c.is_first_order_only && <span className="text-[9px] px-1 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] font-bold">1st only</span>}
                    {c.min_file_count > 0 && <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">≥{c.min_file_count} files</span>}
                    <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                      {redemptionCounts[c.id] || 0} used
                    </span>
                  </div>
                  {c.description && <p className="text-[11px] mt-0.5" style={{ color: "var(--txt2)" }}>{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => copyCode(c.code)} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]" title="Copy code"><Copy size={13} /></button>
                <button onClick={() => setShowSend(showSend === c.id ? null : c.id)} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]" title="Send to client"><Send size={13} /></button>
                {c.status === "active" && (
                  <button onClick={() => deleteCoupon(c.id)} disabled={loading === "del-" + c.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-[var(--txt3)] hover:text-red-500" title="Disable">
                    {loading === "del-" + c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>

              {/* Send to client dropdown */}
              {showSend === c.id && (
                <div className="w-full pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] font-semibold mb-2 flex items-center gap-1" style={{ color: "var(--txt2)" }}><Users size={12} /> Send to client</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                    {clients.slice(0, 30).map(client => (
                      <button key={client.id} onClick={() => sendCoupon(c, client.id, client.userId)} disabled={loading === "send-" + c.id}
                        className="text-left px-2.5 py-1.5 rounded-lg text-[11px] border hover:bg-[var(--elevated)] transition-all truncate disabled:opacity-50"
                        style={{ borderColor: "var(--border2)", color: "var(--txt2)" }}>
                        {loading === "send-" + c.id ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}
                        {client.email || client.id} {client.lastOrder && <span className="text-[var(--txt3)]">· {client.lastOrder}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
