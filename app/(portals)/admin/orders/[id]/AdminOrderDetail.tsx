// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ExternalLink, CreditCard,
  FileText, Image as ImageIcon, Package, Clock, User, Building2,
  Copy, Trash2, Upload,
} from "lucide-react";
import Image from "next/image";
import {
  formatDate, formatDateTime, formatFileSize, formatStitchCount,
  STATUS_LABEL, STATUS_CLASS, TURNAROUND_OPTIONS,
  hoursUntilDeadline, slaStatusColor, getInitials,
} from "@/lib/utils";

const STATUSES = ["submitted", "assigned", "in_progress", "review", "approved", "delivered", "revision", "refunded", "cancelled"];

// Bright palette matching dashboard
const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

const CLR = {
  purple: "#5B21B6", purpleBg: "rgba(91,33,182,0.08)",
  cyan: "#0E7490", cyanBg: "rgba(14,116,144,0.08)",
  amber: "#92400E", amberBg: "rgba(146,64,14,0.08)",
  orange: "#9A3412", orangeBg: "rgba(154,52,18,0.08)",
  green: "#047857", greenBg: "rgba(4,120,87,0.08)",
  blue: "#1E40AF", blueBg: "rgba(30,64,175,0.08)",
  red: "#B91C1C", redBg: "rgba(185,28,28,0.08)",
  gray: "#374151", grayBg: "rgba(55,65,81,0.08)",
  dark: "#1F2937", mid: "#4B5563", light: "#6B7280",
};

const inpSelect: React.CSSProperties = {
  background: "var(--elevated)", border: "1px solid var(--border2)",
  borderRadius: 8, color: "var(--txt)", fontSize: 12,
  padding: "8px 12px", outline: "none", cursor: "pointer",
};

// ── Helpers ────────────────────────────────────────────────────

