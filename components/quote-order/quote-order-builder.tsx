"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Info, Package, Save, Zap } from "lucide-react";

import {
  FABRIC_TYPES,
  FILE_FORMAT_OPTIONS,
  PLACEMENT_OPTIONS,
  getDefaultNiche,
  getNichesForService,
  getPlacementMeta,
  getServiceByType,
  serviceCatalog,
  type ServiceType,
  type TurnaroundType,
} from "@/lib/quote-order/catalog";
import { computeQuotePricing } from "@/lib/quote-order/pricing";
import { quoteOrderSchema, type QuoteOrderInput } from "@/schemas/quote-order";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

type BuilderMode = "quote" | "order";

function getDraftKey(mode: BuilderMode) {
  return `genx-v2-${mode}-draft`;
}

function buildDefaultValues(mode: BuilderMode): QuoteOrderInput {
  return {
    mode,
    serviceType: "EMBROIDERY_DIGITIZING",
    nicheSlug: getDefaultNiche("EMBROIDERY_DIGITIZING"),
    turnaround: "STANDARD",
    customerName: "",
    email: "",
    companyName: "",
    designTitle: "",
    notes: "",
    quantity: 1,
    sizeInches: 4,
    colorCount: 4,
    complexity: "MEDIUM",
    sourceCleanup: false,
    smallText: false,
    threeDPuff: false,
    placement: "",
    designHeightIn: undefined,
    designWidthIn: undefined,
    fabricType: "",
    is3dPuffJacketBack: false,
    trims: "",
    threadBrand: "",
    colorDetails: "",
    colorQuantity: undefined,
    fileFormats: ["DST", "PES"],
    stitchCount: undefined,
    specialInstructions: "",
    leadSource: undefined,
  };
}

