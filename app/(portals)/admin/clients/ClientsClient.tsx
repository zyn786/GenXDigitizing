// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  Calendar,
  ShoppingBag,
  DollarSign,
  Users,
  Crown,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatRelative, TIER_CLASS, getInitials } from "@/lib/utils";

// Bright palette matching dashboard
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

const CLR = {
  purple: "#5B21B6",
  purpleBg: "rgba(91,33,182,0.08)",
  cyan: "#0E7490",
  cyanBg: "rgba(14,116,144,0.08)",
  amber: "#92400E",
  amberBg: "rgba(146,64,14,0.08)",
  green: "#047857",
  greenBg: "rgba(4,120,87,0.08)",
  red: "#B91C1C",
  redBg: "rgba(185,28,28,0.08)",
  gray: "#374151",
  grayBg: "rgba(55,65,81,0.08)",
  dark: "#1F2937",
  mid: "#4B5563",
  light: "#6B7280",
};

const TIER_LABEL: Record<string, string> = { vip: "👑 VIP", active: "✓ Active", new: "New" };
const TIER_META: Record<string, { color: string; bg: string; icon: React.ReactNode; ci: number }> =
  {
    vip: { color: "#C2410C", bg: "rgba(249,115,22,0.08)", icon: <Crown size={14} />, ci: 2 },
    active: {
      color: "#047857",
      bg: "rgba(16,185,129,0.08)",
      icon: <BadgeCheck size={14} />,
      ci: 1,
    },
    new: { color: "#0E7490", bg: "rgba(6,182,212,0.08)", icon: <Sparkles size={14} />, ci: 3 },
  };

const TIERS = ["all", "vip", "active", "new"] as const;

