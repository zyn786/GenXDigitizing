// @ts-nocheck
"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  ClipboardList,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import NextImage from "next/image";

const OUTPUT_FORMATS = [
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

const ALLOWED_ACCEPT =
  ".dst,.pes,.emb,.jef,.xxx,.vip,.hus,.exp,.vp3,.cnd,.tap,.png,.jpg,.jpeg,.webp,.pdf,.svg,.ai,.eps,.zip";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 20;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fileFingerprint(f: File): string {
  return `${f.name}::${f.size}::${f.lastModified}`;
}

const txt = "var(--txt)";
const txt2 = "var(--txt2)";
const txt3 = "var(--txt3)";

const TURNAROUND_STYLE: Record<string, { bg: string; border: string; text: string; icon: string }> =
  {
    urgent: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      text: "#B91C1C",
      icon: "🔥",
    },
    rush: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      text: "#92400E",
      icon: "⚡",
    },
    standard: {
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.25)",
      text: "#047857",
      icon: "🕐",
    },
  };

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  assigned: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    text: "#1D4ED8",
    icon: "📋",
  },
  in_progress: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    text: "#92400E",
    icon: "⚙️",
  },
  revision: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    text: "#B91C1C",
    icon: "↩️",
  },
};

const inpBase: React.CSSProperties = {
  width: "100%",
  background: "var(--elevated)",
  border: "1px solid var(--border2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "var(--txt)",
  fontSize: 13,
  outline: "none",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

type FileEntry = {
  id: string;
  file: File;
  format: string;
};

export function DesignerUploadUI({
  tasks,
  userId,
  designerId,
  designerName,
  designerAvatar,
}: {
  tasks: any[];
  userId: string;
  designerId: string;
  designerName: string;
  designerAvatar?: string;
}) {
  const router = useRouter();
  const [, startTx] = useTransition();

  const [selOrder, setSelOrder] = useState(tasks[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fileRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [entries, setEntries] = useState<FileEntry[]>([]);

  const selTask = tasks.find((t: any) => t.id === selOrder);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const existingPrints = new Set(entries.map((e) => fileFingerprint(e.file)));
    const newEntries: FileEntry[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds ${formatSize(MAX_FILE_SIZE)}`);
        continue;
      }
      const fp = fileFingerprint(f);
      if (existingPrints.has(fp)) {
        toast.error(`${f.name} already added`);
        continue;
      }
      existingPrints.add(fp);
      newEntries.push({
        id: crypto.randomUUID(),
        file: f,
        format: getFormatFromName(f.name),
      });
    }
    if (newEntries.length) {
      setEntries((prev) => {
        const combined = [...prev, ...newEntries];
        if (combined.length > MAX_FILES) {
          toast.error(`Max ${MAX_FILES} files; extra skipped`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    }
  }

  function getFormatFromName(name: string): string {
    const ext = name.split(".").pop()?.toUpperCase();
    return ext && OUTPUT_FORMATS.includes(ext) ? ext : "DST";
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function submit() {
    if (entries.length === 0) {
      toast.error("Add at least one file");
      return;
    }
    if (!selOrder) {
      toast.error("Select an order");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const fd = new FormData();
      fd.append("orderId", selOrder);
      fd.append("notes", notes);
      for (let i = 0; i < entries.length; i++) {
        fd.append("files", entries[i].file);
        fd.append("formats", entries[i].format);
      }

      // XHR for progress + abort
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/output");
        // Same missing deadline as the customer uploaders: a stalled connection
        // leaves the progress bar frozen with no way out but Cancel.
        xhr.timeout = 180000;
        const onAbort = () => {
          xhr.abort();
          resolve({ ok: false, error: "Upload cancelled" });
        };
        controller.signal.addEventListener("abort", onAbort, { once: true });
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          controller.signal.removeEventListener("abort", onAbort);
          if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true });
          else {
            let msg = "Upload failed";
            try {
              const e = JSON.parse(xhr.responseText);
              msg = e.error || msg;
            } catch {}
            resolve({ ok: false, error: msg });
          }
        });
        xhr.addEventListener("error", () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve({ ok: false, error: "Network error — check your connection" });
        });
        xhr.addEventListener("timeout", () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve({
            ok: false,
            error: "Upload timed out — check your connection and try again",
          });
        });
        xhr.addEventListener("abort", () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve({ ok: false, error: "Upload cancelled" });
        });
        xhr.send(fd);
      });

      if (!result.ok) {
        setUploadError(result.error || "Upload failed");
        toast.error(result.error || "Upload failed");
        return;
      }

      toast.success(`${entries.length} file(s) uploaded — submitted for QA review`);
      startTx(() => {
        router.push("/designer/tasks");
        router.refresh();
      });
      // Notifications handled server-side by /api/upload/output
      setDone(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
    }
  }

  const counts = {
    total: tasks.length,
    assigned: tasks.filter((t: any) => t.status === "assigned").length,
    inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
    revision: tasks.filter((t: any) => t.status === "revision").length,
  };

  // ── Done state ──
  if (done)
    return (
      <div
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6"
        style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div
            className="rounded-2xl p-8 text-center sm:p-10"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(16,185,129,0.25)",
              maxWidth: 440,
            }}
          >
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(16,185,129,0.10)" }}
            >
              <CheckCircle size={32} color="#10B981" />
            </div>
            <h2
              className="mb-2 font-syne text-xl font-bold sm:text-2xl"
              style={{
                background: "linear-gradient(135deg, #10B981, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Submitted!
            </h2>
            <p className="mb-5 text-[13px] leading-relaxed" style={{ color: txt2 }}>
              <strong
                className="font-mono"
                style={{
                  background: "linear-gradient(90deg, #10B981, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {selTask?.order_number}
              </strong>{" "}
              files now in QA review. Admin will approve and deliver to the client.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                onClick={() => router.push("/designer/tasks")}
                className="flex-1 cursor-pointer rounded-xl border-none py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}
              >
                Back to Tasks
              </button>
              <button
                onClick={() => {
                  setDone(false);
                  setEntries([]);
                  setNotes("");
                }}
                className="flex-1 cursor-pointer rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "var(--elevated)",
                  color: txt2,
                  border: "1px solid var(--border2)",
                }}
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // ── Empty state ──
  if (tasks.length === 0)
    return (
      <div
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6"
        style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div
            className="rounded-2xl p-8 text-center sm:p-10"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              maxWidth: 400,
            }}
          >
            <p className="mb-3 text-4xl">📭</p>
            <p className="font-syne text-lg font-bold" style={{ color: txt }}>
              No tasks to upload
            </p>
            <p className="mb-5 mt-1.5 text-sm" style={{ color: txt2 }}>
              Start working on an assigned task first
            </p>
            <button
              onClick={() => router.push("/designer/tasks")}
              className="cursor-pointer rounded-xl border-none px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              Go to My Tasks
            </button>
          </div>
        </div>
      </div>
    );

  // ── Upload form ──
  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6"
      style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}
    >
      {/* ── Profile strip ── */}
      <div
        className="mb-5 rounded-2xl px-4 py-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}
          >
            {designerAvatar ? (
              <NextImage
                fill
                src={designerAvatar}
                alt={designerName}
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              designerName?.charAt(0)?.toUpperCase() || "D"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-syne text-[14px] font-bold" style={{ color: txt }}>
              {designerName}
            </span>
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: "rgba(124,58,237,0.10)",
                color: "#6D28D9",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              Uploading
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: txt3 }}
          >
            <ClipboardList size={13} /> {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Title ── */}
      <h2
        className="mb-1 font-syne text-xl font-bold leading-tight sm:text-2xl"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #D946EF, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Upload Files
      </h2>
      <p className="mb-5 text-[12px] font-medium" style={{ color: txt3 }}>
        Submit completed digitizing files for QA review · {counts.inProgress} in progress ·{" "}
        {counts.revision} need revision
      </p>

      {/* ── Quick stats ── */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Available", val: counts.total, sub: "orders", ci: 0 },
          { label: "In Progress", val: counts.inProgress, sub: "working", ci: 1 },
          { label: "Revisions", val: counts.revision, sub: "to fix", ci: 2 },
        ].map((s, i) => {
          const colors = [
            {
              bgSoft: "rgba(99,102,241,0.08)",
              border: "rgba(99,102,241,0.20)",
              icon: "#4338CA",
              text: "#4338CA",
            },
            {
              bgSoft: "rgba(245,158,11,0.08)",
              border: "rgba(245,158,11,0.20)",
              icon: "#D97706",
              text: "#92400E",
            },
            {
              bgSoft: "rgba(239,68,68,0.08)",
              border: "rgba(239,68,68,0.20)",
              icon: "#DC2626",
              text: "#B91C1C",
            },
          ][i];
          return (
            <div
              key={s.label}
              className="rounded-2xl p-3 transition-all hover:translate-y-[-2px] sm:p-3.5"
              style={{
                background: colors.bgSoft,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <span
                className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]"
                style={{ color: txt3 }}
              >
                {s.label}
              </span>
              <div
                className="font-syne text-lg font-bold sm:text-xl"
                style={{ color: colors.text }}
              >
                {s.val}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: txt3 }}>
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Form card ── */}
      <div
        className="mb-5 rounded-2xl p-4 sm:p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3
          className="mb-5 flex items-center gap-2 font-syne text-[15px] font-bold sm:text-[16px]"
          style={{ color: txt }}
        >
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(124,58,237,0.10)", color: "#7C3AED" }}
          >
            <Upload size={13} />
          </span>
          Submit completed files
        </h3>

        {/* ── Order selector ── */}
        <div className="mb-4">
          <label
            className="mb-2 block text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: txt3 }}
          >
            Select order
          </label>
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tasks.map((t: any) => {
              const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.assigned;
              const tc = TURNAROUND_STYLE[t.turnaround] ?? TURNAROUND_STYLE.standard;
              const isActive = selOrder === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelOrder(t.id)}
                  className="cursor-pointer rounded-xl border p-3 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: isActive ? "var(--elevated)" : "var(--surface)",
                    borderColor: isActive ? "#7C3AED" : "var(--border2)",
                    borderWidth: isActive ? "2px" : "1px",
                    boxShadow: isActive ? "0 0 0 3px rgba(124,58,237,0.10)" : "none",
                  }}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className="font-mono text-[12px] font-bold tracking-tight"
                      style={{
                        background: isActive
                          ? "linear-gradient(90deg, #7C3AED, #D946EF)"
                          : "linear-gradient(90deg, var(--txt2), var(--txt3))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {t.order_number}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      {sc.icon} {t.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: txt }}>
                    {t.clients?.company_name ?? "—"}
                  </p>
                  <div
                    className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]"
                    style={{ color: txt3 }}
                  >
                    <span>{t.service_tiers?.label}</span>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono"
                      style={{ background: "var(--elevated)", color: txt3 }}
                    >
                      {t.output_format}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 font-semibold"
                      style={{
                        background: tc.bg,
                        color: tc.text,
                        border: `1px solid ${tc.border}`,
                      }}
                    >
                      {tc.icon} {t.turnaround}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected order detail ── */}
        {selTask && (
          <div
            className="mb-4 rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(217,70,239,0.04))",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
          >
            <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
              <div>
                <span
                  className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Client
                </span>
                <span className="font-medium" style={{ color: txt }}>
                  {selTask.clients?.company_name}
                </span>
              </div>
              <div>
                <span
                  className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Service
                </span>
                <span className="font-medium" style={{ color: txt }}>
                  {selTask.service_tiers?.label}
                </span>
              </div>
              <div>
                <span
                  className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Format
                </span>
                <span className="font-mono font-semibold" style={{ color: "#06B6D4" }}>
                  {selTask.output_format}
                </span>
              </div>
              <div>
                <span
                  className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: txt3 }}
                >
                  Size
                </span>
                <span className="font-medium" style={{ color: txt }}>
                  {selTask.service_tiers?.size_desc ?? "—"}
                </span>
              </div>
            </div>
            {selTask.placement_notes && (
              <div
                className="mt-3 pt-3 text-[11px] leading-relaxed"
                style={{ borderTop: "1px solid var(--border)", color: txt2 }}
              >
                📝 {selTask.placement_notes}
              </div>
            )}
          </div>
        )}

        {/* ── Main drop zone ── */}
        <input
          type="file"
          multiple
          accept={ALLOWED_ACCEPT}
          style={{ display: "none" }}
          ref={(el) => {
            if (el) fileRefs.current.set("batch", el);
          }}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
          }}
        />
        <div
          onClick={() => fileRefs.current.get("batch")?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className="mb-4 cursor-pointer rounded-xl p-6 text-center transition-all sm:p-8"
          style={{
            border: `2px dashed ${entries.length > 0 ? "#10B981" : "var(--border2)"}`,
            background: entries.length > 0 ? "rgba(16,185,129,0.03)" : "var(--surface)",
          }}
        >
          <Upload
            size={24}
            style={{ color: entries.length > 0 ? "#10B981" : "var(--txt3)", margin: "0 auto 8px" }}
          />
          <p
            className="mb-1 text-[13px] font-semibold"
            style={{ color: entries.length > 0 ? "#10B981" : txt2 }}
          >
            {entries.length > 0
              ? `${entries.length} file(s) added`
              : "Click or drag & drop files here"}
          </p>
          <p className="text-[11px]" style={{ color: txt3 }}>
            All image & digitizing formats · drop multiple files at once
          </p>
        </div>

        {/* ── File list ── */}
        {entries.length > 0 && (
          <div className="mb-4 max-h-[300px] space-y-2 overflow-y-auto">
            {entries.map((entry, idx) => {
              const isImage =
                entry.file.type.startsWith("image/") ||
                /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(entry.file.name);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}
                  >
                    {idx + 1}
                  </span>
                  {/* Thumbnail or icon */}
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border"
                    style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
                  >
                    {isImage ? (
                      <ImageIcon size={14} style={{ color: txt3 }} />
                    ) : (
                      <FileText size={14} style={{ color: txt3 }} />
                    )}
                  </div>
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] font-medium"
                    style={{ color: txt }}
                  >
                    {entry.file.name}
                  </span>
                  <span className="flex-shrink-0 text-[10px]" style={{ color: txt3 }}>
                    {formatSize(entry.file.size)}
                  </span>
                  <select
                    value={entry.format}
                    onChange={(e) => updateEntry(entry.id, { format: e.target.value })}
                    className="flex-shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold"
                    style={{
                      ...inpBase,
                      width: "auto",
                      cursor: "pointer",
                      padding: "4px 8px",
                      background: "var(--surface)",
                    }}
                  >
                    {OUTPUT_FORMATS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="flex-shrink-0 cursor-pointer rounded-lg border-none p-1"
                    style={{ background: "transparent", color: txt3 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Clear all */}
        {entries.length > 0 && (
          <button
            onClick={() => {
              setEntries([]);
              setUploadError(null);
            }}
            className="mb-4 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all"
            style={{
              background: "rgba(239,68,68,0.06)",
              color: "#B91C1C",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <X size={12} /> Remove all files
          </button>
        )}

        {/* Notes */}
        <div className="mb-5">
          <label
            className="mb-2 block text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: txt3 }}
          >
            QA notes{" "}
            <span className="text-[10px] font-normal normal-case" style={{ color: txt3 }}>
              (optional)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Thread colours, density adjustments, test run notes…"
            style={{ ...inpBase, resize: "none", background: "var(--elevated)" }}
          />
        </div>

        {/* Upload progress + cancel */}
        {uploading && uploadProgress > 0 && (
          <div
            className="mb-3 rounded-xl border p-3"
            style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.2)" }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className="flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: "#7C3AED" }}
              >
                <Loader2 size={12} className="animate-spin" /> Uploading… {uploadProgress}%
              </span>
              <button
                onClick={() => abortRef.current?.abort()}
                className="cursor-pointer rounded border-none bg-transparent px-2 py-1 text-[11px] font-semibold"
                style={{ color: "#B91C1C" }}
              >
                Cancel
              </button>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: "var(--elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: "linear-gradient(90deg, #7C3AED, #D946EF)",
                }}
              />
            </div>
          </div>
        )}

        {/* Error + retry */}
        {uploadError && !uploading && (
          <div
            className="mb-3 flex items-center justify-between rounded-xl border p-3"
            style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}
          >
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#B91C1C" }}>
              <AlertTriangle size={12} /> {uploadError}
            </span>
            <button
              onClick={submit}
              className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={submit}
          disabled={uploading || entries.length === 0}
          className="w-full cursor-pointer rounded-xl border-none py-3 text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background:
              uploading || entries.length === 0
                ? "var(--elevated)"
                : "linear-gradient(135deg, #7C3AED, #D946EF)",
            color: entries.length === 0 ? txt3 : "#fff",
            cursor: entries.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading…" : "Submit for QA Review ⬆"}
        </button>
      </div>
    </div>
  );
}
