"use client";

import * as React from "react";
import {
  X,
  Upload,
  CheckCircle,
  Loader2,
  ImageIcon,
  Zap,
  Clock,
  Package,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

import type { PricingCatalog } from "@/lib/pricing/catalog";

// ─── Service Catalog ─────────────────────────────────────────────────────────

const SERVICE_CATALOG = {
  EMBROIDERY_DIGITIZING: {
    label: "Embroidery Digitizing",
    emoji: "🧵",
    description: "Machine-ready embroidery files",
    tiers: [
      { id: "left-chest", label: 'Left Chest / Small (up to 4")', price: 15 },
      { id: "standard", label: 'Standard Design (4"–8")', price: 25 },
      { id: "large", label: 'Large Design (8"–12")', price: 40 },
      { id: "jumbo", label: 'Jumbo / Full Back (12"+)', price: 65 },
      { id: "patches", label: "Patches & Custom Shapes", price: 35 },
      { id: "3d-puff", label: "3D Puff Digitizing", price: 45 },
    ],
  },
  VECTOR_REDRAW: {
    label: "Vector Redraw",
    emoji: "✏️",
    description: "Crisp scalable vector artwork",
    tiers: [
      { id: "basic", label: "Basic Logo (up to 2 colors)", price: 15 },
      { id: "standard", label: "Standard (up to 5 colors)", price: 25 },
      { id: "complex", label: "Complex Illustration", price: 45 },
      { id: "gradient", label: "Multi-color with Gradients", price: 65 },
    ],
  },
  COLOR_SEPARATION: {
    label: "Color Separation",
    emoji: "🎨",
    description: "Separated layers for screen printing",
    tiers: [
      { id: "simple", label: "Simple (up to 4 colors)", price: 20 },
      { id: "standard", label: "Standard (5–8 colors)", price: 35 },
      { id: "complex", label: "Complex / Simulated Process", price: 60 },
    ],
  },
  DTF_SCREEN_PRINT: {
    label: "DTF / Screen Print Setup",
    emoji: "🖨️",
    description: "Film & screen printing artwork",
    tiers: [
      { id: "single-color", label: "Single Color Artwork", price: 15 },
      { id: "spot-color", label: "Spot Color Film (up to 6 colors)", price: 35 },
      { id: "full-process", label: "Full Process / Simulated", price: 55 },
    ],
  },
} as const;

type ServiceKey = keyof typeof SERVICE_CATALOG;

const DELIVERY_OPTIONS = [
  { id: "STANDARD", label: "Standard Delivery", sub: "3–5 business days", extra: 0, Icon: Package },
  { id: "RUSH_SAME_DAY", label: "Rush Same Day", sub: "Delivered within 24 hours", extra: 25, Icon: Clock },
  { id: "RUSH_12_HOUR", label: "Rush 12-Hour", sub: "Delivered within 12 hours", extra: 45, Icon: Zap },
] as const;

const ADD_ONS = [
  { id: "MAJOR_REVISION", label: "Major Revision", price: 15 },
  { id: "FORMAT_CONVERSION", label: "Format Conversion", price: 10 },
  { id: "SIZE_CHANGE", label: "Size Change", price: 8 },
  { id: "SOURCE_FILE", label: "Source / Editable File", price: 20 },
] as const;

type DeliveryId = (typeof DELIVERY_OPTIONS)[number]["id"];
type AddOnId = (typeof ADD_ONS)[number]["id"];

type EffectiveTier = { id: string; label: string; price: number };
type EffectiveCat = { key: string; label: string; emoji: string; description: string; tiers: EffectiveTier[] };
type EffectiveDelivery = { id: string; label: string; sub: string; extra: number; Icon: React.ComponentType<{ className?: string }> };
type EffectiveAddon = { id: string; label: string; price: number };

const DELIVERY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  STANDARD: Package,
  RUSH_SAME_DAY: Clock,
  RUSH_12_HOUR: Zap,
};

function buildEffectiveCatalog(catalog?: PricingCatalog) {
  const cats: EffectiveCat[] = catalog
    ? catalog.categories
        .filter((c) => c.isActive)
        .map((c) => ({
          key: c.key,
          label: c.label,
          emoji: c.emoji,
          description: c.description,
          tiers: c.tiers.filter((t) => t.isActive).map((t) => ({ id: t.key, label: t.label, price: t.price })),
        }))
    : (Object.entries(SERVICE_CATALOG) as [ServiceKey, (typeof SERVICE_CATALOG)[ServiceKey]][]).map(
        ([key, svc]) => ({ key, label: svc.label, emoji: svc.emoji, description: svc.description, tiers: [...svc.tiers] })
      );

  const deliveryOpts: EffectiveDelivery[] = catalog
    ? catalog.delivery
        .filter((d) => d.isActive)
        .map((d) => ({
          id: d.key,
          label: d.label,
          sub: d.subLabel,
          extra: d.extraPrice,
          Icon: DELIVERY_ICONS[d.key] ?? Package,
        }))
    : DELIVERY_OPTIONS.map((d) => ({ ...d }));

  const addons: EffectiveAddon[] = catalog
    ? catalog.addons.filter((a) => a.isActive).map((a) => ({ id: a.key, label: a.label, price: a.price }))
    : ADD_ONS.map((a) => ({ ...a }));

  return { cats, deliveryOpts, addons };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Overlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      onClick={onClick}
      aria-hidden
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-[1rem] border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition";

// ─── Main Modal ───────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  catalog?: PricingCatalog;
};