function Section({ title, icon, colorIdx, children }: {
  title: string; icon: React.ReactNode; colorIdx: number; children: React.ReactNode;
}) {
  const clr = CARD_COLORS[colorIdx];
  return (
    <div className="rounded-2xl p-4 sm:p-5 mb-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span style={{ color: clr.icon }}>{icon}</span>
        <h3 className="font-syne font-bold text-sm" style={{ color: "var(--txt)", margin: 0 }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SpecRow({ label, value, mono, highlight }: {
  label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-3 py-2"
      style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-[11px] uppercase tracking-[0.05em] flex-shrink-0" style={{ color: "var(--txt3)" }}>
        {label}
      </span>
      <span className="text-xs text-right"
        style={{
          color: highlight ? CARD_COLORS[2].text : "var(--txt)",
          fontFamily: mono ? "monospace" : "Inter,sans-serif",
          fontWeight: highlight ? 600 : 400,
        }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function FileCard({ file, onPreview, onDelete }: { file: any; onPreview?: (url: string) => void; onDelete?: (id: string) => void }) {
  const isArtwork = file.file_type === "artwork";
  const url = file.signed_url || file.file_url;
  function download() {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  }
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl mb-2"
      style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isArtwork ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" style={{ background:"var(--elevated2)" }}
            onClick={() => onPreview?.(url)}>
            <Image fill src={url} alt={file.file_name} className="object-cover"
              onError={(e:any)=>{ e.target.style.display="none"; }} sizes="(max-width: 768px) 100vw, 800px" />
          </div>
        ) : (
          <span className="flex-shrink-0" style={{ color: "var(--txt2)" }}>
            <FileText size={14} />
          </span>
        )}
        <div className="min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: "var(--txt)" }}>
            {file.file_name}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--txt2)" }}>
            {isArtwork && <span className="mr-2">Artwork</span>}
            {file.format && <span className="mr-2">{file.format}</span>}
            {file.stitch_count && <span className="mr-2">{formatStitchCount(file.stitch_count)} stitches</span>}
            {file.file_size_kb && <span className="mr-2">{formatFileSize(file.file_size_kb)}</span>}
            {file.version > 1 && <span className="mr-2">v{file.version}</span>}
            {file.created_at && <span>{formatDate(file.created_at)}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={download}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-all active:scale-95"
          style={{ background: CARD_COLORS[4].bgSoft, borderColor: CARD_COLORS[4].border, color: CARD_COLORS[4].text }}>
          <Download size={10} /> Download
        </button>
        <button onClick={() => onPreview?.(url)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border transition-all active:scale-95"
          style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>
          <ExternalLink size={10} /> Preview
        </button>
        {onDelete && (
          <button onClick={() => onDelete(file.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border transition-all active:scale-95"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.20)", color: "#B91C1C" }}>
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

function buildTimeline(order: any) {
  const events: { label: string; date: string | null; icon: string; detail?: string }[] = [
    { label: "Order submitted", date: order.created_at, icon: "📋" },
    { label: "Assigned", date: order.assigned_at, icon: "👤", detail: order.designers?.users?.full_name },
    { label: "In progress", date: order.in_progress_at, icon: "🔧" },
    { label: "QA Review", date: order.completed_at, icon: "🔍" },
    { label: "Delivered", date: order.delivered_at, icon: "✅" },
  ];
  if (order.status === "revision") {
    events.splice(4, 0, { label: "Revision requested", date: order.updated_at, icon: "🔄" });
  }
  return events.filter(e => e.date);
}

// ── Main ───────────────────────────────────────────────────────

export function AdminOrderDetail({
  order, designers, editLogs,
}: {
  order: any; designers: any[]; editLogs: any[];
}) {
  const router = useRouter();
  const [, startTx] = useTransition();

  const [statusLoading, setStatusLoading] = useState(false);
  const [designerLoading, setDesignerLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutUrlInput, setCheckoutUrlInput] = useState("");
  const [qaRevisionOpen, setQaRevisionOpen] = useState(false);
  const [qaRevisionNotes, setQaRevisionNotes] = useState("");
  const [qaSaving, setQaSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileDeleting, setFileDeleting] = useState<string | null>(null);
  const [reuploading, setReuploading] = useState(false);

  async function handleDeleteFile(fileId: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setFileDeleting(fileId);
    try {
      const res = await fetch(`/api/admin/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("File deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setFileDeleting(null);
    }
  }

  async function handleReupload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setReuploading(true);
    try {
      const fd = new FormData();
      fd.append("orderId", order.id);
      for (let i = 0; i < files.length; i++) {
        fd.append("files", files[i]);
        fd.append("formats", files[i].name.split(".").pop()?.toUpperCase() || "DST");
      }
      const res = await fetch("/api/upload/output", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(`${files.length} file(s) uploaded`);
      router.refresh();
    } catch {
      toast.error("Re-upload failed");
    } finally {
      setReuploading(false);
    }
  }

  const t = TURNAROUND_OPTIONS[order.turnaround] ?? TURNAROUND_OPTIONS.standard;
  const client = order.clients;
  const clientUser = client?.users;
  const invoice = Array.isArray(order.invoices) ? order.invoices[0] : order.invoices;
  const artworkFiles = (order.order_files ?? []).filter((f: any) => f.file_type === "artwork");
  const outputFiles = (order.order_files ?? []).filter((f: any) => f.file_type === "output");
  const timeline = buildTimeline(order);
  const activeStatuses = ["submitted", "assigned", "in_progress", "review", "approved", "revision"];
  const slaH = hoursUntilDeadline(order.sla_deadline);
  const hasCheckoutUrl = invoice?.payoneer_checkout_url;

  async function updateStatus(newStatus: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(`Status → ${STATUS_LABEL[newStatus] ?? newStatus}`);
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
    finally { setStatusLoading(false); }
  }

  async function assignDesigner(designerId: string) {
    setDesignerLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designer_id: designerId || null, status: designerId ? "assigned" : "submitted" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(designerId ? "Designer assigned" : "Designer unassigned");
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
    finally { setDesignerLoading(false); }
  }

  async function requestRevision() {
    if (!qaRevisionNotes.trim()) { toast.error("Enter revision notes for the designer"); return; }
    setQaSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "revision", admin_notes: qaRevisionNotes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Revision sent to designer");
      setQaRevisionOpen(false); setQaRevisionNotes("");
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
    finally { setQaSaving(false); }
  }

  async function saveCheckoutLink() {
    if (!invoice) return;
    if (!checkoutUrlInput.trim().startsWith("http")) { toast.error("Enter a valid URL starting with http"); return; }
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout_url: checkoutUrlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Payment link saved — client notified");
      setCheckoutModalOpen(false); setCheckoutUrlInput("");
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
    finally { setCheckoutLoading(false); }
  }

  function downloadPDF() {
    if (!invoice) return;
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  }

  async function markReviewed(logId: string) {
    try {
      const res = await fetch(`/api/orders/${order.id}/edit-log`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId, reviewed: true }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Marked as reviewed");
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
  }

  // ── Helper for consistent action button styles ──────
  const actionBtn = (bg: string, border: string, color: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "8px 14px", borderRadius: 12,
    background: bg, border: `1px solid ${border}`,
    color, fontSize: 12, fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div className="portal-content" style={{ background: "var(--bg)", maxWidth: 1100, margin: "0 auto" }}>
      {/* Back button */}
      <button onClick={() => router.push("/admin/orders")}
        className="inline-flex items-center gap-2 py-2.5 px-0 bg-transparent border-none text-sm cursor-pointer mb-4 active:opacity-70 font-semibold"
        style={{ color: CARD_COLORS[4].text }}>
        <ArrowLeft size={14} /> Back to Orders
      </button>

      {/* Header strip */}
      <div className="rounded-2xl p-4 sm:p-5 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {/* Mobile: stacked layout. Desktop: side-by-side */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4">
          {/* Left: order info + controls */}
          <div className="flex-1 min-w-0">
            {/* Top row: order number + badges + price (mobile price inline) */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-bold" style={{ color: "var(--txt)" }}>
                  {order.order_number}
                </span>
                <span className={STATUS_CLASS[order.status]}
                  style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid", display: "inline-block" }}>
                  {STATUS_LABEL[order.status]}
                </span>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}35`,
                }}>
                  {t.icon} {t.label}
                </span>
              </div>
              {/* Price visible on mobile next to badges */}
              <div className="sm:hidden text-right flex-shrink-0">
                <div className="text-xl font-syne font-bold" style={{ color: CARD_COLORS[1].text }}>
                  ${Number(order.price).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Controls row: Status + Designer side by side */}
            <div className="flex flex-row gap-2 sm:gap-3">
              <div className="flex-1 sm:flex-none">
                <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--txt3)" }}>Status</label>
                <select value={order.status} onChange={(e) => updateStatus(e.target.value)} disabled={statusLoading}
                  className={STATUS_CLASS[order.status]}
                  style={{ ...inpSelect, width: "100%", opacity: statusLoading ? 0.6 : 1, fontSize: 13 }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                </select>
              </div>
              <div className="flex-1 sm:flex-none">
                <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--txt3)" }}>Designer</label>
                <select value={order.designers?.id ?? ""} onChange={(e) => assignDesigner(e.target.value)} disabled={designerLoading}
                  style={{ ...inpSelect, width: "100%", opacity: designerLoading ? 0.6 : 1, fontSize: 13 }}>
                  <option value="">— Unassigned —</option>
                  {designers.map((d: any) => <option key={d.id} value={d.id}>{d.users?.full_name ?? d.id}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Desktop: price + invoice on the right */}
          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl font-syne font-bold" style={{ color: CARD_COLORS[1].text }}>
              ${Number(order.price).toFixed(0)}
            </div>
            {invoice && (
              <div className="mt-1 px-2.5 py-1 rounded-full text-[11px] font-medium inline-block"
                style={{
                  background: invoice.status === "paid" ? CARD_COLORS[1].bgSoft : CARD_COLORS[2].bgSoft,
                  color: invoice.status === "paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text,
                  border: `1px solid ${invoice.status === "paid" ? CARD_COLORS[1].border : CARD_COLORS[2].border}`,
                }}>
                {invoice.status === "paid" ? "Paid" : "Pending payment"}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: invoice status below controls */}
        {invoice && (
          <div className="sm:hidden mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-[11px] font-medium" style={{ color: "var(--txt2)" }}>Invoice</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: invoice.status === "paid" ? CARD_COLORS[1].bgSoft : CARD_COLORS[2].bgSoft,
                color: invoice.status === "paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text,
                border: `1px solid ${invoice.status === "paid" ? CARD_COLORS[1].border : CARD_COLORS[2].border}`,
              }}>
              {invoice.status === "paid" ? "✓ Paid" : "Pending payment"}
            </span>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
        {/* ═══ LEFT COLUMN ═══════════════════════════════════ */}
        <div>
          {/* Client card */}
          <Section title="Client" icon={<User size={15} />} colorIdx={3}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})` }}>
                {getInitials(clientUser?.full_name ?? client?.company_name ?? "?")}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--txt)" }}>
                  {clientUser?.full_name ?? "Unknown"}
                </div>
                <div className="text-xs" style={{ color: "var(--txt2)" }}>
                  {client?.company_name ?? ""}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {clientUser?.email && (
                <div className="text-xs font-mono" style={{ color: "var(--txt2)" }}>{clientUser.email}</div>
              )}
              {client?.tier && (
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium w-fit mt-1"
                  style={{
                    background: client.tier === "vip" ? CARD_COLORS[2].bgSoft : client.tier === "active" ? CARD_COLORS[1].bgSoft : CARD_COLORS[3].bgSoft,
                    color: client.tier === "vip" ? CARD_COLORS[2].text : client.tier === "active" ? CARD_COLORS[1].text : CARD_COLORS[3].text,
                    border: `1px solid ${client.tier === "vip" ? CARD_COLORS[2].border : client.tier === "active" ? CARD_COLORS[1].border : CARD_COLORS[3].border}`,
                  }}>
                  {client.tier.toUpperCase()}
                </span>
              )}
              <button onClick={() => router.push(`/admin/clients`)}
                className="inline-flex items-center gap-1 p-0 bg-transparent border-none text-xs cursor-pointer font-medium mt-1.5 w-fit"
                style={{ color: CARD_COLORS[4].text }}>
                <Building2 size={11} /> View all clients →
              </button>
            </div>
          </Section>

          {/* Specifications */}
          <Section title="Specifications" icon={<Package size={15} />} colorIdx={0}>
            {order.design_name && <SpecRow label="Design" value={order.design_name} />}
            <SpecRow label="Service" value={order.service_tiers?.label} />
            <SpecRow label="Category" value={order.service_tiers?.category} />
            <SpecRow label="Size" value={order.service_tiers?.size_desc} />
            <SpecRow label="Output format" value={order.output_format} mono />
            <SpecRow label="Additional formats" value={order.additional_formats?.length ? order.additional_formats.join(", ") : null} mono />
            <SpecRow label="Dimensions" value={order.width_inches && order.height_inches ? `${order.width_inches}" × ${order.height_inches}"` : null} />
            <SpecRow label="Colors" value={order.color_count} />
            <SpecRow label="Stitch count" value={order.stitch_count ? formatStitchCount(order.stitch_count) : null} />
            <SpecRow label="Placement / Notes" value={order.placement_notes} />
            <SpecRow label="Designer" value={order.designers?.users?.full_name} />
            <SpecRow label="Submitted" value={formatDateTime(order.created_at)} />
            <SpecRow
              label="SLA deadline"
              value={
                order.sla_deadline ? (
                  <span className="flex items-center gap-1.5 justify-end">
                    <span>{formatDateTime(order.sla_deadline)}</span>
                    {activeStatuses.includes(order.status) && slaH !== null && (
                      <span className={slaStatusColor(order.sla_deadline)} style={{ fontSize: 11, fontWeight: 600 }}>
                        {slaH < 0 ? `(${Math.abs(slaH)}h overdue)` : slaH === 0 ? "(<1h left)" : `(${slaH}h left)`}
                      </span>
                    )}
                  </span>
                ) : null
              }
              highlight={slaH !== null && slaH < 0}
            />
            <SpecRow label="Assigned at" value={order.assigned_at ? formatDateTime(order.assigned_at) : null} />
            <SpecRow label="In progress at" value={order.in_progress_at ? formatDateTime(order.in_progress_at) : null} />
            <SpecRow label="Completed at" value={order.completed_at ? formatDateTime(order.completed_at) : null} />
            <SpecRow label="Delivered at" value={order.delivered_at ? formatDateTime(order.delivered_at) : null} />
            {order.admin_notes && <SpecRow label="Admin notes" value={order.admin_notes} />}
          </Section>

          {/* Edit History */}
          <Section title="Edit History" icon={<Clock size={15} />} colorIdx={2}>
            {editLogs.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-xs" style={{ color: "var(--txt3)" }}>No client edits recorded</p>
              </div>
            ) : (
              editLogs.map((log: any) => (
                <div key={log.id} className="py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: "var(--txt)" }}>
                        {log.field_name.replace(/_/g, " ")}
                      </span>
                      {!log.reviewed_by_admin && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: CARD_COLORS[2].bgSoft, color: CARD_COLORS[2].text, border: `1px solid ${CARD_COLORS[2].border}` }}>
                          ⚠️ Unreviewed
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] flex-shrink-0 ml-3" style={{ color: "var(--txt3)" }}>
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono mb-1" style={{ color: "var(--txt2)" }}>
                    <span style={{ color: CARD_COLORS[5].text, textDecoration: "line-through" }}>{log.old_value || "—"}</span>
                    {" → "}
                    <span style={{ color: CARD_COLORS[1].text }}>{log.new_value || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                      by {log.changer?.full_name ?? "Client"}
                    </span>
                    {!log.reviewed_by_admin && (
                      <button onClick={() => markReviewed(log.id)}
                        className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-all active:scale-95"
                        style={{ background: CARD_COLORS[1].bgSoft, borderColor: CARD_COLORS[1].border, color: CARD_COLORS[1].text }}>
                        Mark Reviewed
                      </button>
                    )}
                    {log.reviewed_by_admin && (
                      <span className="text-[10px] font-medium" style={{ color: CARD_COLORS[1].text }}>
                        Reviewed by {log.reviewer?.full_name ?? "admin"} {log.reviewed_at ? formatDateTime(log.reviewed_at) : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </Section>
        </div>

        {/* ═══ RIGHT COLUMN ══════════════════════════════════ */}
        <div>
          {/* Artwork Files */}
          <Section title="Artwork Files" icon={<ImageIcon size={15} />} colorIdx={0}>
            {artworkFiles.length > 0 ? (
              artworkFiles.map((f: any) => <FileCard key={f.id} file={f} onPreview={setPreviewImage} onDelete={handleDeleteFile} />)
            ) : (
              <div className="text-center py-5">
                <p className="text-xs" style={{ color: "var(--txt3)" }}>No artwork uploaded</p>
              </div>
            )}
          </Section>

          {/* Output Files */}
          <Section title="Output Files" icon={<FileText size={15} />} colorIdx={1}>
            {outputFiles.length > 0 ? (
              outputFiles.map((f: any) => <FileCard key={f.id} file={f} onPreview={setPreviewImage} onDelete={handleDeleteFile} />)
            ) : (
              <div className="text-center py-5">
                <p className="text-xs" style={{ color: "var(--txt3)" }}>
                  {order.status === "delivered" ? "No output files uploaded" : "Not yet available"}
                </p>
              </div>
            )}
            {/* Admin file actions */}
            <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
                style={{ background: CARD_COLORS[2].bgSoft, border: `1px solid ${CARD_COLORS[2].border}`, color: CARD_COLORS[2].text }}>
                <Upload size={12} /> {reuploading ? "Uploading..." : "Re-upload Files"}
                <input type="file" multiple className="hidden" onChange={handleReupload} disabled={reuploading} />
              </label>
              {outputFiles.length > 0 && (
                <button
                  onClick={async () => {
                    if (!confirm(`Delete all ${outputFiles.length} output file(s)? This cannot be undone.`)) return;
                    for (const f of outputFiles) await handleDeleteFile(f.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all active:scale-95 border"
                  style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.20)", color: "#B91C1C" }}>
                  <Trash2 size={12} /> Delete All ({outputFiles.length})
                </button>
              )}
            </div>
          </Section>

          {/* QA Review — Step 1: Designer submitted */}
          {order.status === "review" && (
            <div className="rounded-2xl p-4 sm:p-5 mb-3"
              style={{ background: "var(--surface)", border: `1px solid ${CARD_COLORS[2].border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔍</span>
                <h3 className="font-syne font-bold text-sm" style={{ color: "var(--txt)" }}>Designer QA</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: CARD_COLORS[2].bgSoft, color: CARD_COLORS[2].text, border: `1px solid ${CARD_COLORS[2].border}` }}>
                  Pending Review
                </span>
              </div>
              <p className="text-xs mb-3.5 leading-relaxed" style={{ color: "var(--txt2)" }}>
                Designer submitted work. Review output files above. Approve internally, or send back with revision notes.
              </p>
              {qaRevisionOpen ? (
                <div className="flex flex-col gap-2">
                  <textarea value={qaRevisionNotes} onChange={e => setQaRevisionNotes(e.target.value)} rows={3}
                    placeholder="Describe what needs to be fixed…"
                    className="w-full rounded-xl p-2.5 text-xs outline-none resize-none box-border"
                    style={{ background: "var(--elevated)", border: "1px solid var(--border2)", color: "var(--txt)", fontFamily: "Inter,sans-serif" }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setQaRevisionOpen(false); setQaRevisionNotes(""); }}
                      className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer border transition-all active:scale-95"
                      style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>Cancel</button>
                    <button onClick={requestRevision} disabled={qaSaving || !qaRevisionNotes.trim()}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all active:scale-95 text-white"
                      style={{
                        background: (!qaRevisionNotes.trim() || qaSaving) ? "var(--border2)" : `linear-gradient(135deg,${CARD_COLORS[2].bg},${CARD_COLORS[5].bg})`,
                        cursor: (!qaRevisionNotes.trim() || qaSaving) ? "not-allowed" : "pointer",
                      }}>
                      {qaSaving ? "Sending…" : "Send Revision →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => updateStatus("approved")} disabled={statusLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95"
                    style={{
                      background: statusLoading ? CARD_COLORS[3].bgSoft : CARD_COLORS[3].bgSoft,
                      borderColor: CARD_COLORS[3].border, color: CARD_COLORS[3].text,
                      cursor: statusLoading ? "not-allowed" : "pointer",
                    }}>
                    ✅ Approve Design
                  </button>
                  <button onClick={() => setQaRevisionOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95"
                    style={{ background: CARD_COLORS[5].bgSoft, borderColor: CARD_COLORS[5].border, color: CARD_COLORS[5].text }}>
                    ↩️ Request Revision
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Revision pending — waiting for designer to re-upload */}
          {order.status === "revision" && (
            <div className="rounded-2xl p-4 sm:p-5 mb-3"
              style={{ background: "var(--surface)", border: `1px solid ${CARD_COLORS[5].border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔄</span>
                <h3 className="font-syne font-bold text-sm" style={{ color: "var(--txt)" }}>Client Revision Requested</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: CARD_COLORS[5].bgSoft, color: CARD_COLORS[5].text, border: `1px solid ${CARD_COLORS[5].border}` }}>
                  Review First
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--txt2)" }}>
                Client requested changes. Review the revision notes below, then assign to the designer when ready.
              </p>
              <button
                onClick={async () => {
                  if (!confirm("Assign this revision to the designer? They will be notified to start working on the changes.")) return;
                  setDesignerLoading(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${order.id}/assign-revision`, { method: "POST" });
                    if (!res.ok) throw new Error();
                    toast.success("Revision assigned to designer");
                    router.refresh();
                  } catch { toast.error("Failed to assign revision"); }
                  finally { setDesignerLoading(false); }
                }}
                disabled={designerLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
                style={{
                  background: designerLoading ? "var(--border2)" : `linear-gradient(135deg, ${CARD_COLORS[5].bg}, ${CARD_COLORS[2].bg})`,
                  cursor: designerLoading ? "not-allowed" : "pointer",
                }}>
                {designerLoading ? "Assigning…" : "↗ Assign to Designer"}
              </button>
            </div>
          )}

          {/* QA Review — Step 2: Release */}
          {order.status === "approved" && (
            <div className="rounded-2xl p-4 sm:p-5 mb-3"
              style={{ background: "var(--surface)", border: `1px solid ${CARD_COLORS[3].border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📦</span>
                <h3 className="font-syne font-bold text-sm" style={{ color: "var(--txt)" }}>Release to Client</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: CARD_COLORS[3].bgSoft, color: CARD_COLORS[3].text, border: `1px solid ${CARD_COLORS[3].border}` }}>
                  Approved — Hidden from Client
                </span>
              </div>
              <p className="text-xs mb-3.5 leading-relaxed" style={{ color: "var(--txt2)" }}>
                Design approved by admin. Client cannot see files yet. Release to make files visible to client.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => updateStatus("delivered")} disabled={statusLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95"
                  style={{
                    background: statusLoading ? CARD_COLORS[1].bgSoft : CARD_COLORS[1].bgSoft,
                    borderColor: CARD_COLORS[1].border, color: CARD_COLORS[1].text,
                    cursor: statusLoading ? "not-allowed" : "pointer",
                  }}>
                  🚀 Release to Client
                </button>
                <button onClick={() => setQaRevisionOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95"
                  style={{ background: CARD_COLORS[5].bgSoft, borderColor: CARD_COLORS[5].border, color: CARD_COLORS[5].text }}>
                  ↩️ Send Back
                </button>
              </div>
              {qaRevisionOpen && (
                <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <textarea value={qaRevisionNotes} onChange={e => setQaRevisionNotes(e.target.value)} rows={2}
                    placeholder="Reason for sending back…"
                    className="w-full rounded-xl p-2 text-xs outline-none resize-none box-border"
                    style={{ background: "var(--elevated)", border: "1px solid var(--border2)", color: "var(--txt)", fontFamily: "Inter,sans-serif" }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setQaRevisionOpen(false); setQaRevisionNotes(""); }}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border transition-all active:scale-95"
                      style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>Cancel</button>
                    <button onClick={requestRevision} disabled={qaSaving || !qaRevisionNotes.trim()}
                      className="flex-[2] py-1.5 rounded-lg text-[11px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
                      style={{
                        background: (!qaRevisionNotes.trim() || qaSaving) ? "var(--border2)" : `linear-gradient(135deg,${CARD_COLORS[2].bg},${CARD_COLORS[5].bg})`,
                        cursor: (!qaRevisionNotes.trim() || qaSaving) ? "not-allowed" : "pointer",
                      }}>
                      {qaSaving ? "Sending…" : "Send Revision →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoice card */}
          {invoice && (
            <Section title="Invoice" icon={<CreditCard size={15} />} colorIdx={3}>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--txt2)" }}>Amount</span>
                  <span className="font-syne font-bold text-base" style={{ color: CARD_COLORS[1].text }}>
                    ${Number(invoice.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--txt2)" }}>Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: invoice.status === "paid" ? CARD_COLORS[1].bgSoft : CARD_COLORS[2].bgSoft,
                      color: invoice.status === "paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text,
                      border: `1px solid ${invoice.status === "paid" ? CARD_COLORS[1].border : CARD_COLORS[2].border}`,
                    }}>
                    {invoice.status}
                  </span>
                </div>
                {invoice.due_at && (
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "var(--txt2)" }}>Due date</span>
                    <span className="text-xs" style={{ color: "var(--txt)" }}>{formatDate(invoice.due_at)}</span>
                  </div>
                )}
                {invoice.paid_at && (
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "var(--txt2)" }}>Paid at</span>
                    <span className="text-xs font-medium" style={{ color: CARD_COLORS[1].text }}>{formatDateTime(invoice.paid_at)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {invoice.status === "pending" && !hasCheckoutUrl && (
                  checkoutModalOpen ? (
                    <div className="flex flex-col gap-1.5 w-full">
                      <input value={checkoutUrlInput} onChange={e => setCheckoutUrlInput(e.target.value)}
                        placeholder="Paste Payoneer payment link…"
                        className="w-full rounded-xl px-3 py-2 text-xs outline-none box-border"
                        style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--txt)" }} />
                      <span className="text-[10px]" style={{ color: "var(--txt3)" }}>Go to Payoneer dashboard → Request a Payment → copy the link</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setCheckoutModalOpen(false); setCheckoutUrlInput(""); }}
                          className="flex-1 py-1.5 rounded-xl text-xs font-medium cursor-pointer border transition-all active:scale-95"
                          style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>Cancel</button>
                        <button onClick={saveCheckoutLink} disabled={checkoutLoading}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
                          style={{ background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})`, opacity: checkoutLoading ? 0.6 : 1 }}>
                          {checkoutLoading ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setCheckoutModalOpen(true); setCheckoutUrlInput(""); }}
                      style={actionBtn(CARD_COLORS[4].bgSoft, CARD_COLORS[4].border, CARD_COLORS[4].text)}>
                      <CreditCard size={12} /> Create Checkout
                    </button>
                  )
                )}
                {hasCheckoutUrl && invoice.status === "pending" && (
                  <>
                    <button onClick={() => { navigator.clipboard.writeText(invoice.payoneer_checkout_url); toast.success("Checkout URL copied!"); }}
                      style={actionBtn(CARD_COLORS[3].bgSoft, CARD_COLORS[3].border, CARD_COLORS[3].text)}>
                      <Copy size={12} /> Copy Link
                    </button>
                    <a href={invoice.payoneer_checkout_url} target="_blank" rel="noreferrer">
                      <button style={actionBtn(CARD_COLORS[1].bgSoft, CARD_COLORS[1].border, CARD_COLORS[1].text)}>
                        <ExternalLink size={12} /> Open
                      </button>
                    </a>
                  </>
                )}
                <button onClick={downloadPDF}
                  style={actionBtn("var(--elevated)", "var(--border2)", "var(--txt2)")}>
                  <FileText size={12} /> PDF
                </button>
              </div>
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline" icon={<Clock size={15} />} colorIdx={4}>
            {timeline.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-xs" style={{ color: "var(--txt3)" }}>No events yet</p>
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-1 bottom-1 w-0.5" style={{ background: "var(--border2)" }} />
                {timeline.map((evt, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full"
                      style={{
                        background: i === timeline.length - 1
                          ? `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[3].bg})`
                          : "var(--border2)",
                        border: i === timeline.length - 1
                          ? `2px solid ${CARD_COLORS[4].border}`
                          : `2px solid var(--border2)`,
                        boxShadow: i === timeline.length - 1 ? `0 0 8px ${CARD_COLORS[4].border}` : "none",
                      }} />
                    <div className="text-[10px] mb-0.5" style={{ color: "var(--txt3)" }}>
                      {evt.date ? formatDateTime(evt.date) : ""}
                    </div>
                    <div className="text-xs font-medium" style={{ color: "var(--txt)" }}>
                      {evt.icon} {evt.label}
                      {evt.detail && (
                        <span style={{ color: "var(--txt2)", fontWeight: 400 }}> — {evt.detail}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Preview overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.85)" }}
          onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl z-10"
            style={{ background:"rgba(255,255,255,0.1)", border:"none", cursor:"pointer" }}>×</button>
          <Image src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}/>
        </div>
      )}
    </div>
  );
}
