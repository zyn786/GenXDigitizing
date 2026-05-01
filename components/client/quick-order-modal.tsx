"use client";

import * as React from "react";
import {
  X, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
  Package, Zap, Clock, Check, Layers, MapPin,
} from "lucide-react";

import {
  FABRIC_TYPES,
  PLACEMENT_OPTIONS,
  getNichesForService,
  getDefaultNiche,
  getServiceByType,
  serviceCatalog,
  type ServiceType,
} from "@/lib/quote-order/catalog";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "order" | "quote";

type Props = {
  mode: Mode;
  userName: string;
  userEmail: string;
  triggerClassName?: string;
  triggerLabel?: string;
};

type FormState = {
  serviceType: ServiceType;
  nicheSlug: string;
  designTitle: string;
  placement: string;
  fabricType: string;
  designHeightIn: string;
  designWidthIn: string;
  threeDPuff: boolean;
  turnaround: "STANDARD" | "URGENT" | "SAME_DAY";
  colorQuantity: string;
  notes: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Service"  },
  { num: 2, label: "Design"   },
  { num: 3, label: "Options"  },
  { num: 4, label: "Confirm"  },
] as const;

const TURNAROUND = [
  { id: "STANDARD" as const, label: "Standard",     sub: "24 – 48 hours",     badge: "Free",  Icon: Package, extra: 0,  color: "emerald" },
  { id: "URGENT"   as const, label: "Urgent Rush",  sub: "Same business day", badge: "+$12",  Icon: Clock,   extra: 12, color: "amber"   },
  { id: "SAME_DAY" as const, label: "12-Hour Rush", sub: "Within 12 hours",   badge: "+$24",  Icon: Zap,     extra: 24, color: "rose"    },
] as const;

const SERVICE_META: Record<string, { emoji: string; color: string; hint: string }> = {
  EMBROIDERY_DIGITIZING: { emoji: "🧵", color: "indigo", hint: "Machine-ready stitch files"    },
  VECTOR_ART:            { emoji: "✏️", color: "violet", hint: "Scalable vector artwork"        },
  COLOR_SEPARATION_DTF:  { emoji: "🎨", color: "sky",    hint: "Color sep / DTF screen setup"  },
  CUSTOM_PATCHES:        { emoji: "🪡", color: "teal",   hint: "Patch production quoting"      },
};

const ACCENT: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  indigo:  { border: "border-indigo-400/35",  bg: "bg-indigo-500/10",   text: "text-indigo-300",  ring: "ring-indigo-400/25"  },
  violet:  { border: "border-violet-400/35",  bg: "bg-violet-500/10",   text: "text-violet-300",  ring: "ring-violet-400/25"  },
  sky:     { border: "border-sky-400/35",     bg: "bg-sky-500/10",      text: "text-sky-300",     ring: "ring-sky-400/25"     },
  teal:    { border: "border-teal-400/35",    bg: "bg-teal-500/10",     text: "text-teal-300",    ring: "ring-teal-400/25"    },
  emerald: { border: "border-emerald-400/30", bg: "bg-emerald-500/8",   text: "text-emerald-300", ring: "ring-emerald-400/20" },
  amber:   { border: "border-amber-400/30",   bg: "bg-amber-500/8",     text: "text-amber-300",   ring: "ring-amber-400/20"   },
  rose:    { border: "border-rose-400/30",    bg: "bg-rose-500/8",      text: "text-rose-300",    ring: "ring-rose-400/20"    },
};

