"use client";

import * as React from "react";
import { X, Pencil, FileImage, Trash2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PLACEMENT_OPTIONS, FABRIC_TYPES } from "@/lib/quote-order/catalog";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

type InitialFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type InitialData = {
  title: string;
  notes: string | null;
  placement: string | null;
  fabricType: string | null;
  designHeightIn: number | null;
  designWidthIn: number | null;
  colorQuantity: number | null;
  specialInstructions: string | null;
};

type Props = {
  orderId: string;
  initialData: InitialData;
  initialFiles: InitialFile[];
  /** Current workflow status — used to show intake guidance for DRAFT orders. */
  status?: string;
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientEditOrderModal({ orderId, initialData, initialFiles, status }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // Form state
  const [title, setTitle] = React.useState(initialData.title);
  const [notes, setNotes] = React.useState(initialData.notes ?? "");
  const [placement, setPlacement] = React.useState(initialData.placement ?? "");
  const [fabricType, setFabricType] = React.useState(initialData.fabricType ?? "");
  const [designHeightIn, setDesignHeightIn] = React.useState(
    initialData.designHeightIn != null ? String(initialData.designHeightIn) : ""
  );
  const [designWidthIn, setDesignWidthIn] = React.useState(
    initialData.designWidthIn != null ? String(initialData.designWidthIn) : ""
  );
  const [colorQuantity, setColorQuantity] = React.useState(
    initialData.colorQuantity != null ? String(initialData.colorQuantity) : ""
  );
  const [specialInstructions, setSpecialInstructions] = React.useState(
    initialData.specialInstructions ?? ""
  );

  // Reference file state
  const [existingFiles, setExistingFiles] = React.useState<InitialFile[]>(initialFiles);
  const [deletingFileId, setDeletingFileId] = React.useState<string | null>(null);
  const [newFiles, setNewFiles] = React.useState<RefFile[]>([]);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function removeExistingFile(fileId: string) {
    setDeletingFileId(fileId);
    try {
      const res = await fetch(`/api/client/orders/${orderId}/reference-files/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const json = await res.json() as { message?: string };
        setError(json.message ?? "Failed to remove file.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeletingFileId(null);
    }
  }

  async function save() {
    if (!title.trim()) { setError("Design title is required."); return; }
    setSaving(true);
    setError("");

    try {
      // 1. Update order details
      const res = await fetch(`/api/client/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          title: title.trim(),
          notes: notes.trim() || null,
          placement: placement || null,
          fabricType: fabricType || null,
          designHeightIn: designHeightIn ? Number(designHeightIn) : null,
          designWidthIn: designWidthIn ? Number(designWidthIn) : null,
          colorQuantity: colorQuantity ? Number(colorQuantity) : null,
          specialInstructions: specialInstructions.trim() || null,
        }),
      });

      const result = await res.json() as { ok: boolean; message?: string };
      if (!res.ok || !result.ok) {
        setError(result.message ?? "Failed to save changes.");
        return;
      }

      // 2. Save newly uploaded reference files
      if (newFiles.length > 0) {
        const refRes = await fetch(`/api/client/orders/${orderId}/reference-files`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ files: newFiles }),
        });
        if (!refRes.ok) {
          setError("Order saved but failed to attach new reference files.");
          return;
        }
      }

      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inp =
    "h-10 w-full rounded-xl border border-border/80 bg-secondary/60 px-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-ring/60 focus:bg-background transition-all";
  const sel =
    "h-10 w-full rounded-xl border border-border/80 bg-secondary/60 px-3 text-sm outline-none focus:border-ring/60 transition-all appearance-none cursor-pointer";
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit order
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />

          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <div
              className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-card shadow-2xl sm:rounded-3xl"
              style={{ maxHeight: "90dvh" }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold">Edit order</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Update details and reference files. Only available while order is pending.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
                <div className="grid gap-4">
                  {/* Intake status guidance for DRAFT orders */}
                  {status === "DRAFT" && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <div className="text-xs leading-relaxed text-amber-200/80">
                          <span className="font-semibold text-amber-300">Order incomplete.</span>
                          {" "}Fill in the missing details below, then save. Once all required fields are complete,
                          the order will be automatically submitted for review.
                        </div>
                      </div>
                    </div>
                  )}
                  {status === "SUBMITTED" && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div className="text-xs leading-relaxed text-emerald-200/80">
                          <span className="font-semibold text-emerald-300">Order is complete.</span>
                          {" "}All required fields are filled in. Edit below if needed; changes will be saved
                          and the order will remain in the queue.
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Design title */}
                  <div>
                    <label className={label}>
                      Design title <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. GenX Apparel — Spring cap logo"
                      className={inp}
                    />
                  </div>

                  {/* Placement + Fabric */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Placement</label>
                      <select value={placement} onChange={(e) => setPlacement(e.target.value)} className={sel}>
                        <option value="">— None —</option>
                        {PLACEMENT_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Fabric</label>
                      <select value={fabricType} onChange={(e) => setFabricType(e.target.value)} className={sel}>
                        <option value="">— None —</option>
                        {FABRIC_TYPES.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dimensions + Color qty */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={label}>Height (in)</label>
                      <input
                        type="number" min={0.5} max={24} step={0.25}
                        value={designHeightIn}
                        onChange={(e) => setDesignHeightIn(e.target.value)}
                        placeholder="e.g. 4"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={label}>Width (in)</label>
                      <input
                        type="number" min={0.5} max={24} step={0.25}
                        value={designWidthIn}
                        onChange={(e) => setDesignWidthIn(e.target.value)}
                        placeholder="e.g. 4"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={label}>Colors</label>
                      <input
                        type="number" min={1} max={200}
                        value={colorQuantity}
                        onChange={(e) => setColorQuantity(e.target.value)}
                        placeholder="e.g. 6"
                        className={inp}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={label}>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Any details about this order…"
                      className="w-full resize-none rounded-xl border border-border/80 bg-secondary/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-ring/60 transition-all"
                    />
                  </div>

                  {/* Special instructions */}
                  <div>
                    <label className={label}>Special instructions</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      placeholder="Placement details, color matching, specific formats…"
                      className="w-full resize-none rounded-xl border border-border/80 bg-secondary/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-ring/60 transition-all"
                    />
                  </div>

                  {/* Reference files */}
                  <div>
                    <label className={label}>Reference files</label>

                    {/* Existing */}
                    {existingFiles.length > 0 && (
                      <div className="mb-3 grid gap-1.5">
                        {existingFiles.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm"
                          >
                            <FileImage className="h-4 w-4 shrink-0 text-indigo-400" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">{f.fileName}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {formatBytes(f.sizeBytes)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingFile(f.id)}
                              disabled={deletingFileId === f.id}
                              aria-label="Remove file"
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                            >
                              {deletingFileId === f.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New uploads */}
                    <ReferenceFileUploader
                      files={newFiles}
                      onChange={setNewFiles}
                      maxFiles={10 - existingFiles.length}
                      disabled={saving}
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-full border border-border/80 bg-secondary/60 px-5 text-xs font-medium transition hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
