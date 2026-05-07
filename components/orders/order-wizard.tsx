"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from "lucide-react";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

/* ─────────────────────────────── Types ─────────────────────────────── */

type ServiceType = "EMBROIDERY_DIGITIZING" | "VECTOR_ART" | "COLOR_SEPARATION_DTF" | "CUSTOM_PATCHES";
type Turnaround  = "STANDARD" | "URGENT" | "SAME_DAY";

interface WizardForm {
  serviceType:       ServiceType | "";
  nicheSlug:         string;
  designTitle:       string;
  placement:         string;
  fabric:            string;
  height:            string;
  width:             string;
  turnaround:        Turnaround;
  colorQuantity:     string;
  threeDPuff:        boolean;
  notes:             string;
  quantity:          string;
  threadBrand:       string;
  trimsUnderlay:     string;
  stitchCount:       string;
  threadColors:      string;
  colorThreadDetails: string;
  outputFormats:     string[];
  files:             RefFile[];
  guestName:         string;
  guestEmail:        string;
  guestPhone:        string;
}

export interface OrderWizardProps {
  user?:         { name?: string | null; email?: string | null } | null;
  isFirstOrder?: boolean;
}

/* ─────────────────────────────── Data ──────────────────────────────── */

const SERVICES: { type: ServiceType; title: string; subtitle: string; icon: string }[] = [
  { type: "EMBROIDERY_DIGITIZING",  title: "Embroidery Digitizing",       subtitle: "Machine-ready stitch files",      icon: "🧵" },
  { type: "VECTOR_ART",             title: "Vector Art Conversion",        subtitle: "Scalable vector artwork",         icon: "✏️" },
  { type: "COLOR_SEPARATION_DTF",   title: "Color Separation / DTF",       subtitle: "Color sep / DTF screen setup",    icon: "🎨" },
  { type: "CUSTOM_PATCHES",         title: "Custom Patches",               subtitle: "Patch production quoting",        icon: "🏷️" },
];

const CATEGORIES: Record<ServiceType, { slug: string; label: string }[]> = {
  EMBROIDERY_DIGITIZING: [
    { slug: "cap",           label: "Cap" },
    { slug: "left-chest",   label: "Left Chest" },
    { slug: "standard-4-6", label: 'Standard (4"–6")' },
    { slug: "jacket-back",  label: "Jacket Back" },
    { slug: "large-8-12",   label: 'Large (8"–12")' },
  ],
  VECTOR_ART: [
    { slug: "jpg-to-vector",       label: "JPG to Vector" },
    { slug: "print-ready-artwork", label: "Print-Ready" },
    { slug: "logo-redraw",         label: "Logo Redraw" },
  ],
  COLOR_SEPARATION_DTF: [
    { slug: "color-separation", label: "Color Separation" },
    { slug: "dtf-screen-setup", label: "DTF Screen Setup" },
  ],
  CUSTOM_PATCHES: [
    { slug: "embroidered-patches", label: "Embroidered" },
    { slug: "chenille-patches",    label: "Chenille" },
    { slug: "pvc-patches",         label: "PVC / Rubber" },
    { slug: "woven-patches",       label: "Woven" },
    { slug: "leather-patches",     label: "Leather" },
  ],
};

const TURNAROUNDS: { value: Turnaround; label: string; hours: string }[] = [
  { value: "STANDARD", label: "Standard", hours: "12 hours" },
  { value: "URGENT",   label: "Rush",     hours: "6 hours"  },
  { value: "SAME_DAY", label: "Urgent",   hours: "3 hours"  },
];

const PLACEMENT_OPTIONS = [
  { value: "HAT_FRONT",    label: "Cap / Hat" },
  { value: "LEFT_CHEST",   label: "Left Chest" },
  { value: "JACKET_BACK",  label: "Jacket Back" },
  { value: "LARGE_DESIGN", label: "Large" },
  { value: "SLEEVE_LEFT",  label: "Sleeve" },
  { value: "FULL_BACK",    label: "Full Back" },
  { value: "OTHER",        label: "Patch / Other / Custom" },
];

