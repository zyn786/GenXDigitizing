"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, ArrowLeft, Loader2, Sparkles, Zap, Clock, Tag } from "lucide-react";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";
import type { PricingCatalog } from "@/lib/pricing/catalog";

/* ─────────────────────────────── Types ─────────────────────────────── */

type ServiceType = "EMBROIDERY_DIGITIZING" | "VECTOR_ART" | "COLOR_SEPARATION_DTF" | "CUSTOM_PATCHES";
type Turnaround  = "STANDARD" | "URGENT" | "SAME_DAY";

interface WizardForm {
  serviceType:        ServiceType | "";
  nicheSlug:          string;
  pricingTierKey:     string;
  designTitle:        string;
  placement:          string;
  fabric:             string;
  height:             string;
  width:              string;
  turnaround:         Turnaround;
  colorQuantity:      string;
  threeDPuff:         boolean;
  notes:              string;
  quantity:           string;
  threadBrand:        string;
  trimsUnderlay:      string;
  stitchCount:        string;
  threadColors:       string;
  colorThreadDetails: string;
  outputFormats:      string[];
  files:              RefFile[];
  guestName:          string;
  guestEmail:         string;
  guestPhone:         string;
}

export interface OrderWizardProps {
  user?:         { name?: string | null; email?: string | null } | null;
  isFirstOrder?: boolean;
  catalog?:      PricingCatalog;
  onComplete?:   () => void;
}

/* ─────────────────────────────── Data ──────────────────────────────── */

