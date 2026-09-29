// @ts-nocheck
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Plus,
  Star,
  Package,
  Camera,
  Loader2,
  ChevronRight,
  ClipboardList,
  Crown,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, STATUS_CLASS, STATUS_LABEL } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getCreditCost } from "@/lib/plans";
import { toast } from "sonner";
import Image from "next/image";

const CARD_COLORS = [
  {
    bg: "#3B82F6",
    bgSoft: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    icon: "#2563EB",
    text: "#1D4ED8",
  },
  {
    bg: "#10B981",
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
  },
  {
    bg: "#F97316",
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
  },
  {
    bg: "#06B6D4",
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
  },
  {
    bg: "#8B5CF6",
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
  },
  {
    bg: "#EC4899",
    bgSoft: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.25)",
    icon: "#DB2777",
    text: "#BE185D",
  },
];

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";
const clr = CARD_COLORS;

const CAT_META: Record<string, { emoji: string; ci: number }> = {
  digitizing: { emoji: "🧵", ci: 4 },
  vector: { emoji: "✏️", ci: 3 },
  sewout: { emoji: "🪡", ci: 1 },
};

export function ClientDashboard({ user, stats, recentOrders, tiers, pendingReview }: any) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!user.client_id) return;
      const { data: sub } = await createClient()
        .from("client_subscriptions")
        .select("*")
        .eq("client_id", user.client_id)
        .in("status", ["active", "pending", "cancellation_requested"])
        .maybeSingle();
      setSubscription(sub);
    })();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("userId", user.id);
    fd.append("file", file);
    const res = await fetch("/api/client/avatar", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setAvatarUrl(data.url);
      toast.success("Profile photo updated!");
    } else {
      toast.error("Upload failed");
    }
    e.target.value = "";
  }

  const initials = (user.full_name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const grouped: Record<string, any[]> = {};
  for (const t of tiers) {
    grouped[t.category] = grouped[t.category] ?? [];
    grouped[t.category].push(t);
  }

  // Adjust pending count using localStorage reviewed orders
  const [actualPending, setActualPending] = useState(pendingReview);
  useEffect(() => {
    try {
      const s = localStorage.getItem("reviewedOrders");
      if (s) {
        const ids = JSON.parse(s);
        const d = recentOrders.filter((o: any) => o.status === "delivered").map((o: any) => o.id);
        setActualPending(d.filter((id: string) => !ids.includes(id)).length);
      }
    } catch {}
  }, [pendingReview, recentOrders]);

  // Realtime: refresh stats when invoice is paid
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`client-invoices-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "invoices" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, router]);

  return (
    <div className="portal-content overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Hero header card */}
      <div
        className="mb-5 rounded-2xl p-4 sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${clr[4].bgSoft}, ${clr[3].bgSoft}, ${clr[0].bgSoft})`,
          border: `1px solid ${clr[4].border}`,
        }}
      >
        <div className="mb-4 flex items-center gap-3 sm:gap-5">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative flex h-[60px] w-[60px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-[3px] transition-all active:scale-95 sm:h-[88px] sm:w-[88px]"
            style={{ borderColor: clr[4].border, boxShadow: `0 8px 24px ${clr[4].bgSoft}` }}
          >
            {avatarUrl ? (
              <Image
                fill
                src={avatarUrl}
                alt="Avatar"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center font-syne text-xl font-bold text-white sm:text-3xl"
                style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[5].bg})` }}
              >
                {initials}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex h-[18px] items-center justify-center bg-black/50">
              {uploading ? (
                <Loader2 size={10} className="animate-spin text-white" />
              ) : (
                <Camera size={10} className="text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div className="min-w-0">
            <h2 className="font-syne text-[15px] font-bold leading-tight sm:text-2xl">
              Welcome back,{" "}
              <span
                className="whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {user.full_name || "there"}
              </span>
              <span className="ml-1">👋</span>
            </h2>
            <p className="mt-1 text-[12px] sm:text-[13px]" style={{ color: txt2 }}>
              {stats.total > 0
                ? `${stats.total} orders · ${stats.active} active · ${formatCurrency(stats.totalSpent, "USD", true)} spent`
                : "Ready to place your first order? You'll get free revisions, free formats, and your design back in 12–24h."}
            </p>
          </div>
        </div>
        {/* Subscription status */}
        {subscription && (
          <div
            className="mb-2.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] leading-none"
            style={{
              background:
                subscription.status === "active"
                  ? "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))"
                  : "rgba(249,115,22,0.04)",
              border:
                subscription.status === "active"
                  ? "1px solid rgba(245,158,11,0.15)"
                  : "1px solid rgba(249,115,22,0.2)",
            }}
          >
            {subscription.status === "active" ? (
              <Crown size={11} style={{ color: "#F59E0B", flexShrink: 0 }} />
            ) : (
              <Clock
                size={11}
                style={{
                  color: subscription.status === "pending" ? "#F97316" : "#F59E0B",
                  flexShrink: 0,
                }}
              />
            )}
            <span className="font-bold" style={{ color: txt }}>
              {subscription.plan.toUpperCase()}
            </span>
            {subscription.status === "active" && (
              <span className="font-bold" style={{ color: "#16A34A" }}>
                ·{" "}
                {subscription.designs_total -
                  subscription.designs_used +
                  (subscription.designs_rolled_over || 0)}{" "}
                credits
              </span>
            )}
            {subscription.status === "pending" && (
              <span style={{ color: "#F97316" }}>· Awaiting approval</span>
            )}
            {subscription.status === "cancellation_requested" && (
              <span style={{ color: "#F59E0B" }}>· Under review</span>
            )}
            <Link
              href="/client/subscribe"
              className="ml-auto flex-shrink-0 font-bold no-underline"
              style={{ color: "#7C3AED" }}
            >
              Manage
            </Link>
          </div>
        )}
        {!subscription && (
          <div
            className="mb-2.5 flex items-center gap-1.5 rounded-lg p-2"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04))",
              border: "1px solid rgba(37,99,235,0.15)",
            }}
          >
            <Sparkles size={12} style={{ color: "#2563EB" }} />
            <span className="text-[11px] font-semibold" style={{ color: txt }}>
              Save with a monthly plan
            </span>
            <Link
              href="/client/subscribe"
              className="ml-auto text-[9px] font-bold no-underline"
              style={{ color: "#2563EB" }}
            >
              View Plans
            </Link>
          </div>
        )}
        <div className="mb-2.5 flex gap-1.5">
          <Link href="/client/new-order" className="flex-1">
            <button
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border-none px-2 py-2 text-[11px] font-bold text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[5].bg})` }}
            >
              <Plus size={13} />
              Order
            </button>
          </Link>
          <Link href="/client/subscribe" className="flex-1">
            <button
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition-all active:scale-95"
              style={{
                background: "transparent",
                color: "#F59E0B",
                borderColor: "rgba(245,158,11,0.3)",
              }}
            >
              <Crown size={13} />
              Plans
            </button>
          </Link>
          <Link href="/client/my-orders" className="flex-1">
            <button
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition-all active:scale-95"
              style={{ background: "transparent", color: clr[4].text, borderColor: clr[4].border }}
            >
              <ClipboardList size={13} />
              Orders
            </button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-1">
          {["Format Conversion FREE", "Unlimited Revisions", "Rush 6h FREE", "Urgent 3h FREE"].map(
            (l, i) => (
              <span
                key={l}
                className="whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: clr[i % 2 === 0 ? 3 : 1].bgSoft,
                  color: clr[i % 2 === 0 ? 3 : 1].text,
                  borderColor: clr[i % 2 === 0 ? 3 : 1].border,
                }}
              >
                ✓ {l}
              </span>
            )
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {[
          { label: "Orders", val: stats.total, ci: 4 },
          { label: "Active", val: stats.active, ci: 3 },
          { label: "Done", val: stats.delivered, ci: 1 },
          { label: "Spent", val: formatCurrency(stats.totalSpent, "USD", true), ci: 2 },
        ].map((s) => {
          const c = clr[s.ci];
          return (
            <div
              key={s.label}
              className="rounded-xl p-2 text-center"
              style={{ background: c.bgSoft, border: `1px solid ${c.border}` }}
            >
              <div className="font-syne text-base font-bold sm:text-xl" style={{ color: c.text }}>
                {s.val}
              </div>
              <div
                className="mt-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: txt3 }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending review nudge */}
      {actualPending > 0 && (
        <Link href="/client/my-orders" className="no-underline">
          <div
            className="mb-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-all hover:translate-y-[-2px] active:scale-[0.99] sm:p-5"
            style={{
              background: `linear-gradient(135deg, ${clr[2].bgSoft}, rgba(249,115,22,0.05))`,
              borderColor: clr[2].border,
              boxShadow: `0 4px 20px ${clr[2].bgSoft}`,
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ background: clr[2].icon }}
              >
                <Star size={18} className="text-white" fill="white" />
              </div>
              <div>
                <div className="text-[14px] font-bold sm:text-base" style={{ color: clr[2].text }}>
                  {actualPending} order{actualPending > 1 ? "s" : ""} waiting for review
                </div>
                <div
                  className="mt-0.5 text-[11px] sm:text-xs"
                  style={{ color: clr[2].text, opacity: 0.8 }}
                >
                  Tap to leave a review — earn free priority!
                </div>
              </div>
            </div>
            <div
              className="flex-shrink-0 animate-pulse whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-bold no-underline sm:text-sm"
              style={{ color: "#fff", background: clr[2].icon }}
            >
              Review →
            </div>
          </div>
        </Link>
      )}

      {/* Pricing + Recent orders */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {/* Pricing */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-syne text-sm font-bold" style={{ color: txt }}>
              Service Pricing
            </h3>
            <Link
              href="/client/new-order"
              className="inline-flex items-center gap-1 text-[11px] font-semibold no-underline"
              style={{ color: clr[4].text }}
            >
              Order now <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(grouped).map(([cat, catTiers]) => {
              const meta = CAT_META[cat] ?? { emoji: "📋", ci: 0 };
              const c = clr[meta.ci];
              return (
                <div
                  key={cat}
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: c.bgSoft }}
                  >
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: c.text }}>
                      {cat === "digitizing"
                        ? "Embroidery Digitizing"
                        : cat === "vector"
                          ? "Vector Redraw"
                          : "Patch Design"}
                    </span>
                  </div>
                  {catTiers.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-2.5 py-1.5 text-[11px]"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate font-semibold" style={{ color: txt2 }}>
                          {t.label}
                        </span>
                        <span
                          className="hidden truncate text-[10px] sm:inline"
                          style={{ color: txt3 }}
                        >
                          {t.size_desc}
                        </span>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                        <span style={{ color: txt3, fontSize: 10 }}>{t.est_hours}</span>
                        {subscription && subscription.status === "active" ? (
                          <span
                            className="text-[11px] font-bold"
                            style={{
                              color:
                                (t.credit_cost ||
                                  getCreditCost(subscription.plan, !!t.is_big_design)) > 1
                                  ? "#F97316"
                                  : "#16A34A",
                            }}
                          >
                            {t.credit_cost || getCreditCost(subscription.plan, !!t.is_big_design)}{" "}
                            credit
                            {getCreditCost(subscription.plan, !!t.is_big_design, t.credit_cost) !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        ) : (
                          <span className="font-syne text-xs font-bold" style={{ color: c.text }}>
                            ${Number(t.price).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orders */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-syne text-sm font-bold" style={{ color: txt }}>
              Recent Orders
            </h3>
            <Link
              href="/client/my-orders"
              className="inline-flex items-center gap-1 text-[11px] font-semibold no-underline"
              style={{ color: clr[4].text }}
            >
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: clr[0].bgSoft }}
              >
                <Package size={22} style={{ color: clr[0].icon }} />
              </div>
              <p className="mb-1 text-sm font-semibold" style={{ color: txt }}>
                No orders yet
              </p>
              <p className="mb-4 text-xs" style={{ color: txt3 }}>
                Start your first embroidery project
              </p>
              <Link href="/client/new-order">
                <button
                  className="cursor-pointer rounded-xl border-none px-5 py-2.5 text-xs font-semibold text-white"
                  style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
                >
                  <Plus size={12} className="mr-1 inline" /> Place First Order
                </button>
              </Link>
            </div>
          ) : (
            recentOrders.map((o: any, i: number) => (
              <Link key={o.id} href={`/client/my-orders/${o.id}`} className="no-underline">
                <div
                  className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors"
                  style={{
                    borderBottom: i < recentOrders.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: clr[4].bgSoft }}
                  >
                    <Package size={13} style={{ color: clr[4].icon }} />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold" style={{ color: clr[4].text }}>
                        {o.order_number}
                      </div>
                      <div className="mt-0.5 truncate text-[11px]" style={{ color: txt2 }}>
                        {o.service_tiers?.label ?? "—"}
                      </div>
                    </div>
                    <div className="ml-2 flex flex-shrink-0 items-center gap-2.5">
                      <span
                        className={STATUS_CLASS[o.status]}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          border: "1px solid",
                        }}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>
                      <span className="font-syne text-sm font-bold" style={{ color: clr[1].text }}>
                        ${Number(o.price).toFixed(0)}
                      </span>
                      <ChevronRight size={14} style={{ color: txt3 }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