const FABRIC_OPTIONS = [
  "Cotton", "Polyester", "Fleece", "Denim", "Leather",
  "Twill", "Nylon", "Canvas", "Mesh / Performance", "Cap material", "Other",
];

const OUTPUT_FORMATS = ["DST", "PES", "EMB", "EXP", "JEF", "VP3", "XXX", "HUS", "SEW"];

const STEP_LABELS = ["Service", "Design", "Options", "Confirm"];

/* ───────────────────────── Style helpers ───────────────────────────── */

const INPUT = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition";
const SELECT = "w-full rounded-xl border border-white/[0.08] bg-[#0e0f1c] px-4 py-3 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition appearance-none cursor-pointer";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-2";

/* ─────────────────────────── Component ─────────────────────────────── */

export function OrderWizard({ user, isFirstOrder }: OrderWizardProps) {
  const router  = useRouter();
  const isGuest = !user;

  const [step,         setStep]         = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [orderRef,     setOrderRef]     = useState("");
  const [serverError,  setServerError]  = useState("");

  const [form, setForm] = useState<WizardForm>({
    serviceType:        "",
    nicheSlug:          "",
    designTitle:        "",
    placement:          "",
    fabric:             "",
    height:             "",
    width:              "",
    turnaround:         "STANDARD",
    colorQuantity:      "",
    threeDPuff:         false,
    notes:              "",
    quantity:           "",
    threadBrand:        "",
    trimsUnderlay:      "",
    stitchCount:        "",
    threadColors:       "",
    colorThreadDetails: "",
    outputFormats:      ["DST", "PES"],
    files:              [],
    guestName:          "",
    guestEmail:         "",
    guestPhone:         "",
  });

  function set<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleFormat(fmt: string) {
    setForm(prev => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(fmt)
        ? prev.outputFormats.filter(f => f !== fmt)
        : [...prev.outputFormats, fmt],
    }));
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.serviceType && !!form.nicheSlug;
    if (step === 2) return form.designTitle.trim().length >= 2 && !!form.placement;
    if (step === 3) return true;
    if (step === 4) {
      if (isGuest) return form.guestName.trim().length >= 2 && !!form.guestEmail.trim();
      return true;
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setServerError("");
    try {
      const colorCount = Math.min(parseInt(form.colorQuantity) || 1, 16);
      const h = parseFloat(form.height);
      const w = parseFloat(form.width);
      const sizeInches = Math.max(isNaN(h) ? 4 : h, isNaN(w) ? 4 : w);
      const refFiles = form.files.map(f => ({
        fileName: f.fileName, objectKey: f.objectKey,
        bucket: f.bucket, mimeType: f.mimeType, sizeBytes: f.sizeBytes,
      }));

      let res: Response;
      if (isGuest) {
        res = await fetch("/api/guest/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:             form.guestName.trim(),
            email:            form.guestEmail.trim(),
            phone:            form.guestPhone || undefined,
            serviceType:      form.serviceType,
            designTitle:      form.designTitle.trim(),
            placement:        form.placement || undefined,
            fabricType:       form.fabric || undefined,
            designHeightIn:   isNaN(h) ? undefined : h,
            designWidthIn:    isNaN(w) ? undefined : w,
            quantity:         parseInt(form.quantity) || 1,
            colorQuantity:    parseInt(form.colorQuantity) || undefined,
            turnaround:       form.turnaround,
            notes:            form.notes || undefined,
            specialInstructions: form.notes || undefined,
            referenceFiles:   refFiles,
          }),
        });
      } else {
        res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode:             "order",
            serviceType:      form.serviceType,
            nicheSlug:        form.nicheSlug,
            turnaround:       form.turnaround,
            customerName:     user!.name  ?? "",
            email:            user!.email ?? "",
            designTitle:      form.designTitle.trim(),
            placement:        form.placement,
            fabricType:       form.fabric || undefined,
            designHeightIn:   isNaN(h) ? undefined : h,
            designWidthIn:    isNaN(w) ? undefined : w,
            colorQuantity:    parseInt(form.colorQuantity) || undefined,
            threeDPuff:       form.threeDPuff,
            notes:            form.notes || undefined,
            specialInstructions: form.notes || undefined,
            quantity:         parseInt(form.quantity) || 1,
            sizeInches,
            colorCount,
            complexity:       "LOW",
            sourceCleanup:    false,
            smallText:        false,
            is3dPuffJacketBack: false,
            trims:            form.trimsUnderlay || undefined,
            threadBrand:      form.threadBrand   || undefined,
            colorDetails:     form.colorThreadDetails || undefined,
            fileFormats:      form.outputFormats.length ? form.outputFormats : ["DST", "PES"],
            stitchCount:      parseInt(form.stitchCount) || undefined,
            leadSource:       "WEBSITE",
            referenceFiles:   refFiles,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Order submission failed.");
      setOrderRef(data.orderNumber ?? data.orderId ?? "");
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success screen ─────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-[480px] flex-col items-center justify-center gap-6 px-6 py-14 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/15 ring-1 ring-teal-500/40">
          <Check className="h-9 w-9 text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Order Confirmed!</h2>
          {orderRef && (
            <p className="mt-2 font-mono text-sm text-white/40">{orderRef}</p>
          )}
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/50">
            We&apos;ll review your order and get back to you with a proof within the turnaround window you selected.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {!isGuest && (
            <Link
              href="/client/orders"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#070816] transition hover:bg-white/90"
            >
              View My Orders
            </Link>
          )}
          <button
            onClick={() => { setSubmitted(false); setStep(1); setForm(f => ({ ...f, files: [], notes: "", designTitle: "" })); }}
            className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/[0.05]"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  /* ── Step content ───────────────────────────────────────────────── */
  const categories = form.serviceType ? CATEGORIES[form.serviceType] : [];

  return (
    <div className="w-full">
      {/* ── Step indicator ── */}
      <div className="mb-8 flex items-center justify-between px-1">
        {STEP_LABELS.map((label, i) => {
          const n         = i + 1;
          const completed = step > n;
          const current   = step === n;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all
                    ${completed ? "bg-teal-500 text-white"
                    : current   ? "border-2 border-violet-500 text-violet-400 bg-violet-500/10"
                    :             "border border-white/20 text-white/30"}`}
                >
                  {completed ? <Check className="h-4 w-4" /> : n}
                </div>
                <span className={`hidden text-[10px] font-semibold uppercase tracking-widest sm:block
                  ${completed ? "text-teal-400" : current ? "text-violet-400" : "text-white/25"}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`mx-2 h-px flex-1 transition-colors
                  ${step > n ? "bg-teal-500/40" : "bg-white/[0.07]"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Service ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Place a New Order</h2>
            <p className="mt-1.5 text-sm text-white/40">What service do you need?</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SERVICES.map(svc => {
              const selected = form.serviceType === svc.type;
              return (
                <button
                  key={svc.type}
                  type="button"
                  onClick={() => { set("serviceType", svc.type); set("nicheSlug", ""); }}
                  className={`relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all
                    ${selected
                      ? "border-violet-500/50 bg-violet-500/[0.08] shadow-lg shadow-violet-500/[0.08]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"}`}
                >
                  {selected && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span className="text-2xl leading-none">{svc.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{svc.title}</div>
                    <div className="mt-0.5 text-xs text-white/40">{svc.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {form.serviceType && (
            <div>
              <p className={LABEL}>Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const selected = form.nicheSlug === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => set("nicheSlug", cat.slug)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all
                        ${selected
                          ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                          : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"}`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Design ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Tell us about your design</h2>
            <p className="mt-1.5 text-sm text-white/40">Dimensions and placement help us price your design accurately.</p>
          </div>

          <div>
            <label className={LABEL}>Design Title <span className="text-red-400">*</span></label>
            <input
              className={INPUT}
              placeholder="e.g. GenX Apparel — Spring cap logo"
              value={form.designTitle}
              onChange={e => set("designTitle", e.target.value)}
            />
            {form.designTitle.trim().length > 0 && form.designTitle.trim().length < 2 && (
              <p className="mt-1.5 text-xs text-red-400/80">Minimum 2 characters required.</p>
            )}
          </div>

          <div>
            <label className={LABEL}>Placement <span className="text-red-400">*</span></label>
            <div className="relative">
              <select
                className={SELECT}
                value={form.placement}
                onChange={e => set("placement", e.target.value)}
              >
                <option value="">Select placement</option>
                {PLACEMENT_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Fabric</label>
            <div className="relative">
              <select
                className={SELECT}
                value={form.fabric}
                onChange={e => set("fabric", e.target.value)}
              >
                <option value="">Select fabric (optional)</option>
                {FABRIC_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Height (inches)</label>
              <input
                type="number" min="0.5" max="24" step="0.5"
                className={INPUT}
                placeholder="e.g. 3.5"
                value={form.height}
                onChange={e => set("height", e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Width (inches)</label>
              <input
                type="number" min="0.5" max="24" step="0.5"
                className={INPUT}
                placeholder="e.g. 4.0"
                value={form.width}
                onChange={e => set("width", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Options ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Production options</h2>
            <p className="mt-1.5 text-sm text-white/40">Set add-ons and choose your turnaround speed.</p>
          </div>

          {/* Turnaround */}
          <div>
            <p className={LABEL}>Turnaround Speed</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {TURNAROUNDS.map(t => {
                const selected = form.turnaround === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("turnaround", t.value)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all
                      ${selected
                        ? "border-teal-500/50 bg-teal-500/[0.07] shadow-md shadow-teal-500/[0.08]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-white">{t.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
                        ${selected ? "bg-teal-500/20 text-teal-300" : "bg-white/[0.06] text-white/40"}`}>
                        Free
                      </span>
                    </div>
                    <span className="mt-1.5 text-xs text-white/40">{t.hours}</span>
                    {selected && (
                      <div className="mt-3 flex h-4 w-4 items-center justify-center self-end rounded-full bg-teal-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Quantity */}
          <div>
            <label className={LABEL}>Color Quantity</label>
            <input
              type="number" min="1" max="50"
              className={INPUT}
              placeholder="Total colors in design"
              value={form.colorQuantity}
              onChange={e => set("colorQuantity", e.target.value)}
            />
          </div>

          {/* Add-ons */}
          {form.serviceType === "EMBROIDERY_DIGITIZING" && (
            <div>
              <p className={LABEL}>Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "threeDPuff", label: "3D Puff" },
                ].map(addon => (
                  <button
                    key={addon.key}
                    type="button"
                    onClick={() => set("threeDPuff", !form.threeDPuff)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all
                      ${form.threeDPuff
                        ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                        : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20"}`}
                  >
                    {form.threeDPuff && <Check className="mr-1.5 inline h-3 w-3" />}
                    {addon.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* First order callout */}
          {isFirstOrder && !isGuest && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
              <p className="text-xs font-semibold text-violet-300">
                ✦ Your first order is on us — this order is free regardless of turnaround speed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Review &amp; confirm</h2>
            <p className="mt-1.5 text-sm text-white/40">Add any notes, upload files, then submit your order.</p>
          </div>

          {/* Guest name/email */}
          {isGuest && (
            <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Your contact details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Full Name <span className="text-red-400">*</span></label>
                  <input className={INPUT} placeholder="Your name" value={form.guestName} onChange={e => set("guestName", e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Email <span className="text-red-400">*</span></label>
                  <input type="email" className={INPUT} placeholder="you@example.com" value={form.guestEmail} onChange={e => set("guestEmail", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Phone (optional)</label>
                <input className={INPUT} placeholder="+1 (555) 000-0000" value={form.guestPhone} onChange={e => set("guestPhone", e.target.value)} />
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Order summary</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Service",     SERVICES.find(s => s.type === form.serviceType)?.title ?? "—"],
                ["Category",    CATEGORIES[form.serviceType as ServiceType]?.find(c => c.slug === form.nicheSlug)?.label ?? "—"],
                ["Design name", form.designTitle || "—"],
                ["Placement",   PLACEMENT_OPTIONS.find(p => p.value === form.placement)?.label ?? "—"],
                ["Fabric",      form.fabric || "—"],
                ["Size",        form.height && form.width ? `${form.height}" × ${form.width}"` : form.height ? `${form.height}"` : "—"],
                ["Turnaround",  TURNAROUNDS.find(t => t.value === form.turnaround)?.label ?? "Standard"],
                ["Colors",      form.colorQuantity || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <span className="text-[11px] text-white/35">{k}</span>
                  <span className="text-xs font-semibold text-white/80 text-right">{v}</span>
                </div>
              ))}
            </div>
            {isFirstOrder && !isGuest && (
              <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-500/[0.06] px-3 py-2">
                <span className="text-xs font-semibold text-teal-300">Estimated total: Free — first order</span>
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <p className={LABEL}>Reference Files</p>
            {isGuest && !form.guestEmail.trim() ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center">
                <p className="text-xs text-white/30">Enter your email above to upload reference files.</p>
              </div>
            ) : (
              <ReferenceFileUploader
                files={form.files}
                onChange={files => set("files", files)}
                guestEmail={isGuest ? form.guestEmail : undefined}
                maxFiles={10}
              />
            )}
            <p className="mt-2 text-[11px] text-white/25">JPG, PNG, PDF, SVG, ZIP · Max 30 MB each · Up to 10 files</p>
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL}>Notes / Special Instructions</label>
            <textarea
              rows={4}
              className={`${INPUT} resize-none`}
              placeholder="Placement details, garment type, color matching, revision instructions..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          {/* Advanced section */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
            >
              <div>
                <p className="text-sm font-semibold text-white/80">Advanced Embroidery Options</p>
                <p className="mt-0.5 text-xs text-white/30">Optional details for professional clients or exact production requirements.</p>
              </div>
              {showAdvanced
                ? <ChevronUp className="h-4 w-4 shrink-0 text-white/40" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
              }
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-white/[0.06] bg-white/[0.01] px-4 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Quantity</label>
                    <input type="number" min="1" className={INPUT} placeholder="e.g. 100" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Color Quantity</label>
                    <input type="number" min="1" className={INPUT} placeholder="Total colors" value={form.colorQuantity} onChange={e => set("colorQuantity", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Thread Brand</label>
                    <input className={INPUT} placeholder="e.g. Madeira, Robison-Anton" value={form.threadBrand} onChange={e => set("threadBrand", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Trims / Underlay</label>
                    <input className={INPUT} placeholder="e.g. zig-zag underlay" value={form.trimsUnderlay} onChange={e => set("trimsUnderlay", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Stitch Count (if known)</label>
                    <input type="number" min="0" className={INPUT} placeholder="e.g. 8000" value={form.stitchCount} onChange={e => set("stitchCount", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Thread Colors</label>
                    <input type="number" min="1" className={INPUT} placeholder="e.g. 4" value={form.threadColors} onChange={e => set("threadColors", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Color / Thread Details</label>
                  <textarea
                    rows={3}
                    className={`${INPUT} resize-none`}
                    placeholder="Describe thread colors, Pantone references, or color matching notes."
                    value={form.colorThreadDetails}
                    onChange={e => set("colorThreadDetails", e.target.value)}
                  />
                </div>

                {/* Output formats */}
                <div>
                  <p className={LABEL}>Output File Formats</p>
                  <div className="flex flex-wrap gap-2">
                    {OUTPUT_FORMATS.map(fmt => {
                      const active = form.outputFormats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => toggleFormat(fmt)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all
                            ${active
                              ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                              : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20"}`}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-white/25">Machine formats. DST and PES selected by default.</p>
                </div>

                {/* Service policy */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Service Policy</p>
                  <ul className="space-y-1.5 text-xs leading-5 text-white/35">
                    <li>· LC to LC same-size adjustment and color change is free</li>
                    <li>· LC to Jacket Back counts as a new design / new order</li>
                    <li>· 3D Puff Jacket Back may require manual review</li>
                    <li>· Final production files remain locked until payment is cleared</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <p className="text-xs font-semibold text-red-400">{serverError}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom action bar ── */}
      <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
        <button
          type="button"
          onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? "Back" : "Cancel"}
        </button>

        {step < 4 ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#070816] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#070816] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Place Order"}
          </button>
        )}
      </div>
    </div>
  );
}
