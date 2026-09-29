// @ts-nocheck
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  X,
  DollarSign,
  Send,
  Image,
  Loader2,
  Mail,
  Globe,
  Calendar,
  Building2,
  FileText,
  ChevronRight,
  TrendingUp,
  Target,
  Trophy,
  Download,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import NextImage from "next/image";

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

const STAGES = [
  { id: "lead", label: "New Lead", ci: 4, icon: "📥" },
  { id: "contacted", label: "Contacted", ci: 3, icon: "📞" },
  { id: "won", label: "Won", ci: 1, icon: "🏆" },
  { id: "lost", label: "Lost", ci: 5, icon: "❌" },
];

const SOURCES = ["website", "referral", "social", "email", "cold_outreach", "other"];
const inpStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border2)",
  borderRadius: 10,
  padding: "9px 13px",
  color: txt,
  fontSize: 13,
  outline: "none",
  fontFamily: "Inter,sans-serif",
  boxSizing: "border-box",
};

function LeadCard({ lead, onClick }: { lead: any; onClick: () => void }) {
  const stage = STAGES.find((s) => s.id === lead.stage)!;
  const sc = clr[stage.ci];
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl p-4 transition-all active:opacity-80"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: sc.bgSoft, color: sc.text, border: `1px solid ${sc.border}` }}
          >
            {getInitials(lead.contact_name)}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: txt }}>
              {lead.contact_name}
            </div>
            <div className="text-[11px]" style={{ color: txt2 }}>
              {lead.company ?? lead.email}
            </div>
          </div>
        </div>
        {lead.deal_value > 0 && (
          <div
            className="flex flex-shrink-0 items-center gap-0.5 text-sm font-bold"
            style={{ color: clr[1].text }}
          >
            <DollarSign size={11} />
            {lead.deal_value}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md border px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}
          >
            {stage.icon} {stage.label}
          </span>
          <span className="text-[10px] capitalize" style={{ color: txt2 }}>
            {lead.source?.replace("_", " ")}
          </span>
        </div>
        <ChevronRight size={14} style={{ color: txt3 }} />
      </div>
    </div>
  );
}

function AddLeadModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    contact_name: "",
    email: "",
    company: "",
    country: "",
    source: "website",
    stage: "lead",
    deal_value: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.contact_name || !form.email) {
      toast.error("Name and email required");
      return;
    }
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  }

  const upd = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl border p-6"
        style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-syne text-lg font-bold" style={{ color: txt }}>
            Add Lead
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={16} />
          </button>
        </div>
        {[
          ["Full Name *", "contact_name", "text", "Jane Smith"],
          ["Email *", "email", "email", "jane@company.com"],
          ["Company", "company", "text", "Acme Corp"],
          ["Country", "country", "text", "US"],
          ["Deal Value ($)", "deal_value", "number", "250"],
        ].map(([label, key, type, placeholder]) => (
          <div key={key as string} className="mb-3">
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: txt2 }}
            >
              {label as string}
            </label>
            <input
              type={type as string}
              value={(form as any)[key as string]}
              onChange={upd(key as string)}
              placeholder={placeholder as string}
              style={inpStyle}
            />
          </div>
        ))}
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: txt2 }}
            >
              Source
            </label>
            <select
              value={form.source}
              onChange={upd("source")}
              style={{ ...inpStyle, cursor: "pointer" }}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: txt2 }}
            >
              Stage
            </label>
            <select
              value={form.stage}
              onChange={upd("stage")}
              style={{ ...inpStyle, cursor: "pointer" }}
            >
              {STAGES.filter((s) => s.id !== "won" && s.id !== "lost").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: txt2 }}
          >
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={upd("notes")}
            rows={3}
            placeholder="Source info, design needs, requirements…"
            style={{ ...inpStyle, resize: "none" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border py-2 text-[13px] font-medium transition-all active:scale-95"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-[2] cursor-pointer rounded-xl border-none py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
          >
            {saving ? "Adding…" : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({
  lead,
  onClose,
  onContact,
  onConvertToOrder,
}: {
  lead: any;
  onClose: () => void;
  onContact: () => void;
  onConvertToOrder: () => void;
}) {
  const artworkUrl = getArtworkUrl(lead.notes);
  const artworkInfo = parseLeadArtworkInfo(lead.notes);
  const leadService = parseLeadService(lead.notes);
  const leadMessage = parseLeadMessage(lead.notes);
  const stage = STAGES.find((s) => s.id === lead.stage);
  const sc = clr[stage?.ci ?? 4];
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!lead.email) return;
    fetch(`/api/crm/lead-orders?email=${encodeURIComponent(lead.email)}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoaded(true));
  }, [lead.email]);

  const activityLines = (lead.notes || "").split("\n").filter((l: string) => l.startsWith("["));
  const cleanNotes = (lead.notes || "")
    .split("\n")
    .filter((l: string) => !l.startsWith("["))
    .join("\n")
    .trim();

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-[600px] overflow-y-auto rounded-2xl border"
        style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-5 pb-0 sm:p-6">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={18} />
          </button>
          <div className="mb-4 flex items-center gap-3 sm:gap-3.5">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-[18px] font-bold text-white sm:h-14 sm:w-14 sm:text-[22px]"
              style={{ background: `linear-gradient(135deg,${sc.icon},${sc.text})` }}
            >
              {getInitials(lead.contact_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 font-syne text-lg font-bold sm:text-xl" style={{ color: txt }}>
                {lead.contact_name}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}
                >
                  {stage?.icon} {stage?.label}
                </span>
                <span className="text-[11px] font-medium capitalize" style={{ color: txt2 }}>
                  {lead.source?.replace("_", " ") || "Unknown source"}
                </span>
                <span className="text-[11px]" style={{ color: txt2 }}>
                  {formatDate(lead.created_at, { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 sm:p-6">
          <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div
              className="flex items-center gap-2.5 rounded-xl p-3"
              style={{ background: "var(--elevated)" }}
            >
              <Mail size={16} style={{ color: clr[0].icon, flexShrink: 0 }} />
              <div className="min-w-0">
                <div
                  className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Email
                </div>
                <a
                  href={`mailto:${lead.email}`}
                  className="break-all text-[12px] font-medium no-underline"
                  style={{ color: txt }}
                >
                  {lead.email}
                </a>
              </div>
            </div>
            {lead.company && (
              <div
                className="flex items-center gap-2.5 rounded-xl p-3"
                style={{ background: "var(--elevated)" }}
              >
                <Building2 size={16} style={{ color: clr[4].icon, flexShrink: 0 }} />
                <div className="min-w-0">
                  <div
                    className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: txt3 }}
                  >
                    Company
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: txt }}>
                    {lead.company}
                  </div>
                </div>
              </div>
            )}
            {lead.country && (
              <div
                className="flex items-center gap-2.5 rounded-xl p-3"
                style={{ background: "var(--elevated)" }}
              >
                <Globe size={16} style={{ color: clr[1].icon, flexShrink: 0 }} />
                <div className="min-w-0">
                  <div
                    className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: txt3 }}
                  >
                    Country
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: txt }}>
                    {lead.country}
                  </div>
                </div>
              </div>
            )}
            <div
              className="flex items-center gap-2.5 rounded-xl p-3"
              style={{ background: "var(--elevated)" }}
            >
              <Calendar size={16} style={{ color: clr[2].icon, flexShrink: 0 }} />
              <div className="min-w-0">
                <div
                  className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Created
                </div>
                <div className="text-[12px] font-medium" style={{ color: txt }}>
                  {formatDate(lead.created_at, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>

          {lead.deal_value > 0 && (
            <div
              className="mb-4 rounded-xl border p-2.5 text-center text-[12px] font-semibold"
              style={{ background: clr[1].bgSoft, borderColor: clr[1].border, color: clr[1].text }}
            >
              Deal Value: ${Number(lead.deal_value).toLocaleString()}
            </div>
          )}

          {/* Service & Artwork info parsed from lead */}
          {(leadService || artworkInfo) && (
            <div
              className="mb-4 rounded-xl border p-3.5"
              style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <FileText size={14} style={{ color: txt3 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Request Details
                </span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                {leadService && (
                  <div className="flex gap-2">
                    <span style={{ color: txt3 }}>Service:</span>
                    <span className="font-semibold" style={{ color: clr[0].text }}>
                      {leadService}
                    </span>
                  </div>
                )}
                {artworkInfo && (
                  <div className="flex gap-2">
                    <span style={{ color: txt3 }}>Artwork:</span>
                    <span style={{ color: txt }}>
                      {artworkInfo.name} <span style={{ color: txt3 }}>({artworkInfo.size})</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Artwork image preview */}
          {artworkUrl && !imgError && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Image size={14} style={{ color: txt3 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Artwork Preview
                </span>
              </div>
              <a
                href={artworkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--border)" }}
              >
                <NextImage
                  src={artworkUrl}
                  alt={artworkInfo?.name || "Artwork"}
                  width={600}
                  height={400}
                  className="h-auto max-h-[300px] w-full object-contain"
                  style={{ background: "var(--elevated)" }}
                  onError={() => setImgError(true)}
                />
              </a>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={artworkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-[12px] font-semibold no-underline transition-all hover:opacity-80"
                  style={{
                    background: clr[4].bgSoft,
                    borderColor: clr[4].border,
                    color: clr[4].text,
                  }}
                >
                  <Image size={16} /> View Full ↗
                </a>
                <a
                  href={artworkUrl}
                  download
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-[12px] font-semibold no-underline transition-all hover:opacity-80"
                  style={{
                    background: clr[0].bgSoft,
                    borderColor: clr[0].border,
                    color: clr[0].text,
                  }}
                >
                  <Download size={16} /> Download
                </a>
              </div>
            </div>
          )}

          {leadMessage && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-1.5">
                <FileText size={14} style={{ color: txt3 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Message
                </span>
              </div>
              <div
                className="whitespace-pre-wrap rounded-xl border p-3.5 text-[13px] leading-relaxed"
                style={{ background: "var(--elevated)", color: txt2, borderColor: "var(--border)" }}
              >
                {leadMessage}
              </div>
            </div>
          )}

          {activityLines.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Calendar size={14} style={{ color: txt3 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Activity Log
                </span>
              </div>
              <div
                className="overflow-hidden rounded-xl border"
                style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
              >
                {activityLines.map((line: string, i: number) => {
                  const timestamp = line.match(/\[(.*?)\]/)?.[1] || "";
                  const action = line.replace(/\[.*?\]\s*/, "");
                  const date = timestamp ? new Date(timestamp) : null;
                  const dotColor = action.includes("Stage changed")
                    ? clr[4].icon
                    : action.includes("Email")
                      ? clr[0].icon
                      : clr[3].icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[11px]"
                      style={{
                        borderBottom:
                          i < activityLines.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: dotColor }}
                      />
                      <span className="flex-1" style={{ color: txt2 }}>
                        {action}
                      </span>
                      {date && (
                        <span
                          className="flex-shrink-0 whitespace-nowrap text-[10px]"
                          style={{ color: txt3 }}
                        >
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ordersLoaded && orders.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5">
                <FileText size={14} style={{ color: txt3 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Orders ({orders.length})
                </span>
              </div>
              <div
                className="overflow-hidden rounded-xl border"
                style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
              >
                {orders.map((o, i) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[11px]"
                    style={{
                      borderBottom: i < orders.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold" style={{ color: txt }}>
                        {o.orderNumber}
                      </div>
                      <div className="text-[10px]" style={{ color: txt2 }}>
                        {o.service}
                        {o.designName ? ` · ${o.designName}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="text-[12px] font-bold" style={{ color: clr[1].text }}>
                        ${o.price}
                      </span>
                      <span
                        className="rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                        style={{
                          background: "var(--elevated)",
                          color: txt2,
                          borderColor: "var(--border2)",
                        }}
                      >
                        {o.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="flex flex-wrap gap-2.5 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={onConvertToOrder}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-none py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${clr[1].bg},${clr[1].icon})` }}
            >
              <ShoppingCart size={15} /> Convert to Order
            </button>
            <button
              onClick={onContact}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${clr[0].bg},${clr[4].bg})` }}
            >
              <Send size={15} /> Contact via Email
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border px-5 py-2.5 text-[13px] font-medium transition-all active:scale-95"
              style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getArtworkUrl(notes: string) {
  if (!notes) return null;
  // Match "Download:" prefix (contact form)
  const match = notes.match(/Download:\s*(\/api\/chat\/upload\?key=[^\s]+)/);
  if (match) return match[1];
  // Match " — URL" separator (guest upload wizard)
  const dashMatch = notes.match(/\s—\s(\/api\/chat\/upload\?key=[^\s]+)/);
  if (dashMatch) return dashMatch[1];
  // Match any standalone /api/chat/upload?key= URL in notes
  const anyMatch = notes.match(/(\/api\/chat\/upload\?key=[^\s]+)/);
  if (anyMatch) return anyMatch[1];
  const absMatch = notes.match(/Download:\s*(https?:\/\/[^\s]+)/);
  return absMatch?.[1] || null;
}

function parseLeadService(notes: string): string {
  if (!notes) return "";
  const match = notes.match(/Service:\s*(.+)/);
  return match?.[1] || "";
}

function parseLeadArtworkInfo(notes: string): { name: string; size: string } | null {
  if (!notes) return null;
  const match = notes.match(/Artwork:\s*(.+?)\s*\(([^)]+)\)/);
  return match ? { name: match[1], size: match[2] } : null;
}

function parseLeadMessage(notes: string): string {
  if (!notes) return "";
  // Remove metadata lines: Service:, Artwork:, Download:, and activity log lines
  return notes
    .split("\n")
    .filter(
      (l: string) =>
        !l.startsWith("Service:") &&
        !l.startsWith("Artwork:") &&
        !l.startsWith("Download:") &&
        !l.startsWith("[")
    )
    .join("\n")
    .trim();
}

function ConvertToOrderModal({ lead, onClose }: { lead: any; onClose: (order?: any) => void }) {
  const parsedService = parseLeadService(lead.notes);
  const [tiers, setTiers] = useState<any[]>([]);
  const [tiersLoaded, setTiersLoaded] = useState(false);
  const [form, setForm] = useState({
    service_tier_id: "",
    design_name: lead.company ? `${lead.company} Logo` : "",
    price: lead.deal_value || "",
    turnaround: "standard",
    output_format: "DST",
    width_inches: "4",
    height_inches: "4",
    color_count: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/orders/tiers")
      .then((r) => r.json())
      .then((d) => {
        setTiers(d.tiers || []);
      })
      .catch(() => {})
      .finally(() => setTiersLoaded(true));
  }, []);

  const upd = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const selectedTier = tiers.find((t) => t.id === form.service_tier_id);

  async function handleConvert() {
    if (!form.service_tier_id || !form.design_name.trim() || !form.price) {
      toast.error("Service tier, design name, and price are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/crm/convert-to-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(`Order ${data.order.order_number} created!`);
      onClose(data.order);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl border p-6"
        style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-syne text-lg font-bold" style={{ color: txt }}>
            Convert Lead to Order
          </h3>
          <button
            onClick={() => onClose()}
            className="cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="mb-4 rounded-xl p-3"
          style={{ background: clr[1].bgSoft, border: `1px solid ${clr[1].border}` }}
        >
          <div className="text-[11px] font-semibold" style={{ color: clr[1].text }}>
            {lead.contact_name}
          </div>
          <div className="text-[11px]" style={{ color: txt2 }}>
            {lead.email} {lead.company ? `· ${lead.company}` : ""}
          </div>
          {parsedService && (
            <div className="mt-0.5 text-[11px]" style={{ color: txt3 }}>
              Requested: {parsedService}
            </div>
          )}
        </div>

        {!tiersLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: txt3 }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: txt2 }}
              >
                Service Tier *
              </label>
              <select
                value={form.service_tier_id}
                onChange={upd("service_tier_id")}
                className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: "var(--surface)", color: txt, borderColor: "var(--border2)" }}
              >
                <option value="">Select tier…</option>
                {tiers.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.category === "digitizing" ? "🧵" : t.category === "vector" ? "✏️" : "🏷️"}{" "}
                    {t.label} — ${t.price}
                  </option>
                ))}
              </select>
              {selectedTier && (
                <div className="mt-1 text-[10px]" style={{ color: txt3 }}>
                  {selectedTier.size_desc} · {selectedTier.est_hours} est.
                </div>
              )}
            </div>

            <div>
              <label
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: txt2 }}
              >
                Design Name *
              </label>
              <input
                type="text"
                value={form.design_name}
                onChange={upd("design_name")}
                placeholder="e.g. Company Logo"
                className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: "var(--surface)", color: txt, borderColor: "var(--border2)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: txt2 }}
                >
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={upd("price")}
                  placeholder="e.g. 15"
                  min="1"
                  className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    color: txt,
                    borderColor: "var(--border2)",
                  }}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: txt2 }}
                >
                  Turnaround
                </label>
                <select
                  value={form.turnaround}
                  onChange={upd("turnaround")}
                  className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    color: txt,
                    borderColor: "var(--border2)",
                  }}
                >
                  <option value="standard">🕐 Standard (12-24h)</option>
                  <option value="rush">⚡ Rush (6h)</option>
                  <option value="urgent">🔥 Urgent (3h)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: txt2 }}
                >
                  Width (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.width_inches}
                  onChange={upd("width_inches")}
                  placeholder='4"'
                  className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    color: txt,
                    borderColor: "var(--border2)",
                  }}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: txt2 }}
                >
                  Height (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height_inches}
                  onChange={upd("height_inches")}
                  placeholder='4"'
                  className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    color: txt,
                    borderColor: "var(--border2)",
                  }}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: txt2 }}
                >
                  Colors
                </label>
                <input
                  type="number"
                  value={form.color_count}
                  onChange={upd("color_count")}
                  placeholder="e.g. 4"
                  className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    color: txt,
                    borderColor: "var(--border2)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: txt2 }}
              >
                Output Format
              </label>
              <select
                value={form.output_format}
                onChange={upd("output_format")}
                className="w-full rounded-xl border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: "var(--surface)", color: txt, borderColor: "var(--border2)" }}
              >
                {["DST", "PES", "EMB", "JEF", "EXP", "XXX", "VIP", "HUS"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2.5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => onClose()}
            className="flex-1 cursor-pointer rounded-xl border py-2.5 text-[13px] font-medium transition-all active:scale-95"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={busy || !tiersLoaded}
            className="flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl border-none py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{
              background: busy
                ? "var(--border2)"
                : `linear-gradient(135deg,${clr[1].bg},${clr[1].icon})`,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            <ShoppingCart size={15} /> {busy ? "Converting…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactLeadModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [subject, setSubject] = useState(`Re: Your inquiry with genxdigitizing`);
  const [message, setMessage] = useState(
    `Hi ${lead.contact_name},\n\nThank you for reaching out! We'd love to help with your embroidery project.\n\nCould you share more details about what you need? We can provide a quote and turnaround time.\n\nBest regards,\ngenxdigitizing Team`
  );
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [escalation, setEscalation] = useState<string | null>(null);

  // Drafts a reply from the lead's real record + conversation history. It never
  // sends — the draft lands in the textarea for staff to edit first.
  async function handleDraft() {
    setDrafting(true);
    setEscalation(null);
    try {
      const res = await fetch("/api/crm/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Draft failed");
        return;
      }

      if (data.escalated) {
        // The model's output here is an internal note addressed to staff, not a
        // customer reply. It must NOT land in the message box — one stray click
        // on Send would email the escalation note to the customer. Show it in a
        // separate banner and leave the compose field untouched.
        setEscalation(
          String(data.draft)
            .replace(/^ESCALATE:\s*/i, "")
            .trim()
        );
        toast.warning("AI recommends a human handle this one.");
      } else {
        setMessage(data.draft);
        toast.success("Draft ready — review before sending.");
      }
    } catch {
      toast.error("Draft failed — network error");
    } finally {
      setDrafting(false);
    }
  }

  async function handleSend() {
    if (!subject || !message) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    const res = await fetch("/api/crm/contact-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        to: lead.email,
        subject,
        message,
        leadName: lead.contact_name,
      }),
    });
    setSending(false);
    if (res.ok) {
      toast.success("Email sent! Lead moved to Contacted.");
      onClose();
      window.location.reload();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to send email");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border p-6"
        style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="mb-0.5 font-syne text-lg font-bold" style={{ color: txt }}>
              Contact {lead.contact_name}
            </h3>
            <p className="m-0 text-[11px]" style={{ color: txt2 }}>
              {lead.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-3.5">
          <label
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: txt2 }}
          >
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ ...inpStyle }}
          />
        </div>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: txt2 }}
            >
              Message
            </label>
            <button
              onClick={handleDraft}
              disabled={drafting || sending}
              type="button"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border2)",
                color: clr[4].text,
              }}
            >
              {drafting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {drafting ? "Drafting…" : "Draft with AI"}
            </button>
          </div>
          {escalation && (
            <div
              className="mb-2.5 rounded-xl p-3 text-[12px] leading-relaxed"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.3)",
                color: clr[2].text,
              }}
            >
              <strong className="mb-1 block">
                ⚠ Needs a human — internal note, not sent to the customer
              </strong>
              {escalation}
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            style={{
              ...inpStyle,
              resize: "vertical",
              fontFamily: "Inter,sans-serif",
              lineHeight: 1.5,
            }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border py-2 text-[13px] font-medium transition-all active:scale-95"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex flex-[2] cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[0].bg},${clr[4].bg})` }}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending..." : "Send Email & Move to Contacted"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CRMLeadsUI({
  leads: initial,
  userId,
  fetchError,
}: {
  leads: any[];
  userId: string;
  fetchError?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [, startTx] = useTransition();
  const [leads, setLeads] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [contactLead, setContactLead] = useState<any>(null);
  const [convertToOrderLead, setConvertToOrderLead] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filteredLeads =
    stageFilter === "all" ? leads : leads.filter((l) => l.stage === stageFilter);

  if (fetchError) {
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        <div className="px-4 py-16 text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h3 className="mb-2 font-syne text-lg font-bold" style={{ color: txt }}>
            Failed to load leads
          </h3>
          <p className="mb-4 text-sm" style={{ color: txt2 }}>
            {fetchError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-xl border-none px-5 py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  async function moveLead(id: string, stage: string) {
    const lead = leads.find((l) => l.id === id);
    const oldStage = STAGES.find((s) => s.id === lead?.stage)?.label || lead?.stage;
    const newStage = STAGES.find((s) => s.id === stage)?.label || stage;
    const activityNote = `\n[${new Date().toISOString()}] Stage changed: ${oldStage} → ${newStage}`;
    const newNotes = (lead?.notes || "") + activityNote;
    const { error } = await supabase
      .from("crm_leads")
      .update({ stage, notes: newNotes })
      .eq("id", id);
    if (error) {
      toast.error("Failed");
      return;
    }
    setLeads((l) => l.map((l) => (l.id === id ? { ...l, stage, notes: newNotes } : l)));
    toast.success(`Moved to ${newStage}`);
  }

  async function addLead(data: any) {
    const { data: lead, error } = await supabase
      .from("crm_leads")
      .insert({ ...data, deal_value: data.deal_value ? parseFloat(data.deal_value) : null })
      .select()
      .single();
    if (error) {
      toast.error("Failed: " + error.message);
      return;
    }
    setLeads((l) => [lead, ...l]);
    setShowAdd(false);
    toast.success("Lead added!");
    startTx(() => router.refresh());
  }

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
          Leads
        </h2>
        <p className="mt-1 text-[12px] sm:text-xs" style={{ color: txt3 }}>
          {leads.length} leads in pipeline ·{" "}
          {leads.filter((l) => !["won", "lost"].includes(l.stage)).length} active
        </p>
      </div>

      {/* Stat row + Add button */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 sm:gap-3 sm:pb-0">
          {[
            { label: "Total Leads", val: leads.length, icon: <Target size={14} />, ci: 0 },
            {
              label: "Active Pipeline",
              val: leads.filter((l) => !["won", "lost"].includes(l.stage)).length,
              icon: <TrendingUp size={14} />,
              ci: 3,
            },
            {
              label: "Won",
              val: leads.filter((l) => l.stage === "won").length,
              icon: <Trophy size={14} />,
              ci: 1,
            },
          ].map((s) => {
            const c = clr[s.ci];
            return (
              <div
                key={s.label}
                className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{ background: c.bgSoft, border: `1px solid ${c.border}` }}
              >
                <span style={{ color: c.icon }}>{s.icon}</span>
                <div>
                  <div
                    className="text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: txt2 }}
                  >
                    {s.label}
                  </div>
                  <div className="font-syne text-base font-bold" style={{ color: c.text }}>
                    {s.val}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl border-none px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95 sm:self-auto"
          style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
        >
          <Plus size={14} /> Add Lead
        </button>
      </div>

      {/* Stage filter tabs */}
      <div className="scrollbar-none mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {[{ id: "all", label: "All Leads", ci: 0 } as any, ...STAGES].map((f) => {
          const fc = f.id === "all" ? clr[0] : clr[STAGES.find((s) => s.id === f.id)!.ci];
          const isActive = stageFilter === f.id;
          const count =
            f.id === "all" ? leads.length : leads.filter((l) => l.stage === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setStageFilter(f.id)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: isActive ? fc.bgSoft : "var(--elevated)",
                borderColor: isActive ? fc.border : "var(--border2)",
                color: isActive ? fc.text : txt2,
              }}
            >
              <span className="text-xs">{f.icon || "📋"}</span>
              <span>{f.label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: isActive ? fc.bgSoft : "var(--elevated)",
                  color: isActive ? fc.text : txt3,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-sm font-medium" style={{ color: txt3 }}>
            {stageFilter === "all" ? "No leads yet." : "No leads in this stage."}
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div
        className="hidden overflow-hidden rounded-2xl sm:block"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="grid border-b px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "minmax(160px,2fr) minmax(160px,1fr) 90px 110px 130px",
            gap: 8,
            background: "var(--elevated)",
            color: txt3,
            borderColor: "var(--border)",
          }}
        >
          <span>Name</span>
          <span>Company / Email</span>
          <span>Source</span>
          <span>Stage</span>
          <span className="text-right">Actions</span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium" style={{ color: txt3 }}>
            {stageFilter === "all"
              ? "No leads yet. New contact form submissions will appear here."
              : "No leads in this stage."}
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const stage = STAGES.find((s) => s.id === lead.stage);
            const sc = clr[stage?.ci ?? 4];
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="grid cursor-pointer items-center transition-colors"
                style={{
                  gridTemplateColumns: "minmax(160px,2fr) minmax(160px,1fr) 90px 110px 130px",
                  gap: 8,
                  padding: "12px 16px",
                  fontSize: 12,
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: sc.bgSoft,
                      color: sc.text,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {getInitials(lead.contact_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: txt }}>
                      {lead.contact_name}
                    </div>
                    {lead.notes && (
                      <div className="max-w-[200px] truncate text-[10px]" style={{ color: txt3 }}>
                        {lead.notes.slice(0, 60)}
                        {lead.notes.length > 60 ? "…" : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium" style={{ color: txt2 }}>
                    {lead.company || "—"}
                  </div>
                  <div className="truncate text-[10px]" style={{ color: txt3 }}>
                    {lead.email || "—"}
                  </div>
                </div>
                <span className="text-[11px] font-medium capitalize" style={{ color: txt2 }}>
                  {lead.source?.replace("_", " ") || "—"}
                </span>
                <span
                  className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}
                >
                  {stage?.icon} {stage?.label}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <select
                    value={lead.stage}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => moveLead(lead.id, e.target.value)}
                    className="max-w-[110px] cursor-pointer rounded-md border px-1.5 py-1 text-[10px] font-medium outline-none"
                    style={{
                      background: "var(--elevated)",
                      color: txt2,
                      borderColor: "var(--border2)",
                    }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <span className="whitespace-nowrap text-[9px]" style={{ color: txt3 }}>
                    {formatDate(lead.created_at, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={addLead} />}
      {selectedLead && !contactLead && !convertToOrderLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onContact={() => {
            setContactLead(selectedLead);
          }}
          onConvertToOrder={() => {
            setConvertToOrderLead(selectedLead);
          }}
        />
      )}
      {contactLead && <ContactLeadModal lead={contactLead} onClose={() => setContactLead(null)} />}
      {convertToOrderLead && (
        <ConvertToOrderModal
          lead={convertToOrderLead}
          onClose={(order) => {
            setConvertToOrderLead(null);
            setSelectedLead(null);
            if (order) {
              setLeads((l) =>
                l.map((l) => (l.id === convertToOrderLead.id ? { ...l, stage: "won" } : l))
              );
              startTx(() => router.refresh());
            }
          }}
        />
      )}
    </div>
  );
}