export function OrderModal({ open, onClose, catalog }: Props) {
  const { cats, deliveryOpts, addons } = React.useMemo(
    () => buildEffectiveCatalog(catalog),
    [catalog]
  );

  const [category, setCategory] = React.useState("");
  const [tierId, setTierId] = React.useState("");
  const [designName, setDesignName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [delivery, setDelivery] = React.useState<string>("STANDARD");
  const [addOns, setAddOns] = React.useState<AddOnId[]>([]);
  const [notes, setNotes] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<{ orderNumber: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Lock body scroll while open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const service = category ? cats.find((c) => c.key === category) ?? null : null;
  const selectedTier = service?.tiers.find((t) => t.id === tierId) ?? null;
  const deliveryOpt = deliveryOpts.find((d) => d.id === delivery) ?? deliveryOpts[0]!;
  const addOnTotal = addons.filter((a) => addOns.includes(a.id as AddOnId)).reduce((s, a) => s + a.price, 0);
  const total = selectedTier ? selectedTier.price + deliveryOpt.extra + addOnTotal : 0;

  function handleImageSelect(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }

  function toggleAddOn(id: AddOnId) {
    setAddOns((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }

  function resetForm() {
    setCategory("");
    setTierId("");
    setDesignName("");
    setDescription("");
    setQuantity(1);
    setDelivery("STANDARD");
    setAddOns([]);
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !tierId || !designName.trim() || !selectedTier) {
      setError("Please select a service, tier, and enter a design name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let referenceImageKey: string | undefined;

    // Upload reference image if provided
    if (imageFile) {
      try {
        const intentRes = await fetch("/api/client/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: imageFile.name, mimeType: imageFile.type, sizeBytes: imageFile.size }),
        });
        if (intentRes.ok) {
          const { uploadUrl, objectKey } = await intentRes.json() as { uploadUrl: string; objectKey: string };
          await fetch(uploadUrl, { method: "PUT", body: imageFile, headers: { "Content-Type": imageFile.type } });
          referenceImageKey = objectKey;
        }
      } catch {
        // Non-fatal — continue without image
      }
    }

    try {
      const res = await fetch("/api/client/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCategory: category,
          tierId: selectedTier.id,
          tierLabel: selectedTier.label,
          tierPrice: selectedTier.price,
          designName: designName.trim(),
          designDescription: description.trim(),
          quantity,
          deliverySpeed: delivery,
          addOns,
          additionalNotes: notes.trim(),
          referenceImageKey,
          totalPrice: total,
        }),
      });

      const json = await res.json() as { success?: boolean; orderNumber?: string; error?: string };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to place order.");
      }

      setSuccess({ orderNumber: json.orderNumber! });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal
        aria-label="Place a New Order"
      >
        <div className="relative flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#07111f] shadow-[0_40px_160px_rgba(0,0,0,0.6)] sm:h-[90vh] sm:rounded-[2rem]">
          {/* Glassmorphism overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_40%)]" />

          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Client portal</div>
              <h2 className="mt-0.5 text-lg font-bold text-white">Place a New Order</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition hover:bg-white/[0.12] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success state */}
          {success ? (
            <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">Order placed!</div>
                <div className="mt-2 font-mono text-sm text-white/50">{success.orderNumber}</div>
                <p className="mt-3 text-sm text-white/60">
                  Our team has received your order and will begin work shortly.
                  You can track progress in My Orders.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/client/orders"
                  className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-slate-950"
                >
                  View My Orders
                </a>
                <button
                  onClick={() => { resetForm(); }}
                  className="inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/70 transition hover:text-white"
                >
                  New Order
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex flex-1 flex-col overflow-hidden">
              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
                <div className="space-y-6">

                  {/* Service category */}
                  <Field label="Select service">
                    <div className="grid grid-cols-2 gap-2">
                      {cats.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => { setCategory(cat.key); setTierId(""); }}
                          className={`flex items-center gap-3 rounded-[1.25rem] border p-3.5 text-left transition ${
                            category === cat.key
                              ? "border-violet-500/50 bg-violet-500/10 text-white"
                              : "border-white/8 bg-white/[0.04] text-white/60 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <span className="text-xl leading-none">{cat.emoji}</span>
                          <div>
                            <div className="text-xs font-semibold leading-tight">{cat.label}</div>
                            <div className="mt-0.5 text-[10px] text-white/40">{cat.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Tier dropdown */}
                  {service && (
                    <Field label="Service tier & pricing">
                      <div className="relative">
                        <select
                          value={tierId}
                          onChange={(e) => setTierId(e.target.value)}
                          required
                          className="w-full appearance-none rounded-[1rem] border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                        >
                          <option value="" className="bg-[#07111f]">Select a tier…</option>
                          {service.tiers.map((t) => (
                            <option key={t.id} value={t.id} className="bg-[#07111f]">
                              {t.label} — ${t.price}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      </div>
                      {selectedTier && (
                        <div className="mt-2 flex items-center justify-between rounded-[0.875rem] border border-violet-500/20 bg-violet-500/8 px-4 py-2.5">
                          <span className="text-xs text-white/60">{selectedTier.label}</span>
                          <span className="text-sm font-bold text-white">${selectedTier.price}</span>
                        </div>
                      )}
                    </Field>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Order details</span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>

                  {/* Reference image */}
                  <Field label="Reference image (JPG / PNG)">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
                    />
                    {imagePreview ? (
                      <div className="relative rounded-[1.25rem] border border-white/12 bg-white/[0.04] p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Reference" className="max-h-36 w-full rounded-xl object-contain" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`flex w-full flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed px-4 py-8 transition ${
                          dragging
                            ? "border-violet-400/60 bg-violet-500/8"
                            : "border-white/12 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                          <ImageIcon className="h-5 w-5 text-white/40" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-white/60">Drop your file here or <span className="text-violet-400">click to upload</span></div>
                          <div className="mt-1 text-xs text-white/30">JPG, PNG, WebP — up to 20 MB</div>
                        </div>
                      </button>
                    )}
                  </Field>

                  {/* Design name */}
                  <Field label="Design name">
                    <input
                      type="text"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      placeholder="e.g. Company logo — hat embroidery"
                      required
                      className={inputCls}
                    />
                  </Field>

                  {/* Description */}
                  <Field label="Design description">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your design, colors, placement, dimensions, special requirements…"
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  {/* Quantity */}
                  <Field label="Quantity">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.1]"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-11 w-24 rounded-xl border border-white/12 bg-white/[0.06] text-center text-sm font-semibold text-white outline-none focus:border-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((v) => v + 1)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.1]"
                      >
                        +
                      </button>
                    </div>
                  </Field>

                  {/* Delivery speed */}
                  <Field label="Delivery speed">
                    <div className="space-y-2">
                      {deliveryOpts.map((opt) => {
                        const Icon = opt.Icon;
                        const selected = delivery === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-center gap-4 rounded-[1.25rem] border px-4 py-3.5 transition ${
                              selected
                                ? "border-violet-500/40 bg-violet-500/8"
                                : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="delivery"
                              value={opt.id}
                              checked={selected}
                              onChange={() => setDelivery(opt.id)}
                              className="hidden"
                            />
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-violet-500/15 text-violet-400" : "bg-white/[0.06] text-white/40"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-white">{opt.label}</div>
                              <div className="text-xs text-white/40">{opt.sub}</div>
                            </div>
                            <div className="text-right">
                              {opt.extra === 0 ? (
                                <span className="text-xs text-white/40">Included</span>
                              ) : (
                                <span className="text-sm font-semibold text-white">+${opt.extra}</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Add-ons */}
                  <Field label="Optional add-ons">
                    <div className="space-y-2">
                      {addons.map((addon) => {
                        const checked = addOns.includes(addon.id as AddOnId);
                        return (
                          <label
                            key={addon.id}
                            className={`flex cursor-pointer items-center gap-4 rounded-[1.25rem] border px-4 py-3 transition ${
                              checked
                                ? "border-violet-500/40 bg-violet-500/8"
                                : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${checked ? "border-violet-400 bg-violet-500/20" : "border-white/20 bg-white/[0.04]"}`}>
                              {checked && <span className="text-[10px] text-violet-400">✓</span>}
                            </div>
                            <input type="checkbox" checked={checked} onChange={() => toggleAddOn(addon.id as AddOnId)} className="hidden" />
                            <span className="flex-1 text-sm text-white/80">{addon.label}</span>
                            <span className="text-sm font-semibold text-white">+${addon.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Additional notes */}
                  <Field label="Additional notes">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any other instructions, references, or questions for our team…"
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  {/* Spacer for sticky footer */}
                  <div className="h-4" />
                </div>
              </div>

              {/* Sticky footer — price + submit */}
              <div className="relative shrink-0 border-t border-white/8 bg-[#07111f]/95 px-6 py-4 backdrop-blur-xl">
                {error && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {selectedTier && (
                  <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-white/45">
                      <span>Base ({selectedTier.label})</span>
                      <span>${selectedTier.price}</span>
                    </div>
                    {deliveryOpt.extra > 0 && (
                      <div className="flex justify-between text-xs text-white/45">
                        <span>{deliveryOpt.label}</span>
                        <span>+${deliveryOpt.extra}</span>
                      </div>
                    )}
                    {addons.filter((a) => addOns.includes(a.id as AddOnId)).map((a) => (
                      <div key={a.id} className="flex justify-between text-xs text-white/45">
                        <span>{a.label}</span>
                        <span>+${a.price}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/8 pt-2 text-sm font-bold text-white">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !category || !tierId || !designName.trim()}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold tracking-[0.16em] text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      PLACE ORDER
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
