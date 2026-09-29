// @ts-nocheck
"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  RefreshCw,
  Star,
  Image as ImageIcon,
  FileText,
  Upload,
  ChevronDown,
  Settings,
  MessageSquare,
} from "lucide-react";
import {
  formatDate,
  formatFileSize,
  formatStitchCount,
  formatCurrency,
  STATUS_LABEL,
  STATUS_CLASS,
  TURNAROUND_OPTIONS,
  hoursUntilDeadline,
  slaStatusColor,
} from "@/lib/utils";
import NextImage from "next/image";

const FMTS = [
  "DST",
  "PES",
  "EMB",
  "JEF",
  "XXX",
  "VIP",
  "HUS",
  "EXP",
  "VP3",
  "SEW",
  "AI",
  "SVG",
  "EPS",
  "PDF",
];
const EDITABLE_STATUSES = [
  "submitted",
  "assigned",
  "in_progress",
  "review",
  "approved",
  "revision",
];

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";
const CLR = {
  purple: {
    bg: "#8B5CF6",
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
  },
  green: {
    bg: "#10B981",
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
  },
  orange: {
    bg: "#F97316",
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
  },
  cyan: {
    bg: "#06B6D4",
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
  },
};
const inp = {
  width: "100%",
  background: "var(--elevated)",
  border: "1px solid var(--border2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: txt,
  fontSize: 14,
  outline: "none",
  fontFamily: "Inter,sans-serif",
  boxSizing: "border-box",
};

function StarRating({ value, onChange }: any) {
  const [hover, setHover] = useState(0);
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer select-none text-[26px] transition-all"
            style={{ color: (hover || value) >= i ? "#F59E0B" : "#D1D5DB" }}
          >
            ★
          </span>
        ))}
      </div>
      {(hover || value) > 0 && (
        <span className="text-[13px] font-semibold" style={{ color: "#F59E0B" }}>
          {LABELS[hover || value]}
        </span>
      )}
    </div>
  );
}

