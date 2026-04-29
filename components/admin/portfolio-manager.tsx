"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type PortfolioItem = {
  id: string;
  title: string;
  serviceKey: string;
  nicheSlug: string | null;
  description: string | null;
  beforeImageKey: string | null;
  afterImageKey: string | null;
  tags: string[];
  isFeatured: boolean;
  isVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  createdBy: { name: string | null } | null;
};

const SERVICE_OPTIONS = [
  { value: "EMBROIDERY_DIGITIZING", label: "Embroidery Digitizing" },
  { value: "VECTOR_ART",            label: "Vector Art Conversion" },
  { value: "CUSTOM_PATCHES",        label: "Custom Patches" },
  { value: "VECTOR_REDRAW",         label: "Vector Redraw" },
  { value: "COLOR_SEPARATION",      label: "Color Separation" },
  { value: "DTF_SCREEN_PRINT",      label: "DTF / Screen Print Setup" },
];

const NICHE_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  EMBROIDERY_DIGITIZING: [
    { value: "left-chest-logo",      label: "Left Chest Logo"      },
    { value: "cap-hat-logo",         label: "Cap / Hat Logo"       },
    { value: "large-design",         label: "Large Design"         },
    { value: "jacket-back",          label: "Jacket Back"          },
    { value: "3d-puff",              label: "3D Puff"              },
    { value: "3d-puff-jacket-back",  label: "3D Puff Jacket Back"  },
    { value: "sleeve",               label: "Sleeve"               },
    { value: "full-back",            label: "Full Back"            },
  ],
  VECTOR_ART: [
    { value: "jpg-to-vector",        label: "JPG to Vector"        },
    { value: "print-ready-artwork",  label: "Print-Ready Artwork"  },
    { value: "logo-redraw",          label: "Logo Redraw"          },
    { value: "color-separation",     label: "Color Separation"     },
  ],
  CUSTOM_PATCHES: [
    { value: "embroidered-patches",  label: "Embroidered Patches"  },
    { value: "chenille-patches",     label: "Chenille Patches"     },
    { value: "pvc-patches",          label: "PVC Patches"          },
    { value: "woven-patches",        label: "Woven Patches"        },
    { value: "leather-patches",      label: "Leather Patches"      },
  ],
};

