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
  approvalStatus: string;
  approvedAt: Date | null;
  declineReason: string | null;
  approvedBy: { name: string | null } | null;
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

const APPROVAL_BADGE: Record<string, string> = {
  PENDING_APPROVAL: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-600 dark:text-amber-400",
  APPROVED:         "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400",
  DECLINED:         "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-600 dark:text-red-400",
  DRAFT:            "border-border/60 bg-muted/60 text-muted-foreground",
  ARCHIVED:         "border-border/60 bg-muted/60 text-muted-foreground",
};
const APPROVAL_LABEL: Record<string, string> = {
  PENDING_APPROVAL: "Pending review",
  APPROVED:         "Approved",
  DECLINED:         "Declined",
  DRAFT:            "Draft",
  ARCHIVED:         "Archived",
};

type Tab = "all" | "pending" | "approved" | "declined";

export function PortfolioManager({
  initialItems,
  userRole,
}: {
  initialItems: PortfolioItem[];
  userRole: string;
}) {
  const router = useRouter();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [tab, setTab] = useState<Tab>("all");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningSaving, setDecliningSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.approvalStatus === "PENDING_APPROVAL").length,
    approved: items.filter((i) => i.approvalStatus === "APPROVED").length,
    declined: items.filter((i) => i.approvalStatus === "DECLINED").length,
  };

  const visible = items.filter((item) => {
    if (tab === "pending") return item.approvalStatus === "PENDING_APPROVAL";
    if (tab === "approved") return item.approvalStatus === "APPROVED";
    if (tab === "declined") return item.approvalStatus === "DECLINED";
    return true;
  });

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

  async function approveItem(itemId: string) {
    setApprovingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${itemId}/approve`, { method: "POST" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Approve failed.");
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, approvalStatus: "APPROVED", isVisible: true, declineReason: null }
              : i
          )
        );
      }
    } catch {
      setError("Network error.");
    } finally {
      setApprovingId(null);
    }
  }

  async function declineItem(itemId: string) {
    if (!declineReason.trim() || declineReason.trim().length < 5) {
      setError("Decline reason must be at least 5 characters.");
      return;
    }
    setDecliningSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${itemId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason.trim() }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Decline failed.");
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, approvalStatus: "DECLINED", isVisible: false, declineReason: declineReason.trim() }
              : i
          )
        );
        setDeclineTarget(null);
        setDeclineReason("");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDecliningSaving(false);
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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-border/80 bg-card/70 p-1">
        {(["all", "pending", "approved", "declined"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t === "pending" ? "Pending" : t === "approved" ? "Approved" : "Declined"}
            {counts[t] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  tab === t
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : t === "pending"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-secondary/80 text-muted-foreground"
                }`}
              >
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items list */}
      {visible.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          {tab === "pending"
            ? "No items pending approval."
            : tab === "approved"
            ? "No approved items yet."
            : tab === "declined"
            ? "No declined items."
            : "No portfolio items yet. Add your first item above."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="divide-y divide-border/80">
            {visible.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 text-sm">
                {/* Row 1: title + approval badge + actions */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${APPROVAL_BADGE[item.approvalStatus] ?? ""}`}
                      >
                        {APPROVAL_LABEL[item.approvalStatus] ?? item.approvalStatus}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {SERVICE_OPTIONS.find((s) => s.value === item.serviceKey)?.label ?? item.serviceKey}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground opacity-70">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {item.createdBy?.name && (
                        <span>Uploaded by {item.createdBy.name}</span>
                      )}
                      {item.approvedBy?.name && item.approvalStatus === "APPROVED" && (
                        <span className="text-emerald-600 dark:text-emerald-400/70">· Approved by {item.approvedBy.name}</span>
                      )}
                      {item.approvalStatus === "DECLINED" && item.declineReason && (
                        <span className="text-red-600 dark:text-red-400/70">· Declined: {item.declineReason}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}

                    <ToggleButton
                      active={item.isFeatured}
                      activeLabel="Featured"
                      inactiveLabel="Feature"
                      activeClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                      disabled={togglingId === item.id}
                      onClick={() => toggleField(item.id, "isFeatured", item.isFeatured)}
                    />

                    <ToggleButton
                      active={item.isVisible}
                      activeLabel="Visible"
                      inactiveLabel="Hidden"
                      activeClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      disabled={togglingId === item.id}
                      onClick={() => toggleField(item.id, "isVisible", item.isVisible)}
                    />

                    {/* Approve / Decline — SUPER_ADMIN only */}
                    {isSuperAdmin && item.approvalStatus !== "APPROVED" && (
                      <button
                        type="button"
                        disabled={approvingId === item.id}
                        onClick={() => approveItem(item.id)}
                        className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {approvingId === item.id ? "Approving…" : "Approve"}
                      </button>
                    )}
                    {isSuperAdmin && item.approvalStatus !== "DECLINED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineTarget(item.id);
                          setDeclineReason("");
                        }}
                        className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20"
                      >
                        Decline
                      </button>
                    )}

                    {confirmDeleteId === item.id ? (
                      <>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => deleteItem(item.id)}
                          className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50"
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
                        className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline decline form */}
                {declineTarget === item.id && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-600 dark:text-red-400">Decline reason</p>
                    <textarea
                      rows={2}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Explain why this item is being declined…"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={decliningSaving}
                        onClick={() => declineItem(item.id)}
                        className="rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {decliningSaving ? "Saving…" : "Confirm decline"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeclineTarget(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
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
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Uploaded</p>
            <p className="max-w-full truncate text-xs text-muted-foreground">{state.fileName}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStateChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-xs text-muted-foreground hover:text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
        {state?.status === "error" && (
          <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>
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
        {label} {required && <span className="text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