function StatusTimeline({ status }: any) {
  const steps = ["submitted", "assigned", "in_progress", "review", "delivered"];
  const labels = ["Submitted", "Assigned", "Working", "QA", "Delivered"];
  const idx = steps.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="flex items-start">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center">
          <div className="flex flex-1 flex-col items-center">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-[18px] sm:w-[18px]"
              style={{
                background:
                  i <= idx
                    ? "linear-gradient(135deg," + CLR.purple.icon + "," + CLR.cyan.icon + ")"
                    : "var(--border2)",
              }}
            >
              {i < idx ? "✓" : i === idx ? "●" : "○"}
            </div>
            <span
              className="mt-1 whitespace-nowrap text-center text-[9px] sm:text-[10px]"
              style={{ color: i <= idx ? txt2 : txt3, fontWeight: i === idx ? 600 : 400 }}
            >
              {labels[i]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="mb-4 h-0.5 flex-1"
              style={{ background: i < idx ? CLR.purple.icon : "var(--border)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, icon, color, children }: any) {
  return (
    <div
      className="mb-3 rounded-2xl p-4 sm:p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span style={{ color }}>{icon}</span>
        <h3 className="font-syne text-sm font-bold" style={{ color: txt }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SpecRow({ label, value, mono }: any) {
  return (
    <div className="py-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span
        className="mb-0.5 block text-[10px] uppercase tracking-[0.05em] sm:text-[11px]"
        style={{ color: txt3 }}
      >
        {label}
      </span>
      <div
        className="text-[13px]"
        style={{ color: txt, fontFamily: mono ? "monospace" : "Inter,sans-serif" }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function FileCard({ file, icon, onPreview, onDownload }: any) {
  const isArtwork = file.file_type === "artwork";
  const url = file.signed_url || file.file_url;
  return (
    <div
      className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
      style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isArtwork ? (
          <div
            className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg"
            style={{ background: "var(--elevated2)" }}
            onClick={() => onPreview?.(url)}
          >
            <NextImage
              fill
              src={url}
              alt={file.file_name}
              className="object-cover"
              onError={(e: any) => {
                e.target.style.display = "none";
              }}
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        ) : (
          <span className="flex-shrink-0" style={{ color: txt2 }}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium" style={{ color: txt }}>
            {file.file_name}
          </div>
          <div className="mt-0.5 text-[10px]" style={{ color: txt2 }}>
            {isArtwork && <span className="mr-2">Artwork</span>}
            {file.format && <span className="mr-2">{file.format}</span>}
            {file.stitch_count && (
              <span className="mr-2">{formatStitchCount(file.stitch_count)} stitches</span>
            )}
            {file.file_size_kb && <span>{formatFileSize(file.file_size_kb)}</span>}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDownload?.(url, file.file_name)}
        className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
        style={{
          background: CLR.purple.bgSoft,
          borderColor: CLR.purple.border,
          color: CLR.purple.text,
        }}
      >
        <Download size={11} /> Download
      </button>
    </div>
  );
}

export function OrderDetail({ order, userId, clientId, orderMessages }: any) {
  const router = useRouter();
  const supabase = createClient();
  const [, startTx] = useTransition();
  const [reviewing, setReviewing] = useState(false);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  function downloadFile(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  }
  // Fetch review from DB + localStorage on mount
  useEffect(() => {
    // Check server data first
    if (order.reviews?.length > 0) {
      setSubmittedReview(order.reviews[0]);
      return;
    }
    // Check localStorage fallback
    try {
      var s = localStorage.getItem("review_" + order.id);
      if (s) {
        setSubmittedReview(JSON.parse(s));
        return;
      }
    } catch {}
    // Direct DB query as final fallback
    supabase
      .from("reviews")
      .select("id,stars,text")
      .eq("order_id", order.id)
      .maybeSingle()
      .then(function (r) {
        if (r.data) setSubmittedReview(r.data);
      });
  }, []);
  const fileRef = useRef<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editFmt, setEditFmt] = useState(order.output_format ?? "DST");
  const [editExtras, setEditExtras] = useState(order.additional_formats ?? []);
  const [editW, setEditW] = useState(order.width_inches?.toString() ?? "");
  const [editH, setEditH] = useState(order.height_inches?.toString() ?? "");
  const [editCol, setEditCol] = useState(order.color_count?.toString() ?? "");
  const [editNotes, setEditNotes] = useState(order.placement_notes ?? "");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const canEdit = EDITABLE_STATUSES.includes(order.status);
  const [editLogs, setEditLogs] = useState<any[]>([]);
  const [editLogsLoaded, setEditLogsLoaded] = useState(false);
  useEffect(() => {
    supabase
      .from("order_edit_log")
      .select(
        "id,field_name,old_value,new_value,created_at,changed_by,reviewed_by_admin,changer:changed_by(full_name)"
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .then(function (r) {
        setEditLogs(r.data || []);
        setEditLogsLoaded(true);
      });
  }, []);

  const t = TURNAROUND_OPTIONS[order.turnaround] ?? TURNAROUND_OPTIONS.standard;
  const artworkFiles = (order.order_files ?? []).filter((f: any) => f.file_type === "artwork");
  const outputFiles = (order.order_files ?? []).filter((f: any) => f.file_type === "output");
  const invoice = Array.isArray(order.invoices) ? order.invoices[0] : order.invoices;
  const activeStatuses = ["submitted", "assigned", "in_progress", "review", "approved"];
  const slaH = hoursUntilDeadline(order.sla_deadline);
  const showOutputs = order.status === "delivered" && invoice?.status === "paid";
  const hasReview = submittedReview ?? order.reviews?.length > 0;
  const canReview = order.status === "delivered" && !hasReview;

  async function submitReview() {
    if (!stars) {
      toast.error("Select a star rating");
      return;
    }
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          order_id: order.id,
          client_id: clientId,
          stars,
          text: reviewText.trim() || null,
          is_published: true,
        })
        .select("id,stars,text")
        .single();
      if (error) {
        toast.error("Failed: " + error.message);
        return;
      }
      setSubmittedReview(data);
      setReviewing(false);
      setStars(0);
      setReviewText("");
      try {
        localStorage.setItem("review_" + order.id, JSON.stringify(data));
      } catch {}
      fetch("/api/review-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          stars,
          clientName: order.clients?.users?.full_name,
        }),
      }).catch(function () {});
      toast.success("Review submitted!");
      startTx(() => router.refresh());
    } finally {
      setSubmittingReview(false);
    }
  }

  async function saveEdits() {
    setEditSaving(true);
    try {
      const updates: any = {};
      const changed: string[] = [];
      if (editFmt !== order.output_format) {
        updates.output_format = editFmt;
        changed.push("output_format");
      }
      const origExtras = order.additional_formats ?? [];
      if (JSON.stringify(editExtras.sort()) !== JSON.stringify([...origExtras].sort())) {
        updates.additional_formats = editExtras.length ? editExtras : null;
        changed.push("additional_formats");
      }
      const newW = editW ? parseFloat(editW) : null;
      if (newW !== (order.width_inches ?? null)) {
        updates.width_inches = newW;
        changed.push("width_inches");
      }
      const newH = editH ? parseFloat(editH) : null;
      if (newH !== (order.height_inches ?? null)) {
        updates.height_inches = newH;
        changed.push("height_inches");
      }
      const newCol = editCol ? parseInt(editCol) : null;
      if (newCol !== (order.color_count ?? null)) {
        updates.color_count = newCol;
        changed.push("color_count");
      }
      if (editNotes !== (order.placement_notes ?? "")) {
        updates.placement_notes = editNotes || null;
        changed.push("placement_notes");
      }
      let newFileRecord = null;
      if (editFile) {
        const fd = new FormData();
        fd.append("orderId", order.id);
        fd.append("files", editFile);
        const res = await fetch("/api/upload/artwork", { method: "POST", body: fd });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          toast.error(e.error || "Upload failed");
          return;
        }
        const { files: uploaded } = await res.json();
        newFileRecord = uploaded?.[0] || null;
        changed.push("artwork_file");
      }
      if (changed.length === 0) {
        toast.error("No changes detected");
        return;
      }
      // Spec fields save server-side. Writing to `orders` from the browser never
      // worked: the only UPDATE policy a client holds is orders_client_cancel,
      // whose WITH CHECK (status = 'cancelled') rejected every spec edit — so this
      // always failed with an RLS error and the edit log was never written either.
      if (Object.keys(updates).length > 0) {
        const res = await fetch(`/api/orders/${order.id}/edit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            output_format: editFmt,
            additional_formats: editExtras.length ? editExtras : null,
            width_inches: editW ? parseFloat(editW) : null,
            height_inches: editH ? parseFloat(editH) : null,
            color_count: editCol ? parseInt(editCol) : null,
            placement_notes: editNotes || null,
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(result?.error || "Could not save changes");
          return;
        }
        if (result?.teamNotified === false) {
          toast.warning(
            "Changes saved, but our team was not notified automatically — please message us about this order."
          );
          setEditOpen(false);
          startTx(() => router.refresh());
          return;
        }
      }
      const editLogRows = changed
        .filter((f) => f !== "artwork_file")
        .map((field) => ({
          order_id: order.id,
          field_name: field,
          old_value:
            field === "output_format"
              ? order.output_format
              : field === "additional_formats"
                ? JSON.stringify(order.additional_formats ?? [])
                : field === "width_inches"
                  ? String(order.width_inches ?? "")
                  : field === "height_inches"
                    ? String(order.height_inches ?? "")
                    : field === "color_count"
                      ? String(order.color_count ?? "")
                      : field === "placement_notes"
                        ? (order.placement_notes ?? "")
                        : "",
          new_value:
            field === "output_format"
              ? editFmt
              : field === "additional_formats"
                ? JSON.stringify(editExtras)
                : field === "width_inches"
                  ? editW
                  : field === "height_inches"
                    ? editH
                    : field === "color_count"
                      ? editCol
                      : field === "placement_notes"
                        ? editNotes
                        : "",
          changed_by: userId,
          reviewed_by_admin: false,
        }));
      // Only the artwork entry is logged here; spec-field rows are written by the
      // server route from the values it read itself.
      if (editFile) {
        const { error: logErr } = await supabase.from("order_edit_log").insert([
          {
            order_id: order.id,
            field_name: "artwork_file",
            old_value: "",
            new_value: editFile.name,
            changed_by: userId,
            reviewed_by_admin: false,
          },
        ]);
        if (logErr) {
          toast.warning(
            "Artwork uploaded, but the change log could not be written — please message us about this order."
          );
          setEditOpen(false);
          startTx(() => router.refresh());
          return;
        }
      }
      // Note: admin/designer notifications for edits are handled server-side via order_edit_log
      toast.success("Changes saved — team notified");
      setEditOpen(false);
      startTx(() => router.refresh());
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div
      className="flex w-full flex-1 flex-col overflow-y-auto"
      style={{ background: "var(--bg)", padding: "12px 10px 24px 10px" }}
    >
      <div className="w-full lg:mx-auto lg:max-w-[860px]">
        {/* Back button — top center */}
        <button
          onClick={() => router.push("/client/my-orders")}
          className="mx-auto mb-3 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-0 py-2 text-sm font-semibold active:opacity-70"
          style={{ color: CLR.purple.text }}
        >
          <ArrowLeft size={15} /> Back to My Orders
        </button>

        {/* Header with gradient + quick info tabs */}
        <div className="mb-3 text-center">
          <h2
            className="font-syne text-xl font-bold sm:text-2xl"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {order.order_number}
          </h2>
          <p className="mt-0.5 text-[12px] sm:text-xs" style={{ color: txt2 }}>
            {t.icon} {t.label} · {t.time}
          </p>
        </div>

        {/* Status card */}
        <div
          className="mb-3 rounded-2xl p-3.5 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Row 1: Status badges + Price */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={STATUS_CLASS[order.status]}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid",
                }}
              >
                {STATUS_LABEL[order.status]}
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${t.color}18`,
                  color: t.color,
                  border: `1px solid ${t.color}35`,
                }}
              >
                {t.icon} {t.label}
              </span>
            </div>
            <span
              className="font-syne text-xl font-bold sm:text-2xl"
              style={{ color: CLR.green.text }}
            >
              ${Number(order.price).toFixed(0)}
            </span>
          </div>
          {/* Row 2: Info chips */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: CLR.purple.bgSoft,
                color: CLR.purple.text,
                borderColor: CLR.purple.border,
              }}
            >
              {order.service_tiers?.label}
            </span>
            <span
              className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: CLR.cyan.bgSoft,
                color: CLR.cyan.text,
                borderColor: CLR.cyan.border,
              }}
            >
              {order.service_tiers?.size_desc}
            </span>
            <span
              className="rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold"
              style={{
                background: CLR.green.bgSoft,
                color: CLR.green.text,
                borderColor: CLR.green.border,
              }}
            >
              {order.output_format}
            </span>
            {order.design_name && (
              <span
                className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: "var(--elevated)",
                  color: txt2,
                  borderColor: "var(--border2)",
                }}
              >
                {order.design_name}
              </span>
            )}
          </div>
        </div>

        {/* Progress — compact */}
        <div
          className="mb-3 rounded-2xl p-3.5 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <StatusTimeline status={order.status} />
        </div>

        {/* Pay + Chat actions */}
        {invoice?.status === "pending" && invoice.payoneer_checkout_url && (
          <div
            className="mb-3 rounded-2xl border p-3.5 text-center"
            style={{ background: CLR.purple.bgSoft, borderColor: CLR.purple.border }}
          >
            <a href={invoice.payoneer_checkout_url} target="_blank" rel="noreferrer">
              <button
                className="w-full cursor-pointer rounded-xl border-none py-2.5 text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                }}
              >
                Pay ${Number(invoice.amount).toFixed(0)} via Payoneer →
              </button>
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            {/* Specs — compact on mobile, only show key fields */}
            <div
              className="mb-3 rounded-2xl p-3.5 sm:p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-2.5 font-syne text-[13px] font-bold sm:text-sm"
                style={{ color: txt }}
              >
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                {order.design_name && (
                  <>
                    <span style={{ color: txt3 }}>Design</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {order.design_name}
                    </span>
                  </>
                )}
                <span style={{ color: txt3 }}>Service</span>
                <span className="text-right font-medium" style={{ color: txt }}>
                  {order.service_tiers?.label}
                </span>
                <span style={{ color: txt3 }}>Size</span>
                <span className="text-right font-medium" style={{ color: txt }}>
                  {order.service_tiers?.size_desc}
                </span>
                <span style={{ color: txt3 }}>Format</span>
                <span className="text-right font-mono font-medium" style={{ color: txt }}>
                  {order.output_format}
                </span>
                {order.additional_formats?.length > 0 && (
                  <>
                    <span style={{ color: txt3 }}>Extra</span>
                    <span className="text-right font-mono font-medium" style={{ color: txt }}>
                      {order.additional_formats.join(", ")}
                    </span>
                  </>
                )}
                {order.width_inches && order.height_inches && (
                  <>
                    <span style={{ color: txt3 }}>Dimensions</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {order.width_inches}" × {order.height_inches}"
                    </span>
                  </>
                )}
                {order.color_count > 0 && (
                  <>
                    <span style={{ color: txt3 }}>Colors</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {order.color_count}
                    </span>
                  </>
                )}
                {order.stitch_count > 0 && (
                  <>
                    <span style={{ color: txt3 }}>Stitches</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {formatStitchCount(order.stitch_count)}
                    </span>
                  </>
                )}
                {order.placement_notes && (
                  <>
                    <span style={{ color: txt3 }}>Notes</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {order.placement_notes}
                    </span>
                  </>
                )}
                {order.designers?.users?.full_name && (
                  <>
                    <span style={{ color: txt3 }}>Designer</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {order.designers.users.full_name}
                    </span>
                  </>
                )}
                {order.sla_deadline && (
                  <>
                    <span style={{ color: txt3 }}>Deadline</span>
                    <span className="flex items-center justify-end gap-1 text-right font-medium">
                      {formatDate(order.sla_deadline)}
                      {activeStatuses.includes(order.status) && slaH !== null && (
                        <span
                          className={slaStatusColor(order.sla_deadline)}
                          style={{ fontSize: 10, fontWeight: 600 }}
                        >
                          {slaH < 0 ? `${Math.abs(slaH)}h late` : slaH === 0 ? "<1h" : `${slaH}h`}
                        </span>
                      )}
                    </span>
                  </>
                )}
                <span style={{ color: txt3 }}>Turnaround</span>
                <span className="text-right font-medium" style={{ color: txt }}>
                  {t.icon} {t.label} · {t.time}
                </span>
                {order.created_at && (
                  <>
                    <span style={{ color: txt3 }}>Placed</span>
                    <span className="text-right font-medium" style={{ color: txt }}>
                      {formatDate(order.created_at)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Artwork */}
            <div
              className="mb-3 rounded-2xl p-3.5 sm:p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-2.5 flex items-center gap-2 font-syne text-[13px] font-bold sm:text-sm"
                style={{ color: txt }}
              >
                <ImageIcon size={14} style={{ color: CLR.cyan.icon }} /> Artwork
              </h3>
              {artworkFiles.length > 0 ? (
                artworkFiles.map((f: any) => (
                  <FileCard
                    key={f.id}
                    file={f}
                    icon={<ImageIcon size={14} />}
                    onPreview={setPreviewImage}
                    onDownload={downloadFile}
                  />
                ))
              ) : (
                <p className="py-4 text-center text-xs" style={{ color: txt3 }}>
                  No artwork uploaded
                </p>
              )}
            </div>

            {/* Output — grouped by version */}
            <div
              className="mb-3 rounded-2xl p-3.5 sm:p-5 lg:mb-0"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-2.5 flex items-center gap-2 font-syne text-[13px] font-bold sm:text-sm"
                style={{ color: txt }}
              >
                <Download size={14} style={{ color: CLR.green.icon }} /> Downloads
              </h3>
              {showOutputs ? (
                outputFiles.length > 0 ? (
                  (() => {
                    // Group output files by version
                    const grouped = new Map<number, any[]>();
                    for (const f of outputFiles) {
                      const v = f.version ?? 1;
                      if (!grouped.has(v)) grouped.set(v, []);
                      grouped.get(v)!.push(f);
                    }
                    const sortedVersions = [...grouped.keys()].sort((a, b) => b - a);
                    return sortedVersions.map((v) => {
                      const files = grouped.get(v)!;
                      const label = v === 1 ? "Original" : `Revision ${v - 1}`;
                      const isRevision = v > 1;
                      return (
                        <div
                          key={v}
                          className={v > 1 ? "mt-3 pt-3" : ""}
                          style={v > 1 ? { borderTop: "1px solid var(--border)" } : {}}
                        >
                          <h4
                            className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold"
                            style={{ color: isRevision ? CLR.orange.text : CLR.green.text }}
                          >
                            {isRevision ? <RefreshCw size={12} /> : <CheckCircle size={12} />}
                            {label}
                            {isRevision && (
                              <span
                                className="rounded border px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  background: CLR.orange.bgSoft,
                                  color: CLR.orange.text,
                                  borderColor: CLR.orange.border,
                                }}
                              >
                                Updated
                              </span>
                            )}
                          </h4>
                          {files.map((f: any) => (
                            <FileCard
                              key={f.id}
                              file={f}
                              icon={<FileText size={14} />}
                              onPreview={setPreviewImage}
                              onDownload={downloadFile}
                            />
                          ))}
                        </div>
                      );
                    });
                  })()
                ) : (
                  <p className="py-4 text-center text-xs" style={{ color: txt3 }}>
                    Files being prepared…
                  </p>
                )
              ) : (
                <p className="py-4 text-center text-xs" style={{ color: txt3 }}>
                  {order.status === "delivered" && invoice?.status !== "paid"
                    ? "Complete payment to unlock"
                    : "Available after delivery"}
                </p>
              )}
            </div>

            {/* Revision Messages */}
            {orderMessages?.length > 0 && (
              <div
                className="mb-3 rounded-2xl p-3.5 sm:p-5 lg:mb-0"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-2.5 flex items-center gap-2 font-syne text-[13px] font-bold sm:text-sm"
                  style={{ color: txt }}
                >
                  <MessageSquare size={14} style={{ color: CLR.orange.icon }} /> Revision Messages
                </h3>
                {orderMessages.map((msg: any) => {
                  const isMe = msg.sender?.id === userId;
                  return (
                    <div
                      key={msg.id}
                      className="mb-2 rounded-xl p-3"
                      style={{
                        background: isMe ? CLR.purple.bgSoft : "var(--elevated)",
                        border: `1px solid ${isMe ? CLR.purple.border : "var(--border)"}`,
                      }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: isMe ? CLR.purple.text : CLR.orange.text }}
                        >
                          {isMe ? "You" : msg.sender?.full_name || "Support"}
                          {msg.sender?.role === "admin" && (
                            <span
                              className="ml-1 rounded px-1.5 py-0.5 text-[9px]"
                              style={{ background: CLR.orange.bgSoft, color: CLR.orange.text }}
                            >
                              Admin
                            </span>
                          )}
                        </span>
                        <span className="text-[10px]" style={{ color: txt3 }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p
                        className="whitespace-pre-wrap text-[12px] leading-relaxed"
                        style={{ color: txt2 }}
                      >
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Edit History */}
            {editLogs.length > 0 && (
              <div
                className="mb-3 rounded-2xl p-3.5 sm:p-5 lg:mb-0"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-2.5 font-syne text-[13px] font-bold sm:text-sm"
                  style={{ color: txt }}
                >
                  Edit History
                </h3>
                {editLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold capitalize" style={{ color: txt }}>
                        {log.field_name?.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px]" style={{ color: txt3 }}>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <div className="font-mono text-[11px]" style={{ color: txt2 }}>
                      <span style={{ color: "#BE185D", textDecoration: "line-through" }}>
                        {log.old_value || "—"}
                      </span>
                      {" → "}
                      <span style={{ color: CLR.green.text }}>{log.new_value || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Edit order */}
            {canEdit && (
              <Section title="Edit Order" icon={<Settings size={15} />} color={CLR.orange.icon}>
                <button
                  onClick={() => setEditOpen(!editOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border bg-transparent px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: "var(--elevated)",
                    borderColor: "var(--border2)",
                    color: txt2,
                  }}
                >
                  <span className="text-[13px] font-semibold">
                    Change format, dimensions, artwork
                  </span>
                  <ChevronDown
                    size={15}
                    style={{
                      color: txt3,
                      transform: editOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {editOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3 }}
                        >
                          Format
                        </label>
                        <select
                          value={editFmt}
                          onChange={(e) => setEditFmt(e.target.value)}
                          style={{ ...inp, cursor: "pointer" }}
                        >
                          {FMTS.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3 }}
                        >
                          Extra Formats
                        </label>
                        <select
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v && !editExtras.includes(v)) setEditExtras((p: any) => [...p, v]);
                            e.target.value = "";
                          }}
                          style={{ ...inp, cursor: "pointer" }}
                        >
                          <option value="">+ Add</option>
                          {FMTS.filter((f) => f !== editFmt && !editExtras.includes(f)).map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                        {editExtras.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {editExtras.map((f: any) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px]"
                                style={{
                                  background: CLR.green.bgSoft,
                                  color: CLR.green.text,
                                  borderColor: CLR.green.border,
                                }}
                              >
                                {f}
                                <span
                                  onClick={() =>
                                    setEditExtras((p: any) => p.filter((x: any) => x !== f))
                                  }
                                  className="ml-0.5 cursor-pointer opacity-70"
                                >
                                  ×
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3 }}
                        >
                          Width (in)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editW}
                          onChange={(e) => setEditW(e.target.value)}
                          placeholder="3.5"
                          style={inp}
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3 }}
                        >
                          Height (in)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editH}
                          onChange={(e) => setEditH(e.target.value)}
                          placeholder="3.5"
                          style={inp}
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3 }}
                        >
                          Colors
                        </label>
                        <input
                          type="number"
                          value={editCol}
                          onChange={(e) => setEditCol(e.target.value)}
                          placeholder="1"
                          style={inp}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: txt3 }}
                      >
                        Placement Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        style={{ ...inp, resize: "none" }}
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: txt3 }}
                      >
                        Replace Artwork
                      </label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setEditFile(f);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full cursor-pointer rounded-xl border-2 border-dashed bg-transparent py-3 text-center text-[13px] transition-colors"
                        style={{
                          borderColor: editFile ? CLR.green.icon : "var(--border2)",
                          color: editFile ? CLR.green.text : txt2,
                          background: editFile ? CLR.green.bgSoft : "transparent",
                        }}
                      >
                        {editFile ? editFile.name : "Click to upload new artwork"}
                      </button>
                    </div>
                    <button
                      onClick={saveEdits}
                      disabled={editSaving}
                      className="w-full cursor-pointer rounded-xl border-none py-2.5 text-[13px] font-semibold text-white"
                      style={{
                        background: editSaving
                          ? "var(--border2)"
                          : `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                      }}
                    >
                      {editSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </Section>
            )}

            {/* Help + Message tabs */}
            <div
              className="mb-3 rounded-2xl p-3.5 sm:p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-2.5 font-syne text-[13px] font-bold sm:text-sm"
                style={{ color: txt }}
              >
                Need help?
              </h3>
              <p className="mb-3 text-[12px]" style={{ color: txt2 }}>
                Have questions about your order? Message our support team — we typically reply
                within 1 hour.
              </p>
              <Link
                href={`/client/messages?order=${order.id}`}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none px-4 py-2.5 text-[13px] font-semibold text-white no-underline transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                }}
              >
                <MessageSquare size={15} /> Message Support
              </Link>
            </div>

            {/* Pay button */}
            {invoice?.status === "pending" && invoice.payoneer_checkout_url && (
              <div
                className="mb-3 rounded-2xl p-4 text-center sm:p-5"
                style={{ background: CLR.purple.bgSoft, border: `1px solid ${CLR.purple.border}` }}
              >
                <p className="mb-2 text-sm font-semibold" style={{ color: CLR.purple.text }}>
                  Payment ready
                </p>
                <a href={invoice.payoneer_checkout_url} target="_blank" rel="noreferrer">
                  <button
                    className="cursor-pointer rounded-xl border-none px-6 py-2.5 text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                    }}
                  >
                    Pay ${Number(invoice.amount).toFixed(0)} via Payoneer →
                  </button>
                </a>
              </div>
            )}

            {/* Review */}
            {hasReview && !reviewing && (
              <Section title="Your Review" icon={<Star size={15} />} color="#F59E0B">
                <div className="mb-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="text-lg"
                      style={{
                        color:
                          i <= (submittedReview || order.reviews[0]).stars ? "#F59E0B" : "#D1D5DB",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-[13px]" style={{ color: txt2 }}>
                  {(submittedReview || order.reviews[0]).text || "No comment"}
                </p>
              </Section>
            )}
            {canReview && !reviewing && (
              <Section title="Leave a Review" icon={<Star size={15} />} color="#F59E0B">
                <button
                  onClick={() => setReviewing(true)}
                  className="w-full cursor-pointer rounded-xl border-none py-2.5 text-[13px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                  }}
                >
                  Write a Review ⭐
                </button>
              </Section>
            )}
            {reviewing && (
              <Section title="Your Review" icon={<Star size={15} />} color="#F59E0B">
                <div className="mb-3">
                  <StarRating value={stars} onChange={setStars} />
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="Stitch quality, turnaround, communication…"
                  className="mb-3 box-border w-full resize-none rounded-xl border p-3 text-sm outline-none"
                  style={{
                    background: "var(--elevated)",
                    borderColor: "var(--border2)",
                    color: txt,
                    fontFamily: "Inter,sans-serif",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReviewing(false);
                      setStars(0);
                      setReviewText("");
                    }}
                    className="flex-1 cursor-pointer rounded-xl border py-2.5 text-[13px] font-medium"
                    style={{
                      background: "var(--elevated)",
                      color: txt2,
                      borderColor: "var(--border2)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={!stars || submittingReview}
                    className="flex-[2] cursor-pointer rounded-xl border-none py-2.5 text-[13px] font-semibold text-white"
                    style={{
                      background: !stars
                        ? "var(--border2)"
                        : `linear-gradient(135deg,${CLR.purple.bg},${CLR.purple.icon})`,
                      cursor: !stars ? "not-allowed" : "pointer",
                    }}
                  >
                    {submittingReview ? "Submitting…" : "Submit Review ⭐"}
                  </button>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Preview overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl text-white"
            style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer" }}
          >
            ×
          </button>
          <NextImage
            src={previewImage}
            alt="Preview"
            width={1200}
            height={900}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