function getInitialValues(mode: BuilderMode): QuoteOrderInput {
  const defaults = buildDefaultValues(mode);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(getDraftKey(mode));
    if (!raw) return defaults;
    const parsed = quoteOrderSchema.partial().safeParse(JSON.parse(raw));
    if (!parsed.success) return defaults;
    return { ...defaults, ...parsed.data, mode } as QuoteOrderInput;
  } catch {
    return defaults;
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function InputClass() {
  return "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.09] transition";
}

function LabelClass() {
  return "grid gap-2";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
      <span className="h-px flex-1 bg-white/10" />
      {children}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function QuoteOrderBuilder({ mode }: { mode: BuilderMode }) {
  const draftKey = React.useMemo(() => getDraftKey(mode), [mode]);

  const [values, setValues] = React.useState<QuoteOrderInput>(() => getInitialValues(mode));
  const [submitState, setSubmitState] = React.useState<{ type: "idle" | "success" | "error"; text: string }>({ type: "idle", text: "" });
  const [savingState, setSavingState] = React.useState("");
  const [orderResult, setOrderResult] = React.useState<{ orderNumber: string; isFreeDesign: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [refFiles, setRefFiles] = React.useState<RefFile[]>([]);

  const pricing = React.useMemo(() => computeQuotePricing(values), [values]);
  const service = getServiceByType(values.serviceType);
  const placementMeta = values.placement ? getPlacementMeta(values.placement) : null;
  const sizeWarning = placementMeta && values.sizeInches > placementMeta.maxSizeIn
    ? `${placementMeta.label} typically fits up to ${placementMeta.maxSizeIn}". Current size may require special handling.`
    : null;

  function update<K extends keyof QuoteOrderInput>(key: K, val: QuoteOrderInput[K]) {
    setValues((cur) => ({ ...cur, [key]: val }));
  }

  function updateService(nextType: ServiceType) {
    setValues((cur) => ({
      ...cur,
      serviceType: nextType,
      nicheSlug: getDefaultNiche(nextType),
      threeDPuff: nextType === "EMBROIDERY_DIGITIZING" ? cur.threeDPuff : false,
      smallText: nextType === "EMBROIDERY_DIGITIZING" ? cur.smallText : false,
    }));
  }

  function toggleFileFormat(fmt: string) {
    const fmts = values.fileFormats as string[];
    const next = fmts.includes(fmt) ? fmts.filter((f) => f !== fmt) : [...fmts, fmt];
    update("fileFormats", next as QuoteOrderInput["fileFormats"]);
  }

  function handlePlacementChange(val: string) {
    const meta = getPlacementMeta(val);
    update("placement", val);
    update("is3dPuffJacketBack", meta.is3DPuffJacketBack);
    // Auto-clamp size to placement max if current is over
    if (values.sizeInches > meta.maxSizeIn) {
      update("sizeInches", meta.maxSizeIn);
    }
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify(values));
    setSavingState("Draft saved.");
    window.setTimeout(() => setSavingState(""), 1800);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ type: "idle", text: "" });
    setOrderResult(null);

    const parsed = quoteOrderSchema.safeParse(values);
    if (!parsed.success) {
      setSubmitState({ type: "error", text: "Please complete all required fields." });
      return;
    }

    const endpoint = mode === "quote" ? "/api/quote" : "/api/order";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...parsed.data, referenceFiles: refFiles }),
    });

    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const result = (await res.json()) as {
      ok: boolean; message?: string;
      orderNumber?: string; isFreeDesign?: boolean;
    };

    if (!res.ok || !result.ok) {
      setSubmitState({ type: "error", text: result.message ?? "Unable to submit right now." });
      return;
    }

    window.localStorage.removeItem(draftKey);
    setSubmitState({ type: "success", text: result.message ?? "Submitted." });
    if (result.orderNumber) {
      setOrderResult({ orderNumber: result.orderNumber, isFreeDesign: !!result.isFreeDesign });
    }
  }

  if (orderResult) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#070816] text-white flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(83,173,255,0.22),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(190,90,255,0.20),transparent_24%)]" />
        <section className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          {orderResult.isFreeDesign && (
            <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              Your first design is <strong>on us!</strong> Free design applied.
            </div>
          )}
          <h2 className="text-2xl font-bold text-white">
            {mode === "quote" ? "Quote request submitted!" : "Order confirmed!"}
          </h2>
          <p className="mt-2 text-sm text-white/60">{submitState.text}</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">Reference number</div>
            <div className="mt-2 font-mono text-xl font-bold text-white">{orderResult.orderNumber}</div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href={"/client/orders" as Route}
              className="flex-1 rounded-full bg-white py-3 text-sm font-bold text-slate-950 transition hover:bg-white/90"
            >
              View My Orders
            </Link>
            <button
              onClick={() => { setOrderResult(null); setValues(buildDefaultValues(mode)); }}
              className="flex-1 rounded-full border border-white/10 bg-white/[0.05] py-3 text-sm text-white transition hover:bg-white/[0.1]"
            >
              New Order
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(83,173,255,0.22),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(190,90,255,0.20),transparent_24%),linear-gradient(180deg,#07101f_0%,#090611_40%,#0a0d1c_100%)]" />
      <div className="relative z-10 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-white/45">
                {mode === "quote" ? "Get a quote" : "Place an order"}
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
                {mode === "quote" ? "Request a Quote" : "Start a Direct Order"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
                {mode === "quote"
                  ? "Tell us about your artwork and we'll send a firm price within one business day."
                  : "Submit your artwork and production requirements — we'll confirm turnaround and start production."}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={"/quote" as Route} className={`inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition ${mode === "quote" ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>
                Quote
              </Link>
              <Link href={"/order" as Route} className={`inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition ${mode === "order" ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>
                Order
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={submitForm} className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="grid gap-8">

                {/* ── Service & Niche ─────────────────────────────────── */}
                <div>
                  <SectionLabel>Service</SectionLabel>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Service type <span className="text-red-400">*</span></span>
                      <select value={values.serviceType} onChange={(e) => updateService(e.target.value as ServiceType)} className={InputClass()}>
                        {serviceCatalog.map((item) => (
                          <option key={item.type} value={item.type} className="text-slate-950">{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Niche / category <span className="text-red-400">*</span></span>
                      <select value={values.nicheSlug} onChange={(e) => update("nicheSlug", e.target.value)} className={InputClass()}>
                        {getNichesForService(values.serviceType).map((item) => (
                          <option key={item.slug} value={item.slug} className="text-slate-950">{item.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* ── Contact ─────────────────────────────────────────── */}
                <div>
                  <SectionLabel>Contact</SectionLabel>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Your name <span className="text-red-400">*</span></span>
                      <input value={values.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Alex Chen" className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Email <span className="text-red-400">*</span></span>
                      <input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="studio@example.com" className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Company name</span>
                      <input value={values.companyName ?? ""} onChange={(e) => update("companyName", e.target.value)} placeholder="Your studio or brand" className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Design title <span className="text-red-400">*</span></span>
                      <input value={values.designTitle} onChange={(e) => update("designTitle", e.target.value)} placeholder="Spring cap front logo" className={InputClass()} />
                    </label>
                  </div>
                </div>

                {/* ── Design Specifications ───────────────────────────── */}
                <div>
                  <SectionLabel>Design Specifications</SectionLabel>
                  <div className="grid gap-4 md:grid-cols-2">

                    {/* Placement */}
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Placement</span>
                      <select value={values.placement ?? ""} onChange={(e) => handlePlacementChange(e.target.value)} className={InputClass()}>
                        <option value="" className="text-slate-950">— Select placement —</option>
                        {PLACEMENT_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value} className="text-slate-950">
                            {p.label} (max {p.maxSizeIn}")
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Fabric type */}
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Fabric type</span>
                      <select value={values.fabricType ?? ""} onChange={(e) => update("fabricType", e.target.value)} className={InputClass()}>
                        <option value="" className="text-slate-950">— Select fabric —</option>
                        {FABRIC_TYPES.map((f) => (
                          <option key={f} value={f} className="text-slate-950">{f}</option>
                        ))}
                      </select>
                    </label>

                    {/* Design dimensions */}
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Design height (inches)</span>
                      <input
                        type="number" min={0.5} max={24} step={0.25}
                        value={values.designHeightIn ?? ""}
                        onChange={(e) => update("designHeightIn", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 3.5"
                        className={InputClass()}
                      />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Design width (inches)</span>
                      <input
                        type="number" min={0.5} max={24} step={0.25}
                        value={values.designWidthIn ?? ""}
                        onChange={(e) => update("designWidthIn", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 4.0"
                        className={InputClass()}
                      />
                    </label>
                  </div>

                  {/* Size warning */}
                  {sizeWarning && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      {sizeWarning}
                    </div>
                  )}

                  {/* 3D Puff Jacket Back info */}
                  {values.is3dPuffJacketBack && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                      <span><strong>3D Puff Jacket Back</strong> is priced as a premium separate service. Flat rate applied instead of standard per-inch pricing.</span>
                    </div>
                  )}
                </div>

                {/* ── Production Details ──────────────────────────────── */}
                <div>
                  <SectionLabel>Production Details</SectionLabel>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Quantity</span>
                      <input type="number" min={1} value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value || 1))} className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Size (inches)</span>
                      <input type="number" min={0.5} step={0.25} value={values.sizeInches} onChange={(e) => update("sizeInches", Number(e.target.value || 1))} className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Thread colors</span>
                      <input type="number" min={1} max={16} value={values.colorCount} onChange={(e) => update("colorCount", Number(e.target.value || 1))} className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Color quantity</span>
                      <input type="number" min={0} max={50} value={values.colorQuantity ?? ""} onChange={(e) => update("colorQuantity", e.target.value ? Number(e.target.value) : undefined)} placeholder="Total # colors" className={InputClass()} />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Stitch count (if known)</span>
                      <input type="number" min={0} step={100} value={values.stitchCount ?? ""} onChange={(e) => update("stitchCount", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 8000" className={InputClass()} />
                      {values.stitchCount ? (
                        <span className="text-xs text-white/45">Stitch-plan pricing: ${((values.stitchCount / 1000) * 1).toFixed(2)} base (1,000 stitches = $1.00)</span>
                      ) : null}
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Complexity</span>
                      <select value={values.complexity} onChange={(e) => update("complexity", e.target.value as QuoteOrderInput["complexity"])} className={InputClass()}>
                        <option value="LOW" className="text-slate-950">Low — simple shapes, few details</option>
                        <option value="MEDIUM" className="text-slate-950">Medium — moderate detail</option>
                        <option value="HIGH" className="text-slate-950">High — fine detail, small text</option>
                      </select>
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Thread brand / color spec</span>
                      <input value={values.threadBrand ?? ""} onChange={(e) => update("threadBrand", e.target.value)} placeholder="e.g. Madeira, Robison-Anton" className={InputClass()} />
                    </label>
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Trims / underlay details</span>
                      <input value={values.trims ?? ""} onChange={(e) => update("trims", e.target.value)} placeholder="e.g. zig-zag underlay, 2mm trim" className={InputClass()} />
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className={LabelClass()}>
                      <span className="text-sm text-white/70">Color / thread details</span>
                      <textarea value={values.colorDetails ?? ""} onChange={(e) => update("colorDetails", e.target.value)} placeholder="Describe thread colors, Pantone references, or color matching notes." className="min-h-[80px] w-full rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/25" />
                    </label>
                  </div>
                </div>

                {/* ── Add-ons ─────────────────────────────────────────── */}
                <div>
                  <SectionLabel>Add-ons & Options</SectionLabel>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80 cursor-pointer hover:bg-white/[0.08] transition">
                      <input type="checkbox" checked={values.sourceCleanup} onChange={(e) => update("sourceCleanup", e.target.checked)} className="accent-indigo-400" />
                      <span>Source cleanup <span className="text-white/40">(+$8)</span></span>
                    </label>
                    {values.serviceType === "EMBROIDERY_DIGITIZING" && (
                      <>
                        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80 cursor-pointer hover:bg-white/[0.08] transition">
                          <input type="checkbox" checked={values.smallText} onChange={(e) => update("smallText", e.target.checked)} className="accent-indigo-400" />
                          <span>Small text work <span className="text-white/40">(+$6)</span></span>
                        </label>
                        <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm cursor-pointer transition ${values.is3dPuffJacketBack ? "opacity-40 pointer-events-none border-white/10 bg-white/[0.05] text-white/50" : "border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/[0.08]"}`}>
                          <input type="checkbox" checked={values.threeDPuff} onChange={(e) => update("threeDPuff", e.target.checked)} disabled={values.is3dPuffJacketBack} className="accent-indigo-400" />
                          <span>3D puff <span className="text-white/40">(+$10)</span></span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Turnaround ──────────────────────────────────────── */}
                <div>
                  <SectionLabel>Turnaround</SectionLabel>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["STANDARD", "URGENT", "SAME_DAY"] as TurnaroundType[]).map((item) => (
                      <button key={item} type="button" onClick={() => update("turnaround", item)}
                        className={`rounded-[1.5rem] border p-4 text-left transition ${values.turnaround === item ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"}`}>
                        <div className="text-sm font-semibold">{item === "STANDARD" ? "Standard" : item === "URGENT" ? "Urgent" : "Same Day"}</div>
                        <div className={`mt-1 text-xs ${values.turnaround === item ? "text-slate-600" : "text-white/50"}`}>
                          {item === "STANDARD" ? "Default SLA (24–48h)" : item === "URGENT" ? "Rush (+$12)" : "Highest priority (+$24)"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Output Formats ──────────────────────────────────── */}
                <div>
                  <SectionLabel>Output File Formats</SectionLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {FILE_FORMAT_OPTIONS.map((fmt) => {
                      const selected = (values.fileFormats as string[]).includes(fmt.value);
                      return (
                        <button key={fmt.value} type="button" onClick={() => toggleFileFormat(fmt.value)}
                          className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${selected ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200" : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"}`}>
                          <div className="font-bold">{fmt.value}</div>
                          <div className="text-[10px] opacity-70">{fmt.label.split("(")[1]?.replace(")", "") ?? ""}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-white/40">Select all output formats you need. DST and PES included by default.</div>
                </div>

                {/* ── Advanced / Special Instructions ─────────────────── */}
                <div>
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
                    <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
                    {showAdvanced ? "Hide" : "Show"} advanced options
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 grid gap-4">
                      <label className={LabelClass()}>
                        <span className="text-sm text-white/70">Special instructions</span>
                        <textarea value={values.specialInstructions ?? ""} onChange={(e) => update("specialInstructions", e.target.value)} placeholder="Any specific production details, machine preferences, stitch direction, pull compensation notes, etc." className="min-h-[100px] w-full rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/25" />
                      </label>
                      <label className={LabelClass()}>
                        <span className="text-sm text-white/70">General notes</span>
                        <textarea value={values.notes ?? ""} onChange={(e) => update("notes", e.target.value)} placeholder="Placement, garment type, revision instructions, or anything else production should know." className="min-h-[100px] w-full rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/25" />
                      </label>
                    </div>
                  )}
                </div>

                {/* ── Service Policy ───────────────────────────────────── */}
                <div className="rounded-[1.5rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.07] to-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300/80">
                    <Package className="h-3.5 w-3.5" />
                    Our Service Policy
                  </div>
                  <ul className="mt-4 grid gap-2.5">
                    <li className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">✓</span>
                      <span><strong className="text-white/90">Unlimited revisions</strong> — we work with you until you are completely satisfied.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">✓</span>
                      <span><strong className="text-white/90">LC to LC same-size adjustment is free</strong> — no extra charge for minor size tweaks within the same placement.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">✓</span>
                      <span><strong className="text-white/90">Color change is free</strong> — thread color updates are included at no cost.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-[10px] font-bold text-amber-400">!</span>
                      <span><strong className="text-white/90">LC to Jacket Back = new design / new order</strong> — changing placement type requires a fresh order.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-[10px] font-bold text-amber-400">!</span>
                      <span><strong className="text-white/90">Big size or placement changes may need a new order</strong> — major resizes or placement switches are treated as new designs.</span>
                    </li>
                  </ul>
                </div>

                {/* ── Reference Files ─────────────────────────────────── */}
                <div>
                  <SectionLabel>Reference Files</SectionLabel>
                  <p className="mb-3 text-xs text-white/45">
                    Upload your artwork, logo files, or any reference images. Optional but helps us get started faster.
                  </p>
                  <ReferenceFileUploader
                    files={refFiles}
                    onChange={setRefFiles}
                    maxFiles={10}
                  />
                </div>

                {/* ── Submit ──────────────────────────────────────────── */}
                <section className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={saveDraft} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-sm text-white transition hover:bg-white/[0.08]">
                    <Save className="h-4 w-4" />
                    Save draft
                  </button>
                  <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-white/90">
                    {mode === "quote" ? "Submit Quote Request" : "Submit Direct Order"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {savingState && <span className="text-sm text-emerald-300">{savingState}</span>}
                  {submitState.type === "error" && <span className="text-sm text-red-300">{submitState.text}</span>}
                </section>
              </div>
            </form>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside className="grid gap-5 self-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-2xl">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Service summary</div>
                <h2 className="mt-2 text-xl font-semibold">{service.label}</h2>
                <div className="mt-3 space-y-2">
                  {service.hints.map((hint) => (
                    <div key={hint} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs text-white/65">{hint}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-2xl">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Live pricing</div>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <PriceRow label="Base" value={pricing.breakdown.base} />
                  <PriceRow label="Quantity adj." value={pricing.breakdown.quantityAdj} />
                  {pricing.breakdown.stitchAdj > 0
                    ? <PriceRow label="Stitch plan" value={pricing.breakdown.stitchAdj} />
                    : <PriceRow label="Size adj." value={pricing.breakdown.sizeAdj} />}
                  <PriceRow label="Colors" value={pricing.breakdown.colorAdj} />
                  <PriceRow label="Complexity" value={pricing.breakdown.complexityAdj} />
                  <PriceRow label="Placement surcharge" value={pricing.breakdown.placementSurcharge} />
                  <PriceRow label="Extras" value={pricing.breakdown.extras} />
                  <PriceRow label="Turnaround" value={pricing.breakdown.turnaroundAdj} />
                  {pricing.breakdown.bulkDiscountAdj < 0 && (
                    <PriceRow label={`Bulk discount (${pricing.discountPercent}%)`} value={pricing.breakdown.bulkDiscountAdj} />
                  )}
                </div>
                <div className="mt-4 rounded-[1.5rem] border border-emerald-400/15 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Estimated total
                  </div>
                  <div className="mt-1 text-4xl font-bold text-white">${pricing.total.toFixed(2)}</div>
                  <div className="mt-1.5 text-xs text-white/45">Final invoice may vary based on artwork complexity.</div>
                </div>
                {values.quantity >= 5 && (
                  <div className="mt-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2.5 text-xs text-indigo-200">
                    Bulk discount applied: {pricing.discountPercent > 0 ? `${pricing.discountPercent}% off` : "5% discount threshold not yet reached"}
                  </div>
                )}
              </section>

              {placementMeta && (
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-2xl">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">Placement guide</div>
                  <h3 className="mt-2 font-semibold">{placementMeta.label}</h3>
                  <div className="mt-2 text-xs text-white/55">
                    Maximum recommended size: <strong className="text-white/80">{placementMeta.maxSizeIn}"</strong>
                  </div>
                  {placementMeta.is3DPuffJacketBack && (
                    <div className="mt-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
                      Premium service — flat rate applies
                    </div>
                  )}
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={value < 0 ? "text-emerald-300" : undefined}>
        {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
      </span>
    </div>
  );
}