export function AdminClientsClient({ clients }: { clients: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [, startTx] = useTransition();

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [detail, setDetail] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = clients.filter((c) => {
    const mq =
      !search ||
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.users?.email?.toLowerCase().includes(search.toLowerCase());
    const mt = tier === "all" || c.tier === tier;
    return mq && mt;
  });

  const totalVip = clients.filter((c) => c.tier === "vip").length;
  const totalActive = clients.filter((c) => c.tier === "active").length;
  const totalRev = clients.reduce((s, c) => s + Number(c.ltv ?? 0), 0);

  async function openDetail(client: any) {
    setDetail(client);
    setLoadingDetail(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, price, turnaround, created_at, service_tiers(label)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setOrders(data ?? []);
    setLoadingDetail(false);
  }

  async function toggleActive(client: any) {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !client.users?.is_active } as any)
      .eq("id", client.users?.id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success(client.users?.is_active ? "Account deactivated" : "Account activated");
    startTx(() => router.refresh());
  }

  async function upgradeTier(clientId: string, t: string) {
    const { error } = await supabase
      .from("clients")
      .update({ tier: t } as any)
      .eq("id", clientId);
    if (error) {
      toast.error("Failed");
      return;
    }
    toast.success(`Tier → ${t}`);
    startTx(() => router.refresh());
  }

  const inp: React.CSSProperties = {
    background: "var(--elevated)",
    border: "1px solid var(--border2)",
    borderRadius: 9,
    padding: "8px 13px",
    color: "#1F2937",
    fontSize: 13,
    outline: "none",
  };

  // ── Detail view ──────────────────────────────────────────
  if (detail) {
    const u = detail.users;
    const tmeta = TIER_META[detail.tier] || TIER_META.new;
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setDetail(null)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all active:scale-95"
            style={{
              background: "var(--elevated)",
              borderColor: "var(--border2)",
              color: "var(--txt2)",
            }}
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h2 className="font-syne text-base font-bold sm:text-lg" style={{ color: "var(--txt)" }}>
            {detail.company_name}
          </h2>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 600,
              background: tmeta.bg,
              color: tmeta.color,
              border: `1px solid ${tmeta.color}40`,
            }}
          >
            {tmeta.icon} {TIER_LABEL[detail.tier]}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-2">
          {/* Profile card */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                style={{
                  background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})`,
                }}
              >
                {getInitials(detail.company_name)}
              </div>
              <div>
                <div
                  className="font-syne text-sm font-bold sm:text-base"
                  style={{ color: "var(--txt)" }}
                >
                  {detail.company_name}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: CARD_COLORS[3].text }}>
                  {u?.email}
                </div>
              </div>
            </div>
            <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
              {[
                [<Mail size={12} key="m" />, "Email", u?.email],
                [<Phone size={12} key="p" />, "Phone", detail.phone || "—"],
                [<Globe size={12} key="g" />, "Country", detail.country || "—"],
                [<Calendar size={12} key="c" />, "Joined", formatDate(detail.joined_at)],
                [<ShoppingBag size={12} key="s" />, "Orders", detail.order_count ?? 0],
                [<DollarSign size={12} key="d" />, "LTV", formatCurrency(detail.ltv)],
              ].map(([icon, label, value]: any) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between py-1.5 text-xs"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: "var(--txt2)" }}>
                    {icon} {label}
                  </div>
                  <span
                    className="font-medium"
                    style={{ color: label === "LTV" ? CARD_COLORS[1].text : "var(--txt)" }}
                  >
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <select
                value={detail.tier}
                onChange={(e) => upgradeTier(detail.id, e.target.value)}
                style={{ ...inp, flex: 1, fontSize: 12 }}
              >
                {["new", "active", "vip"].map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABEL[t]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleActive(detail)}
                className="cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: u?.is_active ? "rgba(220,38,38,0.08)" : "rgba(16,185,129,0.08)",
                  color: u?.is_active ? "#DC2626" : "#059669",
                  borderColor: u?.is_active ? "rgba(220,38,38,0.3)" : "rgba(16,185,129,0.3)",
                }}
              >
                {u?.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>

          {/* Orders */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="mb-3 font-syne text-sm font-bold" style={{ color: "var(--txt)" }}>
              Order History
            </h3>
            {loadingDetail ? (
              <p className="py-8 text-center text-xs" style={{ color: "var(--txt3)" }}>
                Loading…
              </p>
            ) : orders.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: "var(--txt3)" }}>
                No orders yet
              </p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <div
                      className="font-mono text-xs font-bold"
                      style={{ color: CARD_COLORS[0].text }}
                    >
                      {o.order_number}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "var(--txt2)" }}>
                      {(o.service_tiers as any)?.label ?? "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-syne text-sm font-bold"
                      style={{ color: CARD_COLORS[1].text }}
                    >
                      ${Number(o.price).toFixed(0)}
                    </div>
                    <div className="mt-0.5 text-[10px]" style={{ color: "var(--txt3)" }}>
                      {formatDate(o.created_at, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2
          className="font-syne text-xl font-bold sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Client Management
        </h2>
        <p className="mt-1 text-[12px] sm:text-xs" style={{ color: "var(--txt3)" }}>
          {clients.length} registered clients
        </p>
      </div>

      {/* Stat cards — 2-col mobile, 4-col desktop */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Total Clients", val: clients.length, icon: <Users size={16} />, ci: 0 },
          { label: "VIP Clients", val: totalVip, icon: <Crown size={16} />, ci: 2 },
          { label: "Active", val: totalActive, icon: <BadgeCheck size={16} />, ci: 1 },
          {
            label: "Total Revenue",
            val: formatCurrency(totalRev, "USD", true),
            icon: <DollarSign size={16} />,
            ci: 3,
          },
        ].map((s) => {
          const clr = CARD_COLORS[s.ci];
          return (
            <div
              key={s.label}
              className="rounded-2xl p-3 transition-all duration-200 hover:translate-y-[-2px] sm:p-3.5"
              style={{ background: clr.bgSoft, border: `1px solid ${clr.border}` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: clr.bgSoft, color: clr.icon }}
                >
                  {s.icon}
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]"
                  style={{ color: "var(--txt2)" }}
                >
                  {s.label}
                </div>
              </div>
              <div className="font-syne text-lg font-bold sm:text-xl" style={{ color: clr.text }}>
                {s.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + desktop tier tabs */}
      <div className="mb-4 flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--txt3)" }}
          />
          <input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="box-border w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              color: "var(--txt)",
            }}
          />
        </div>
        {/* Desktop tier buttons */}
        <div className="hidden gap-1.5 sm:flex">
          {TIERS.map((t) => {
            const meta =
              t === "all"
                ? { color: "#1F2937", bg: "var(--elevated)", icon: <Users size={13} /> }
                : TIER_META[t];
            const active = tier === t;
            return (
              <button
                key={t}
                onClick={() => setTier(t)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  background: active
                    ? t === "all"
                      ? "var(--elevated2)"
                      : meta.bg
                    : "var(--elevated)",
                  color: active ? meta.color : "var(--txt2)",
                  borderColor: active ? `${meta.color}40` : "var(--border2)",
                }}
              >
                {t === "all" ? null : meta.icon}
                {t === "all" ? "All Tiers" : TIER_LABEL[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: colored tier chips */}
      <div className="scrollbar-none mb-4 flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
        <button
          onClick={() => setTier("all")}
          className="flex-shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: tier === "all" ? "var(--elevated2)" : "var(--elevated)",
            color: tier === "all" ? "#1F2937" : "var(--txt2)",
            borderColor: tier === "all" ? "var(--border3)" : "var(--border2)",
          }}
        >
          All
        </button>
        {["vip", "active", "new"].map((t) => {
          const meta = TIER_META[t];
          const active = tier === t;
          return (
            <button
              key={t}
              onClick={() => setTier(active ? "all" : t)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: active ? meta.bg : "var(--elevated)",
                color: active ? meta.color : "var(--txt2)",
                borderColor: active ? `${meta.color}40` : "var(--border2)",
              }}
            >
              {meta.icon}
              {TIER_LABEL[t]}
            </button>
          );
        })}
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--txt3)" }}>
            No clients found
          </div>
        ) : (
          filtered.map((c) => {
            const tm = TIER_META[c.tier] || TIER_META.new;
            return (
              <div
                key={c.id}
                onClick={() => openDetail(c)}
                className="cursor-pointer rounded-xl p-4 transition-all active:opacity-80"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})`,
                      }}
                    >
                      {getInitials(c.company_name)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--txt)" }}>
                        {c.company_name}
                      </div>
                      <div className="text-[11px]" style={{ color: CARD_COLORS[3].text }}>
                        {c.users?.email ?? "—"}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      background: tm.bg,
                      color: tm.color,
                      border: `1px solid ${tm.color}40`,
                    }}
                  >
                    {TIER_LABEL[c.tier]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <span style={{ color: "var(--txt2)" }}>{c.country || "—"}</span>
                  <span className="font-semibold" style={{ color: CARD_COLORS[0].text }}>
                    {c.order_count ?? 0} orders
                  </span>
                  <span
                    className="ml-auto font-syne font-bold"
                    style={{ color: CARD_COLORS[1].text }}
                  >
                    {formatCurrency(c.ltv)}
                  </span>
                  <ChevronRight size={14} style={{ color: "var(--txt3)" }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div
        className="hidden overflow-hidden rounded-2xl sm:block"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--elevated)" }}>
              {[
                "Client",
                "Email",
                "Country",
                "Orders",
                "Lifetime Value",
                "Last Sign In",
                "Tier",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--txt3)", borderBottom: "1px solid var(--border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-sm"
                  style={{ color: "var(--txt3)" }}
                >
                  No clients found
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const tm = TIER_META[c.tier] || TIER_META.new;
                return (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})`,
                          }}
                        >
                          {getInitials(c.company_name)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--txt)" }}>
                          {c.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: CARD_COLORS[3].text }}>
                      {c.users?.email ?? "—"}
                    </td>
                    <td className="p-3 text-xs" style={{ color: "var(--txt2)" }}>
                      {c.country || "—"}
                    </td>
                    <td
                      className="p-3 text-sm font-semibold"
                      style={{ color: CARD_COLORS[0].text }}
                    >
                      {c.order_count ?? 0}
                    </td>
                    <td
                      className="p-3 font-syne text-sm font-bold"
                      style={{ color: CARD_COLORS[1].text }}
                    >
                      {formatCurrency(c.ltv)}
                    </td>
                    <td className="p-3 text-xs" style={{ color: "var(--txt2)" }}>
                      {c.users?.last_sign_in ? formatRelative(c.users.last_sign_in) : "Never"}
                    </td>
                    <td className="p-3">
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          background: tm.bg,
                          color: tm.color,
                          border: `1px solid ${tm.color}40`,
                        }}
                      >
                        {TIER_LABEL[c.tier]}
                      </span>
                    </td>
                    <td className="p-3">
                      <ChevronRight size={14} style={{ color: "var(--txt3)" }} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