export function PortfolioManager({ initialItems }: { initialItems: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleField(
    itemId: string,
    field: "isFeatured" | "isVisible",
    current: boolean
  ) {
    setTogglingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Update failed.");
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, [field]: !current } : i))
        );
      }
    } catch {
      setError("Network error.");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteItem(itemId: string) {
    setDeletingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${itemId}`, { method: "DELETE" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Delete failed.");
      } else {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setConfirmDeleteId(null);
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeletingId(null);
    }
  }

  function onItemCreated(item: PortfolioItem) {
    setItems((prev) => [item, ...prev]);
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ Add item"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <AddItemForm
          onCreated={onItemCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Items list */}
      {items.length === 0 && !showForm ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No portfolio items yet. Add your first item above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Title</div>
            <div>Service</div>
            <div>Tags</div>
            <div>Featured</div>
            <div>Visible</div>
            <div></div>
          </div>

          <div className="divide-y divide-border/80">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.createdBy?.name && (
                    <p className="mt-0.5 text-xs text-muted-foreground opacity-60">
                      by {item.createdBy.name}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {SERVICE_OPTIONS.find((s) => s.value === item.serviceKey)?.label ??
                    item.serviceKey}
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                  )}
                </div>

                <ToggleButton
                  active={item.isFeatured}
                  activeLabel="Featured"
                  inactiveLabel="Feature"
                  activeClass="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  disabled={togglingId === item.id}
                  onClick={() => toggleField(item.id, "isFeatured", item.isFeatured)}
                />

                <ToggleButton
                  active={item.isVisible}
                  activeLabel="Visible"
                  inactiveLabel="Hidden"
                  activeClass="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  disabled={togglingId === item.id}
                  onClick={() => toggleField(item.id, "isVisible", item.isVisible)}
                />

                <div className="flex items-center gap-2">
                  {confirmDeleteId === item.id ? (
                    <>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => deleteItem(item.id)}
                        className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  activeClass,
  disabled,
  onClick,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeClass: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-20 rounded-full py-1 text-xs font-medium transition disabled:opacity-50 ${
        active ? activeClass : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

function AddItemForm({
  onCreated,
  onCancel,
}: {
  onCreated: (item: PortfolioItem) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeUpload, setBeforeUpload] = useState<UploadState | null>(null);
  const [afterUpload, setAfterUpload] = useState<UploadState | null>(null);
  const [selectedService, setSelectedService] = useState("EMBROIDERY_DIGITIZING");
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const nicheOptions = NICHE_OPTIONS[selectedService] ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const tagsRaw = (fd.get("tags") as string).trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const body = {
      title: fd.get("title") as string,
      serviceKey: fd.get("serviceKey") as string,
      nicheSlug: (fd.get("nicheSlug") as string) || undefined,
      description: (fd.get("description") as string).trim() || undefined,
      tags,
      isFeatured: fd.get("isFeatured") === "on",
      sortOrder: parseInt((fd.get("sortOrder") as string) || "0", 10),
      isVisible: true,
      beforeImageKey: beforeUpload?.status === "done" ? beforeUpload.objectKey : undefined,
      afterImageKey: afterUpload?.status === "done" ? afterUpload.objectKey : undefined,
    };

    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { ok: boolean; item?: PortfolioItem; message?: string };
      if (!json.ok || !json.item) {
        setError(json.message ?? "Failed to create item.");
      } else {
        onCreated(json.item);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[2rem] border border-border/80 bg-card/70 p-6"
    >
      <h2 className="text-base font-semibold">New portfolio item</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Title */}
        <FormField label="Title" required>
          <input
            name="title"
            required
            placeholder="e.g. Cap Front Logo Digitizing"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </FormField>

        {/* Service */}
        <FormField label="Service category" required>
          <select
            name="serviceKey"
            required
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm"
          >
            <option value="">Select service…</option>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </FormField>

        {/* Niche */}
        {nicheOptions.length > 0 && (
          <FormField label="Niche / category">
            <select
              name="nicheSlug"
              className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm"
            >
              <option value="">— Select niche (optional) —</option>
              {nicheOptions.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </FormField>
        )}

        {/* Sort order */}
        <FormField label="Sort order" hint="Lower numbers appear first">
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            min={0}
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </FormField>
      </div>

      {/* Description */}
      <FormField label="Description">
        <textarea
          name="description"
          rows={3}
          placeholder="Brief description of what makes this piece notable…"
          className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </FormField>

      {/* Tags */}
      <FormField label="Tags" hint="Comma-separated, e.g. 3D Puff, Left Chest, Hat">
        <input
          name="tags"
          placeholder="3D Puff, Left Chest, Hat"
          className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </FormField>

      {/* Images */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          label="Before image"
          inputRef={beforeInputRef}
          state={beforeUpload}
          onStateChange={setBeforeUpload}
        />
        <ImageUploadField
          label="After image"
          inputRef={afterInputRef}
          state={afterUpload}
          onStateChange={setAfterUpload}
        />
      </div>

      {/* Featured */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="isFeatured"
          className="h-4 w-4 rounded accent-primary"
        />
        <span className="text-sm">Feature this item (shown prominently on portfolio page)</span>
      </label>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 px-6 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type UploadState =
  | { status: "uploading"; fileName: string }
  | { status: "done"; fileName: string; objectKey: string }
  | { status: "error"; message: string };

function ImageUploadField({
  label,
  inputRef,
  state,
  onStateChange,
}: {
  label: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  state: UploadState | null;
  onStateChange: (s: UploadState | null) => void;
}) {
  async function handleFile(file: File) {
    onStateChange({ status: "uploading", fileName: file.name });
    try {
      const intentRes = await fetch("/api/admin/portfolio-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const intent = await intentRes.json() as { uploadUrl?: string; objectKey?: string; error?: string };
      if (!intent.uploadUrl || !intent.objectKey) {
        onStateChange({ status: "error", message: intent.error ?? "Upload failed." });
        return;
      }
      const uploadRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        onStateChange({ status: "error", message: "Upload to storage failed." });
        return;
      }
      onStateChange({ status: "done", fileName: file.name, objectKey: intent.objectKey });
    } catch {
      onStateChange({ status: "error", message: "Network error during upload." });
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background px-4 py-4 text-center transition hover:border-primary/40"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {!state && (
          <p className="text-xs text-muted-foreground">
            Click or drag to upload
            <br />
            JPG, PNG, WebP · max 10 MB
          </p>
        )}
        {state?.status === "uploading" && (
          <p className="text-xs text-muted-foreground">Uploading {state.fileName}…</p>
        )}
        {state?.status === "done" && (
          <div className="grid gap-1">
            <p className="text-xs text-emerald-400">Uploaded</p>
            <p className="max-w-full truncate text-xs text-muted-foreground">{state.fileName}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStateChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-xs text-muted-foreground hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
        {state?.status === "error" && (
          <p className="text-xs text-red-400">{state.message}</p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