function buildDefault(): FormState {
  return {
    serviceType: "EMBROIDERY_DIGITIZING",
    nicheSlug: getDefaultNiche("EMBROIDERY_DIGITIZING"),
    designTitle: "",
    placement: "",
    fabricType: "",
    designHeightIn: "",
    designWidthIn: "",
    threeDPuff: false,
    turnaround: "STANDARD",
    colorQuantity: "",
    notes: "",
  };
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inp =
  "h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.05] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.08] transition-all";

const sel =
  "h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.05] px-4 text-sm text-white outline-none focus:border-white/20 transition-all appearance-none cursor-pointer";

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-2 text-xs font-medium text-white/45">
      {children}
      {required && <span className="ml-1 text-red-400/70">*</span>}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 px-6 pb-4 pt-2">
      {STEPS.map((s, i) => {
        const done    = current > s.num;
        const active  = current === s.num;
        const pending = current < s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                done    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                : active  ? "border-white/30 bg-white text-slate-950 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                :           "border-white/[0.1] bg-white/[0.04] text-white/25"
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : s.num}
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] transition-all ${
                active ? "text-white/70" : done ? "text-emerald-400/60" : "text-white/20"
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-px flex-1 transition-all duration-500 ${done ? "bg-emerald-400/30" : "bg-white/[0.08]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function QuickOrderModal({ mode, userName, userEmail, triggerClassName, triggerLabel }: Props) {
  const [open,        setOpen       ] = React.useState(false);
  const [step,        setStep       ] = React.useState(1);
  const [form,        setForm       ] = React.useState<FormState>(buildDefault);
  const [refFiles,    setRefFiles   ] = React.useState<RefFile[]>([]);
  const [fieldError,  setFieldError ] = React.useState("");
  const [submitting,  setSubmitting ] = React.useState(false);
  const [orderNumber, setOrderNumber] = React.useState("");

  const isEmb          = form.serviceType === "EMBROIDERY_DIGITIZING";
  const niches         = getNichesForService(form.serviceType);
  const activeTAround  = TURNAROUND.find((t) => t.id === form.turnaround)!;
  const svcMeta        = SERVICE_META[form.serviceType] ?? SERVICE_META.EMBROIDERY_DIGITIZING;
  const activeNiche    = niches.find((n) => n.slug === form.nicheSlug);
  const activePlacement= PLACEMENT_OPTIONS.find((p) => p.value === form.placement);
  const estimatedPrice = getServiceByType(form.serviceType).basePrice + activeTAround.extra + (isEmb && form.threeDPuff ? 10 : 0);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldError("");
  }

  function changeService(next: ServiceType) {
    setForm((p) => ({ ...p, serviceType: next, nicheSlug: getDefaultNiche(next), threeDPuff: false }));
    setFieldError("");
  }

  function openModal() {
    setForm(buildDefault());
    setStep(1);
    setRefFiles([]);
    setFieldError("");
    setOrderNumber("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setOrderNumber("");
    setFieldError("");
  }

  function goNext() {
    if (step === 2 && !form.designTitle.trim()) {
      setFieldError("Design title is required.");
      return;
    }
    setFieldError("");
    setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setFieldError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSubmit() {
    setSubmitting(true);
    setFieldError("");

    const payload = {
      mode,
      serviceType:      form.serviceType,
      nicheSlug:        form.nicheSlug,
      turnaround:       form.turnaround,
      customerName:     userName,
      email:            userEmail,
      designTitle:      form.designTitle.trim(),
      notes:            form.notes.trim(),
      quantity:         1,
      sizeInches:       form.designHeightIn
                          ? Math.max(Number(form.designHeightIn), Number(form.designWidthIn || 0))
                          : 4,
      colorCount:       4,
      complexity:       "MEDIUM" as const,
      sourceCleanup:    false,
      smallText:        false,
      threeDPuff:       form.threeDPuff,
      placement:        form.placement   || undefined,
      designHeightIn:   form.designHeightIn ? Number(form.designHeightIn) : undefined,
      designWidthIn:    form.designWidthIn  ? Number(form.designWidthIn)  : undefined,
      fabricType:       form.fabricType  || undefined,
      is3dPuffJacketBack: false,
      trims:            "",
      threadBrand:      "",
      colorDetails:     "",
      colorQuantity:    form.colorQuantity ? Number(form.colorQuantity) : undefined,
      fileFormats:      ["DST", "PES"] as ["DST", "PES"],
      specialInstructions: "",
      referenceFiles:   refFiles,
    };

    try {
      const endpoint = mode === "order" ? "/api/order" : "/api/quote";
      const res  = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (res.status === 401) { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`; return; }
      const json = await res.json() as { ok: boolean; orderNumber?: string; message?: string };
      if (!res.ok || !json.ok) { setFieldError(json.message ?? "Submission failed. Try again."); return; }
      setOrderNumber(json.orderNumber ?? "");
    } catch {
      setFieldError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger */}
      <button
        onClick={openModal}
        className={triggerClassName ?? "inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"}
      >
        {triggerLabel ?? (mode === "order" ? "Order Now" : "New Quote")}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md" onClick={closeModal} aria-hidden />

          {/* Sheet */}
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <div
              className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-t-[2.5rem] border border-white/[0.09] bg-[#060c1a] shadow-[0_48px_180px_rgba(0,0,0,0.85)] sm:rounded-[2.5rem]"
              style={{ maxHeight: "92dvh" }}
            >
              {/* Ambient gradient */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(ellipse_at_85%_100%,rgba(56,189,248,0.09),transparent_55%)]" />

              {/* Pull handle (mobile) */}
              <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-white/10 sm:hidden" />

              {/* Header */}
              <div className="relative flex shrink-0 items-center justify-between px-6 pb-1 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.875rem] bg-white/[0.07]">
                    {mode === "order" ? <Package className="h-4 w-4 text-indigo-300" /> : <Layers className="h-4 w-4 text-sky-300" />}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/30">{mode === "order" ? "Direct order" : "Quote request"}</div>
                    <h2 className="text-base font-bold text-white">{mode === "order" ? "Place a New Order" : "Request a Quote"}</h2>
                  </div>
                </div>
                <button onClick={closeModal} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition hover:bg-white/[0.12] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Success */}
              {orderNumber ? (
                <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-2xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10">
                      <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{mode === "order" ? "Order Confirmed!" : "Quote Submitted!"}</p>
                    <div className="mx-auto mt-3 w-fit rounded-xl border border-white/10 bg-white/[0.05] px-4 py-1.5 font-mono text-sm text-white/45">{orderNumber}</div>
                    <p className="mt-4 text-sm leading-6 text-white/45">
                      {mode === "order" ? "Your order is in our queue. We'll begin production shortly." : "We'll review your request and send pricing within 1 business day."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <a href={mode === "order" ? "/client/orders" : "/client/quotes"} className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-slate-950 transition hover:bg-white/90">
                      {mode === "order" ? "My Orders" : "My Quotes"}
                    </a>
                    <button onClick={() => { setOrderNumber(""); setStep(1); setForm(buildDefault()); }} className="inline-flex h-11 items-center rounded-full border border-white/12 px-5 text-sm text-white/55 transition hover:text-white">
                      Submit Another
                    </button>
                  </div>
                </div>
              ) : (

              <form onSubmit={(e) => e.preventDefault()} className="relative flex flex-1 flex-col overflow-hidden">

                {/* Step indicator */}
                <StepIndicator current={step} />

                {/* Divider */}
                <div className="mx-6 mb-5 h-px bg-white/[0.07]" />

                {/* Step content */}
                <div className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">

                  {/* ── STEP 1: Service ─────────────────────────────────── */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <p className="mb-1 text-lg font-semibold text-white">What service do you need?</p>
                        <p className="text-sm text-white/40">Choose the type of design work, then pick your category.</p>
                      </div>

                      {/* Service cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {(serviceCatalog as readonly { type: string; label: string }[]).map((s) => {
                          const meta   = SERVICE_META[s.type] ?? { emoji: "📋", color: "indigo", hint: "" };
                          const a      = ACCENT[meta.color] ?? ACCENT.indigo;
                          const active = form.serviceType === s.type;
                          return (
                            <button
                              key={s.type}
                              type="button"
                              onClick={() => changeService(s.type as ServiceType)}
                              className={`group relative flex flex-col gap-2.5 rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                                active
                                  ? `${a.border} ${a.bg} shadow-sm ring-1 ${a.ring}`
                                  : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.13] hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="text-2xl leading-none">{meta.emoji}</span>
                              <div>
                                <div className={`text-xs font-bold leading-snug ${active ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>{s.label}</div>
                                <div className={`mt-0.5 text-[10px] ${active ? a.text : "text-white/30"}`}>{meta.hint}</div>
                              </div>
                              {active && (
                                <div className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${a.bg} ${a.border}`}>
                                  <Check className={`h-3 w-3 ${a.text}`} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Category pills */}
                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {niches.map((n) => {
                            const active = form.nicheSlug === n.slug;
                            return (
                              <button
                                key={n.slug}
                                type="button"
                                onClick={() => set("nicheSlug", n.slug)}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                                  active
                                    ? "border-white/25 bg-white text-slate-950 shadow-sm"
                                    : "border-white/[0.09] bg-white/[0.04] text-white/50 hover:border-white/[0.16] hover:text-white/80"
                                }`}
                              >
                                {n.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: Design ──────────────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-lg font-semibold text-white">Tell us about your design</p>
                        <p className="text-sm text-white/40">Dimensions and placement help us price your design accurately.</p>
                      </div>

                      {/* Design title */}
                      <div>
                        <FieldLabel required>Design Title</FieldLabel>
                        <input
                          autoFocus
                          value={form.designTitle}
                          onChange={(e) => set("designTitle", e.target.value)}
                          placeholder="e.g. GenX Apparel — Spring cap logo"
                          className={inp}
                        />
                        {fieldError && <p className="mt-2 text-xs text-red-400">{fieldError}</p>}
                      </div>

                      {/* Placement + Fabric */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Placement</FieldLabel>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                            <select value={form.placement} onChange={(e) => set("placement", e.target.value)} className={`${sel} pl-9`}>
                              <option value="" className="bg-[#060c1a]">— Select —</option>
                              {PLACEMENT_OPTIONS.map((p) => (
                                <option key={p.value} value={p.value} className="bg-[#060c1a]">{p.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <FieldLabel>Fabric</FieldLabel>
                          <select value={form.fabricType} onChange={(e) => set("fabricType", e.target.value)} className={sel}>
                            <option value="" className="bg-[#060c1a]">— Select —</option>
                            {FABRIC_TYPES.map((f) => (
                              <option key={f} value={f} className="bg-[#060c1a]">{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Dimensions */}
                      <div>
                        <FieldLabel>Size (inches)</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input type="number" min={0.5} max={24} step={0.25} value={form.designHeightIn} onChange={(e) => set("designHeightIn", e.target.value)} placeholder="Height" className={inp} />
                          <span className="shrink-0 text-sm font-medium text-white/20">×</span>
                          <input type="number" min={0.5} max={24} step={0.25} value={form.designWidthIn}  onChange={(e) => set("designWidthIn",  e.target.value)} placeholder="Width"  className={inp} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Options ─────────────────────────────────── */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <p className="mb-1 text-lg font-semibold text-white">Production options</p>
                        <p className="text-sm text-white/40">Set add-ons and choose your turnaround speed.</p>
                      </div>

                      {/* 3D Puff + Color qty */}
                      <div className="grid grid-cols-2 gap-3">
                        {isEmb && (
                          <div>
                            <FieldLabel>3D Puff Add-on (+$10)</FieldLabel>
                            <div className="flex gap-2">
                              {(["Yes", "No"] as const).map((v) => {
                                const active = v === "Yes" ? form.threeDPuff : !form.threeDPuff;
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => set("threeDPuff", v === "Yes")}
                                    className={`h-12 flex-1 rounded-2xl border text-sm font-semibold transition-all ${
                                      active
                                        ? "border-indigo-400/35 bg-indigo-500/10 text-indigo-200 shadow-sm"
                                        : "border-white/[0.09] bg-white/[0.04] text-white/35 hover:border-white/[0.14] hover:text-white/60"
                                    }`}
                                  >
                                    {v}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className={isEmb ? "" : "col-span-2"}>
                          <FieldLabel>Color Quantity</FieldLabel>
                          <input type="number" min={0} max={50} value={form.colorQuantity} onChange={(e) => set("colorQuantity", e.target.value)} placeholder="Total colors" className={inp} />
                        </div>
                      </div>

                      {/* Turnaround */}
                      <div>
                        <FieldLabel>Turnaround Speed</FieldLabel>
                        <div className="space-y-2">
                          {TURNAROUND.map((t) => {
                            const active = form.turnaround === t.id;
                            const a      = ACCENT[t.color] ?? ACCENT.emerald;
                            const Icon   = t.Icon;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => set("turnaround", t.id)}
                                className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                                  active
                                    ? `${a.border} ${a.bg} ring-1 ${a.ring}`
                                    : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
                                }`}
                              >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${active ? `${a.bg} ${a.border}` : "bg-white/[0.06]"}`}>
                                  <Icon className={`h-4 w-4 ${active ? a.text : "text-white/25"}`} />
                                </div>
                                <div className="flex-1">
                                  <div className={`text-sm font-semibold ${active ? "text-white" : "text-white/55"}`}>{t.label}</div>
                                  <div className="mt-0.5 text-xs text-white/30">{t.sub}</div>
                                </div>
                                <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${active ? `${a.border} ${a.text}` : "border-white/[0.08] text-white/25"}`}>
                                  {t.badge}
                                </span>
                                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${active ? "border-white bg-white" : "border-white/20"}`}>
                                  {active && <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 4: Confirm ─────────────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-lg font-semibold text-white">Review &amp; confirm</p>
                        <p className="text-sm text-white/40">Add any notes, then submit your {mode === "order" ? "order" : "quote request"}.</p>
                      </div>

                      {/* Summary card */}
                      <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] divide-y divide-white/[0.06]">
                        <SummaryRow label="Service" value={`${svcMeta.emoji} ${(serviceCatalog as readonly { type: string; label: string }[]).find((s) => s.type === form.serviceType)?.label ?? ""}`} />
                        <SummaryRow label="Category" value={activeNiche?.label ?? "—"} />
                        <SummaryRow label="Design" value={form.designTitle || "—"} highlight />
                        {activePlacement && <SummaryRow label="Placement" value={activePlacement.label} />}
                        {form.fabricType && <SummaryRow label="Fabric" value={form.fabricType} />}
                        {(form.designHeightIn || form.designWidthIn) && (
                          <SummaryRow label="Size" value={`${form.designHeightIn || "?"}" × ${form.designWidthIn || "?"}"  `} />
                        )}
                        {isEmb && <SummaryRow label="3D Puff" value={form.threeDPuff ? "Yes (+$10)" : "No"} />}
                        {form.colorQuantity && <SummaryRow label="Colors" value={form.colorQuantity} />}
                        <SummaryRow label="Turnaround" value={`${activeTAround.label} · ${activeTAround.badge}`} accent />
                        {mode === "order" && (
                          <SummaryRow label="Est. Total" value={`$${estimatedPrice}`} highlight />
                        )}
                      </div>

                      {/* Reference files */}
                      <div>
                        <FieldLabel>Reference files <span className="text-white/25 font-normal normal-case tracking-normal">(optional — artwork, mockups, inspiration)</span></FieldLabel>
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                          <ReferenceFileUploader
                            files={refFiles}
                            onChange={setRefFiles}
                            maxFiles={10}
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <FieldLabel>Notes / Special Instructions <span className="text-white/25 font-normal normal-case tracking-normal">(optional)</span></FieldLabel>
                        <textarea
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          rows={3}
                          placeholder="Placement details, garment type, color matching, revision instructions…"
                          className="w-full resize-none rounded-2xl border border-white/[0.09] bg-white/[0.05] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.08] transition-all"
                        />
                      </div>

                      {/* Policy */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Unlimited revisions included",
                          "Color change is free",
                          "LC same-size adjustment free",
                          "LC → Jacket Back = new order",
                        ].map((p, i) => (
                          <div key={i} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] ${i < 3 ? "border-emerald-400/15 bg-emerald-500/[0.05] text-emerald-300/60" : "border-amber-400/15 bg-amber-500/[0.05] text-amber-300/60"}`}>
                            <span className="mt-0.5 shrink-0">{i < 3 ? "✓" : "!"}</span>
                            {p}
                          </div>
                        ))}
                      </div>

                      {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                    </div>
                  )}

                </div>

                {/* Footer nav */}
                <div className="relative shrink-0 border-t border-white/[0.07] bg-[#060c1a]/95 px-6 py-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    {/* Back */}
                    {step > 1 ? (
                      <button type="button" onClick={goBack} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-5 text-sm text-white/50 transition hover:border-white/[0.15] hover:text-white/80">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    ) : (
                      <div className="flex-1 text-xs text-white/25">Step {step} of {STEPS.length}</div>
                    )}

                    <div className="flex-1" />

                    {/* Next or Submit */}
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <>{mode === "order" ? "Place Order" : "Submit Quote"} <ArrowRight className="h-4 w-4" /></>
                        }
                      </button>
                    )}
                  </div>
                </div>

              </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value, highlight, accent }: { label: string; value: string; highlight?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-white/35">{label}</span>
      <span className={`max-w-[60%] truncate text-right text-xs font-semibold ${highlight ? "text-white" : accent ? "text-indigo-300" : "text-white/65"}`}>
        {value}
      </span>
    </div>
  );
}