const SERVICES: { type: ServiceType; title: string; subtitle: string; icon: string }[] = [
  { type: "EMBROIDERY_DIGITIZING",  title: "Embroidery Digitizing", subtitle: "Machine-ready stitch files",   icon: "🧵" },
  { type: "VECTOR_ART",             title: "Vector Art Conversion",  subtitle: "Scalable vector artwork",      icon: "✏️" },
  { type: "COLOR_SEPARATION_DTF",   title: "Color Sep / DTF",        subtitle: "Color sep & DTF screen setup", icon: "🎨" },
  { type: "CUSTOM_PATCHES",         title: "Custom Patches",          subtitle: "Patch production quoting",     icon: "🏷️" },
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

/* wizard serviceType → catalog category key */
const SERVICE_TO_CATALOG: Record<ServiceType, string | null> = {
  EMBROIDERY_DIGITIZING: "EMBROIDERY_DIGITIZING",
  VECTOR_ART:            "VECTOR_REDRAW",
  COLOR_SEPARATION_DTF:  "DTF_SCREEN_PRINT",
  CUSTOM_PATCHES:        null,
};

/* wizard Turnaround → catalog delivery key */
const TURNAROUND_TO_DELIVERY: Record<Turnaround, string> = {
  STANDARD: "Standard",
  URGENT:   "Rush",
  SAME_DAY: "Urgent",
};

const TURNAROUND_META: Record<Turnaround, { label: string; hours: string; icon: typeof Clock }> = {
  STANDARD: { label: "Standard",  hours: "12/15-hour delivery", icon: Clock },
  URGENT:   { label: "Rush",      hours: "6-hour delivery",  icon: Zap },
  SAME_DAY: { label: "Urgent",  hours: "3-hour delivery",  icon: Sparkles },
};

const TURNAROUND_ORDER: Turnaround[] = ["STANDARD", "URGENT", "SAME_DAY"];

const PLACEMENT_OPTIONS = [
  { value: "HAT_FRONT",    label: "Cap / Hat" },
  { value: "LEFT_CHEST",   label: "Left Chest" },
  { value: "JACKET_BACK",  label: "Jacket Back" },
  { value: "LARGE_DESIGN", label: "Large Design" },
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

const INPUT  = "w-full rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition";
const SELECT = "w-full rounded-xl border border-white/[0.10] bg-[#0d0f1e] px-4 py-3 text-sm text-white focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition appearance-none cursor-pointer";
const LABEL  = "block text-[10px] font-black uppercase tracking-[0.16em] text-white/70 mb-2";

/* ────────────────────── Pricing helpers ────────────────────────────── */

function getCatalogCategory(serviceType: ServiceType | "", catalog: PricingCatalog | undefined) {
  if (!serviceType || !catalog) return null;
  const key = SERVICE_TO_CATALOG[serviceType];
  if (!key) return null;
  return catalog.categories.find((c) => c.key === key && c.isActive) ?? null;
}

function getDeliveryExtra(turnaround: Turnaround, catalog: PricingCatalog | undefined): number {
  if (!catalog) {
    return turnaround === "URGENT" ? 12 : turnaround === "SAME_DAY" ? 24 : 0;
  }
  const key = TURNAROUND_TO_DELIVERY[turnaround];
  const opt = catalog.delivery.find((d) => d.key === key && d.isActive);
  return opt ? Number(opt.extraPrice) : 0;
}

function computeEstimate(form: WizardForm, catalog: PricingCatalog | undefined): number | null {
  if (!form.serviceType || form.serviceType === "CUSTOM_PATCHES") return null;
  const cat = getCatalogCategory(form.serviceType, catalog);
  if (!cat) return null;
  const tier = cat.tiers.find((t) => t.key === form.pricingTierKey && t.isActive);
  if (!tier) return null;
  let total = tier.price;
  total += getDeliveryExtra(form.turnaround, catalog);
  if (form.threeDPuff && form.serviceType === "EMBROIDERY_DIGITIZING") total += 10;
  return total;
}

/* ─────────────────────────── Component ─────────────────────────────── */

export function OrderWizard({ user, isFirstOrder, catalog, onComplete }: OrderWizardProps) {
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
    pricingTierKey:     "",
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

  /* ── Derived pricing ──────────────────────────────────────────────── */
  const catalogCategory = getCatalogCategory(form.serviceType, catalog);
  const estimatedTotal  = computeEstimate(form, catalog);
  const showEstimate    = estimatedTotal !== null && !isFirstOrder;

  /* ── Success screen ─────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-7 px-6 py-16 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" style={{ animationDuration: "2s" }} />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 shadow-xl shadow-teal-500/20">
            <Check className="h-10 w-10 text-teal-400" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            <Sparkles className="h-3 w-3" />
            Order Confirmed
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            You&apos;re all set!
          </h2>
          {orderRef && (
            <p className="font-mono text-sm text-white/60">{orderRef}</p>
          )}
          <p className="mx-auto max-w-xs text-sm leading-7 text-white/70">
            We&apos;ll review your order and deliver a proof within the turnaround window you selected.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {!isGuest && (
            <Link
              href="/client/orders"
              onClick={() => onComplete?.()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
            >
              View My Orders
            </Link>
          )}
          <button
            onClick={() => { setSubmitted(false); setStep(1); setForm(f => ({ ...f, files: [], notes: "", designTitle: "", pricingTierKey: "" })); }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-6 text-sm font-semibold text-white/60 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white/80"
          >
            Submit Another
          </button>
          {onComplete && (
            <button
              onClick={onComplete}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-6 text-sm font-semibold text-white/60 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white/80"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Step content ───────────────────────────────────────────────── */
  const categories = form.serviceType ? CATEGORIES[form.serviceType] : [];
  const progressPct = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="w-full">

      {/* ── Step indicator ── */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">
            <Sparkles className="h-3 w-3" />
            Step {step} of {STEP_LABELS.length}
          </div>
          <span className="text-[11px] font-semibold text-white/60">{STEP_LABELS[step - 1]}</span>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progressPct === 0 ? 8 : progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between px-0.5">
          {STEP_LABELS.map((label, i) => {
            const n         = i + 1;
            const completed = step > n;
            const current   = step === n;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all
                    ${completed
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                      : current
                      ? "border-2 border-indigo-500 bg-indigo-500/15 text-indigo-300"
                      : "border border-white/15 text-white/20"}`}
                >
                  {completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
                </div>
                <span className={`hidden text-[9px] font-black uppercase tracking-[0.14em] sm:block
                  ${completed ? "text-teal-400" : current ? "text-indigo-300" : "text-white/20"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Service ── */}
      {step === 1 && (
        <div className="space-y-7">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Place a New Order</h2>
            <p className="mt-1.5 text-sm text-white/65">Select a service and pick your category to get started.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SERVICES.map(svc => {
              const selected = form.serviceType === svc.type;
              const catKey = SERVICE_TO_CATALOG[svc.type];
              const catalogCat = catKey ? catalog?.categories.find(c => c.key === catKey && c.isActive) : null;
              const startingPrice = catalogCat?.tiers[0]?.price;
              return (
                <button
                  key={svc.type}
                  type="button"
                  onClick={() => { set("serviceType", svc.type); set("nicheSlug", ""); set("pricingTierKey", ""); }}
                  className={`group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200
                    ${selected
                      ? "border-indigo-500/50 bg-indigo-500/[0.10] shadow-lg shadow-indigo-500/10"
                      : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"}`}
                >
                  {selected && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl
                    ${selected ? "bg-indigo-500/15" : "bg-white/[0.05] group-hover:bg-white/[0.08]"}`}>
                    {svc.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black tracking-tight text-white">{svc.title}</div>
                    <div className="mt-0.5 text-xs text-white/65">{svc.subtitle}</div>
                    {startingPrice !== undefined && (
                      <div className="mt-1.5 text-[10px] font-black text-indigo-300/70">
                        From ${startingPrice}
                      </div>
                    )}
                    {catKey === null && (
                      <div className="mt-1.5 text-[10px] font-black text-white/60">
                        Custom quote
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {form.serviceType && (
            <div>
              <p className={LABEL}>Category <span className="text-red-400">*</span></p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const selected = form.nicheSlug === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => set("nicheSlug", cat.slug)}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition-all
                        ${selected
                          ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300 shadow-sm shadow-indigo-500/20"
                          : "border-white/[0.09] bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"}`}
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
            <h2 className="text-2xl font-black tracking-tight text-white">Tell us about your design</h2>
            <p className="mt-1.5 text-sm text-white/65">Dimensions and placement help us price and produce your design accurately.</p>
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
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
        <div className="space-y-7">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Production options</h2>
            <p className="mt-1.5 text-sm text-white/65">Choose your service tier and turnaround speed.</p>
          </div>

          {/* First order callout */}
          {isFirstOrder && !isGuest && (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.08] px-4 py-3.5">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-300" />
              <p className="text-xs font-bold text-indigo-200">
                Your first order is on us — this order is free regardless of turnaround speed.
              </p>
            </div>
          )}

          {/* Pricing tiers from catalog */}
          {catalogCategory ? (
            <div>
              <p className={LABEL}>Service Tier</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {catalogCategory.tiers.filter(t => t.isActive).map((tier) => {
                  const selected = form.pricingTierKey === tier.key;
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => set("pricingTierKey", tier.key)}
                      className={`relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200
                        ${selected
                          ? "border-indigo-500/50 bg-indigo-500/[0.10] shadow-lg shadow-indigo-500/10"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"}`}
                    >
                      {selected && (
                        <div className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl
                        ${selected ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/65"}`}>
                        <Tag className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black tracking-tight text-white leading-tight">{tier.label}</div>
                      </div>
                      <div className={`self-start rounded-full border px-2.5 py-1 text-[11px] font-black
                        ${selected
                          ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-200"
                          : "border-white/[0.08] bg-white/[0.04] text-white/50"}`}>
                        ${tier.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : form.serviceType === "CUSTOM_PATCHES" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
              <Tag className="h-4 w-4 shrink-0 text-white/60" />
              <p className="text-xs text-white/65">Patches are custom-quoted — pricing provided after we review your design.</p>
            </div>
          ) : null}

          {/* Turnaround */}
          <div>
            <p className={LABEL}>Turnaround Speed</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {TURNAROUND_ORDER.map(t => {
                const selected = form.turnaround === t;
                const meta = TURNAROUND_META[t];
                const Icon = meta.icon;
                const extra = getDeliveryExtra(t, catalog);
                const deliveryKey = TURNAROUND_TO_DELIVERY[t];
                const deliveryOpt = catalog?.delivery.find(d => d.key === deliveryKey);
                const isAvailable = !catalog || !!deliveryOpt?.isActive || t === "STANDARD";
                const badgeLabel = extra === 0 ? "No rush fee" : `+$${extra}`;
                const hoursLabel = deliveryOpt?.subLabel ?? meta.hours;

                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => set("turnaround", t)}
                    className={`relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200
                      ${!isAvailable ? "cursor-not-allowed opacity-40" :
                        selected
                          ? "border-indigo-500/50 bg-indigo-500/[0.10] shadow-lg shadow-indigo-500/10"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"}`}
                  >
                    {selected && isAvailable && (
                      <div className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl
                      ${selected ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/65"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black tracking-tight text-white">{meta.label}</div>
                      <div className="mt-0.5 text-xs text-white/65">{hoursLabel}</div>
                    </div>
                    <div className={`self-start rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide
                      ${selected
                        ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                        : "border-white/[0.08] bg-white/[0.04] text-white/60"}`}>
                      {badgeLabel}
                    </div>
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

          {/* 3D Puff add-on */}
          {form.serviceType === "EMBROIDERY_DIGITIZING" && (
            <div>
              <p className={LABEL}>Add-ons</p>
              <button
                type="button"
                onClick={() => set("threeDPuff", !form.threeDPuff)}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm transition-all
                  ${form.threeDPuff
                    ? "border-indigo-500/50 bg-indigo-500/[0.10] text-indigo-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/15 hover:text-white/70"}`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all
                  ${form.threeDPuff ? "border-indigo-500 bg-indigo-500" : "border-white/20"}`}>
                  {form.threeDPuff && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span className="font-bold">3D Puff Digitizing</span>
                <span className="ml-auto text-xs text-white/60">+$10</span>
              </button>
            </div>
          )}

          {/* Live price estimate pill */}
          {showEstimate && form.pricingTierKey && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] px-4 py-3">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300/70">Estimated total</span>
              <span className="text-lg font-black text-white">${estimatedTotal}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Review &amp; confirm</h2>
            <p className="mt-1.5 text-sm text-white/65">Add any notes, upload your files, then place your order.</p>
          </div>

          {/* Guest contact */}
          {isGuest && (
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className={LABEL}>Your contact details</p>
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
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className={LABEL}>Order summary</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Service",     SERVICES.find(s => s.type === form.serviceType)?.title ?? "—"],
                ["Category",    CATEGORIES[form.serviceType as ServiceType]?.find(c => c.slug === form.nicheSlug)?.label ?? "—"],
                ["Design name", form.designTitle || "—"],
                ["Placement",   PLACEMENT_OPTIONS.find(p => p.value === form.placement)?.label ?? "—"],
                ["Fabric",      form.fabric || "—"],
                ["Size",        form.height && form.width ? `${form.height}" × ${form.width}"` : form.height ? `${form.height}"` : "—"],
                ["Turnaround",  TURNAROUND_META[form.turnaround]?.label ?? "Standard"],
                ["Colors",      form.colorQuantity || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/60">{k}</span>
                  <span className="text-xs font-bold text-white/75 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            {isFirstOrder && !isGuest ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/[0.07] px-3 py-2.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span className="text-xs font-bold text-teal-300">Estimated total: Free — first order promotion applied</span>
              </div>
            ) : estimatedTotal !== null && form.pricingTierKey ? (
              <div className="mt-3 space-y-1.5">
                {/* Tier line */}
                {(() => {
                  const tier = catalogCategory?.tiers.find(t => t.key === form.pricingTierKey);
                  const rushExtra = getDeliveryExtra(form.turnaround, catalog);
                  return (
                    <>
                      {tier && (
                        <div className="flex items-center justify-between px-1 text-xs text-white/65">
                          <span>{tier.label}</span>
                          <span className="font-bold">${tier.price}</span>
                        </div>
                      )}
                      {rushExtra > 0 && (
                        <div className="flex items-center justify-between px-1 text-xs text-white/65">
                          <span>{TURNAROUND_META[form.turnaround].label} delivery</span>
                          <span className="font-bold">+${rushExtra}</span>
                        </div>
                      )}
                      {form.threeDPuff && form.serviceType === "EMBROIDERY_DIGITIZING" && (
                        <div className="flex items-center justify-between px-1 text-xs text-white/65">
                          <span>3D Puff add-on</span>
                          <span className="font-bold">+$10</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] px-3 py-2 mt-2">
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-indigo-300/80">Estimated total</span>
                        <span className="text-sm font-black text-white">${estimatedTotal}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>

          {/* File upload */}
          <div>
            <p className={LABEL}>Reference Files</p>
            {isGuest && !form.guestEmail.trim() ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center">
                <p className="text-xs text-white/60">Enter your email above to upload reference files.</p>
              </div>
            ) : (
              <ReferenceFileUploader
                files={form.files}
                onChange={files => set("files", files)}
                guestEmail={isGuest ? form.guestEmail : undefined}
                maxFiles={10}
              />
            )}
            <p className="mt-2 text-[11px] text-white/60">JPG, PNG, PDF, SVG, ZIP · Max 30 MB each · Up to 10 files</p>
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
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02]"
            >
              <div>
                <p className="text-sm font-black tracking-tight text-white/80">Advanced Embroidery Options</p>
                <p className="mt-0.5 text-xs text-white/60">Thread brand, stitch count, output formats, and more.</p>
              </div>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all
                ${showAdvanced ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" : "border-white/10 text-white/60"}`}>
                {showAdvanced
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />
                }
              </div>
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-white/[0.06] bg-white/[0.01] px-5 py-5">
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
                          className={`rounded-full border px-3 py-1.5 text-xs font-black transition-all
                            ${active
                              ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                              : "border-white/[0.08] bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white/70"}`}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-white/60">DST and PES selected by default.</p>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className={`${LABEL} mb-3`}>Service Policy</p>
                  <ul className="space-y-2 text-xs leading-5 text-white/60">
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400/60">·</span> Changing placement (e.g. Left Chest → Jacket Back) counts as a new design</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400/60">·</span> 3D Puff Jacket Back may require manual review and is a premium service</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400/60">·</span> Final production files are released after payment is cleared</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3.5">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
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
          className="flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white/75"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? "Back" : "Cancel"}
        </button>

        {step < 4 ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Place Order"}
          </button>
        )}
      </div>
    </div>
  );
}
