"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Info,
  Save,
  Zap,
  Sparkles,
  User,
  LogIn,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FABRIC_TYPES,
  FILE_FORMAT_OPTIONS,
  PLACEMENT_OPTIONS,
  getDefaultNiche,
  getNichesForService,
  getPlacementMeta,
  serviceCatalog,
  type ServiceType,
} from "@/lib/quote-order/catalog";
import { quoteOrderSchema, type QuoteOrderInput } from "@/schemas/quote-order";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type BuilderMode = "quote" | "order";
type FlowContext = "guest" | "client";
type SubmitState = { type: "idle" | "success" | "error"; text: string };

interface BuilderUser {
  name?: string | null;
  email?: string | null;
}

const DESIGN_TYPES = [
  { value: "LEFT_CHEST", label: "Left Chest", desc: "Standard logo placement — up to 5\"", icon: "👕" },
  { value: "HAT_FRONT", label: "Cap / Hat", desc: "Cap front, side, or back — up to 5\"", icon: "🧢" },
  { value: "JACKET_BACK", label: "Jacket Back", desc: "Full back design — up to 12\"", icon: "🧥" },
  { value: "CUSTOM_PATCHES", label: "Patch", desc: "Custom embroidered or woven patch", icon: "🏷️" },
  { value: "PUFF_LEFT_CHEST", label: "3D Puff", desc: "Raised 3D foam embroidery — up to 5\"", icon: "✨" },
  { value: "OTHER", label: "Other / Custom", desc: "Custom placement or specialty item", icon: "📐" },
] as const;

const DELIVERY_SPEEDS = [
  { value: "STANDARD" as const, label: "Normal", time: "12 hours", desc: "Standard turnaround — included" },
  { value: "URGENT" as const, label: "Rush", time: "6 hours", desc: "Priority queue — +$12", price: 12 },
  { value: "SAME_DAY" as const, label: "Urgent", time: "3 hours", desc: "Highest priority — +$24", price: 24 },
];

const STEPS = [
  { num: 1, label: "Design Type" },
  { num: 2, label: "Size & Placement" },
  { num: 3, label: "Delivery" },
  { num: 4, label: "Upload" },
  { num: 5, label: "Review" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

function mapDesignTypeToPlacement(dt: string): string {
  switch (dt) {
    case "LEFT_CHEST": return "LEFT_CHEST";
    case "HAT_FRONT": return "HAT_FRONT";
    case "JACKET_BACK": return "JACKET_BACK";
    case "PUFF_LEFT_CHEST": return "PUFF_LEFT_CHEST";
    case "CUSTOM_PATCHES": return "OTHER";
    case "OTHER": return "OTHER";
    default: return "";
  }
}

function mapDesignTypeToService(dt: string): ServiceType {
  return dt === "CUSTOM_PATCHES" ? "CUSTOM_PATCHES" : "EMBROIDERY_DIGITIZING";
}

function getMissingFields(values: QuoteOrderInput, flowCtx: FlowContext, fileCount: number): string[] {
  const missing: string[] = [];
  if (flowCtx === "guest") {
    if (!values.customerName || values.customerName.length < 2) missing.push("Name");
    if (!values.email || !values.email.includes("@")) missing.push("Email");
  }
  if (!values.designTitle || values.designTitle.length < 2) missing.push("Design title");
  if (!values.placement) missing.push("Placement");
  if (fileCount === 0) missing.push("Upload at least one artwork or reference file");
  return missing;
}

function getSoftWarnings(values: QuoteOrderInput): string[] {
  const warnings: string[] = [];
  if (!values.specialInstructions || values.specialInstructions.trim().length === 0) {
    warnings.push("Add special instructions about colors, size, or style.");
  }
  return warnings;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StepIndicator({ step, onStepClick }: { step: number; onStepClick: (s: number) => void }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 md:gap-3">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <button
            type="button"
            onClick={() => { if (s.num < step) onStepClick(s.num); }}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all md:px-4",
              step === s.num && "bg-primary text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.3)]",
              step > s.num && "bg-primary/10 text-primary hover:bg-primary/20",
              step < s.num && "bg-muted/50 text-muted-foreground cursor-default"
            )}
          >
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold", step > s.num ? "bg-primary text-primary-foreground" : step === s.num ? "bg-primary-foreground/20" : "bg-muted-foreground/20")}>
              {step > s.num ? "✓" : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <div className="hidden h-px w-6 bg-border/60 sm:block" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  mode: BuilderMode;
  flowContext?: FlowContext;
  user?: BuilderUser;
  isFirstOrder?: boolean;
};

export function QuoteOrderBuilder({ mode, flowContext, user, isFirstOrder }: Props) {
  const ctx: FlowContext = flowContext ?? "guest";
  const isOrder = mode === "order";
  const eligibleForFree = isFirstOrder === true;
  const draftKey = React.useMemo(() => getDraftKey(mode), [mode]);

  const [step, setStep] = React.useState(isOrder ? 1 : 0);
  const [values, setValues] = React.useState<QuoteOrderInput>(() => {
    const init = getInitialValues(mode);
    if (ctx === "client" && user) {
      init.customerName = user.name ?? "";
      init.email = user.email ?? "";
    }
    return init;
  });
  const [submitState, setSubmitState] = React.useState<SubmitState>({ type: "idle", text: "" });
  const [savingState, setSavingState] = React.useState("");
  const [orderResult, setOrderResult] = React.useState<{ orderNumber: string; isFreeDesign: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [refFiles, setRefFiles] = React.useState<RefFile[]>([]);
  const [designType, setDesignType] = React.useState("");

  const placementMeta = values.placement ? getPlacementMeta(values.placement) : null;
  const missing = isOrder && step === 5 ? getMissingFields(values, ctx, refFiles.length) : [];
  const softWarnings = isOrder && step === 5 ? getSoftWarnings(values) : [];

  function update<K extends keyof QuoteOrderInput>(key: K, val: QuoteOrderInput[K]) {
    setValues((cur) => ({ ...cur, [key]: val }));
  }

  function handleDesignType(dt: string) {
    setDesignType(dt);
    const placement = mapDesignTypeToPlacement(dt);
    const svc = mapDesignTypeToService(dt);
    const meta = getPlacementMeta(placement);
    update("placement", placement);
    update("serviceType", svc);
    update("nicheSlug", getDefaultNiche(svc));
    update("is3dPuffJacketBack", meta.is3DPuffJacketBack);
    if (dt === "PUFF_LEFT_CHEST" || dt === "PUFF_HAT" || dt === "PUFF_JACKET_BACK") {
      update("threeDPuff", true);
    }
    if (meta.maxSizeIn && (values.designHeightIn ?? 0) > meta.maxSizeIn) {
      update("designHeightIn", meta.maxSizeIn);
    }
  }

  function toggleFileFormat(fmt: string) {
    const fmts = values.fileFormats as string[];
    const next = fmts.includes(fmt) ? fmts.filter((f) => f !== fmt) : [...fmts, fmt];
    update("fileFormats", next as QuoteOrderInput["fileFormats"]);
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify(values));
    setSavingState("Draft saved.");
    window.setTimeout(() => setSavingState(""), 1800);
  }

  async function submitForm() {
    setSubmitState({ type: "idle", text: "" });
    setOrderResult(null);

    const parsed = quoteOrderSchema.safeParse(values);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      setSubmitState({ type: "error", text: `Missing fields: ${issues || "check required fields"}` });
      return;
    }

    if (ctx === "guest" && isOrder) {
      // Guest order → use guest API
      const res = await fetch("/api/guest/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.customerName,
          email: values.email,
          phone: values.companyName || undefined,
          serviceType: values.serviceType,
          designTitle: values.designTitle,
          placement: values.placement,
          fabricType: values.fabricType,
          designHeightIn: values.designHeightIn,
          designWidthIn: values.designWidthIn,
          quantity: values.quantity,
          colorQuantity: values.colorQuantity,
          turnaround: values.turnaround,
          notes: values.notes,
          specialInstructions: values.specialInstructions,
          referenceFiles: refFiles,
        }),
      });

      const result = (await res.json()) as { ok: boolean; message?: string; orderNumber?: string };
      if (!res.ok || !result.ok) {
        setSubmitState({ type: "error", text: result.message ?? "Unable to submit." });
        return;
      }
      window.localStorage.removeItem(draftKey);
      setSubmitState({ type: "success", text: result.message ?? "Submitted." });
      if (result.orderNumber) setOrderResult({ orderNumber: result.orderNumber, isFreeDesign: false });
      return;
    }

    // Client order or quote → use authenticated API
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

  /* ── Success screen ───────────────────────────────────────────── */

  if (orderResult) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.10),transparent_35%)]" />
        <section className="relative z-10 w-full max-w-lg rounded-[2rem] border border-border/60 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          {orderResult.isFreeDesign && (
            <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-300">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
              Your first design is on us! Free design applied.
            </div>
          )}
          <h2 className="text-2xl font-bold text-foreground">
            {mode === "quote" ? "Quote request submitted!" : "Order confirmed!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{submitState.text}</p>
          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reference number</div>
            <div className="mt-2 font-mono text-xl font-bold text-foreground">{orderResult.orderNumber}</div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="default" shape="pill" className="flex-1">
              <Link href={"/client/orders" as Route}>View My Orders</Link>
            </Button>
            <Button
              variant="outline"
              shape="pill"
              className="flex-1"
              onClick={() => { setOrderResult(null); setValues(buildDefaultValues(mode)); setStep(1); }}
            >
              New Order
            </Button>
          </div>
        </section>
      </main>
    );
  }

  /* ── Quote mode (existing simplified form) ────────────────────── */

  if (!isOrder) {
    return (
      <main className="relative min-h-screen bg-background text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.06),transparent_30%)]" />
        <div className="relative z-10 px-4 py-10 md:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <div className="section-eyebrow">Get a quote</div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Request a Quote</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Tell us about your artwork and we&apos;ll send a firm price within one business day.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-8">
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <h3 className="font-semibold">Service</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Service type <span className="text-destructive">*</span></label>
                      <select value={values.serviceType} onChange={(e) => {
                        const t = e.target.value as ServiceType;
                        update("serviceType", t);
                        update("nicheSlug", getDefaultNiche(t));
                      }} className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm">
                        {serviceCatalog.map((item) => (
                          <option key={item.type} value={item.type}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
                      <select value={values.nicheSlug} onChange={(e) => update("nicheSlug", e.target.value)} className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm">
                        {getNichesForService(values.serviceType).map((item) => (
                          <option key={item.slug} value={item.slug}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="space-y-4">
                  <h3 className="font-semibold">Contact</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
                      <Input value={values.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Alex Chen" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                      <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="studio@example.com" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Design title <span className="text-destructive">*</span></label>
                      <Input value={values.designTitle} onChange={(e) => update("designTitle", e.target.value)} placeholder="Spring cap front logo" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Company</label>
                      <Input value={values.companyName ?? ""} onChange={(e) => update("companyName", e.target.value)} placeholder="Your studio or brand" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="space-y-4">
                  <h3 className="font-semibold">Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Placement</label>
                      <select value={values.placement ?? ""} onChange={(e) => {
                        const meta = getPlacementMeta(e.target.value);
                        update("placement", e.target.value);
                        update("is3dPuffJacketBack", meta.is3DPuffJacketBack);
                      }} className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm">
                        <option value="">— Select —</option>
                        {PLACEMENT_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label} (max {p.maxSizeIn}&Prime;)</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Fabric</label>
                      <select value={values.fabricType ?? ""} onChange={(e) => update("fabricType", e.target.value)} className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm">
                        <option value="">— Select —</option>
                        {FABRIC_TYPES.map((f) => (<option key={f} value={f}>{f}</option>))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Height (in)</label>
                      <Input type="number" min={0.5} max={24} step={0.25} value={values.designHeightIn ?? ""} onChange={(e) => update("designHeightIn", e.target.value ? Number(e.target.value) : undefined)} placeholder="3.5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Width (in)</label>
                      <Input type="number" min={0.5} max={24} step={0.25} value={values.designWidthIn ?? ""} onChange={(e) => update("designWidthIn", e.target.value ? Number(e.target.value) : undefined)} placeholder="4.0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="space-y-3">
                  <h3 className="font-semibold">Reference Files</h3>
                  <p className="text-xs text-muted-foreground">Upload your artwork or reference images. Optional but helps us get started faster.</p>
                  <ReferenceFileUploader files={refFiles} onChange={setRefFiles} maxFiles={10} />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" shape="pill" onClick={saveDraft}>
                  <Save className="h-4 w-4" />
                  Save draft
                </Button>
                <Button type="submit" variant="premium" shape="pill" size="lg">
                  Submit Quote Request
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {savingState && <span className="text-sm text-emerald-500">{savingState}</span>}
                {submitState.type === "error" && <span className="text-sm text-destructive">{submitState.text}</span>}
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ── Order mode: 5-step wizard ────────────────────────────────── */

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.07),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.05),transparent_30%)]" />
      <div className="relative z-10 px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="mb-2 text-center">
            <p className="section-eyebrow">Place an order</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Start Your Order</h1>
          </div>

          <StepIndicator step={step} onStepClick={setStep} />

          {/* ── Guest banner ── */}
          {ctx === "guest" && (
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" />
                    Login & Get Your First Order Free
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New clients get their first digitizing order free. Log in or create an account before ordering to claim it.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" shape="pill" size="sm">
                    <Link href="/login?next=/client/order">
                      <LogIn className="h-3.5 w-3.5" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="default" shape="pill" size="sm">
                    <Link href="/register?next=/client/order">
                      <UserPlus className="h-3.5 w-3.5" />
                      Create Account
                    </Link>
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                You can still continue as a guest and receive updates by email.
              </p>
            </div>
          )}

          {/* ── Client identity card ── */}
          {ctx === "client" && user && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Ordering as: {user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {eligibleForFree
                    ? "Welcome! Your first digitizing order is free."
                    : "Fill in the details below and we'll get started."}
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Design Type ── */}
          {step === 1 && (
            <Card className="p-6 md:p-8">
              <CardContent>
                <h2 className="mb-1 text-xl font-semibold">Choose Your Design Type</h2>
                <p className="mb-5 text-sm text-muted-foreground">Select the type of embroidery design you need.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DESIGN_TYPES.map((dt) => {
                    const selected = designType === dt.value;
                    return (
                      <button
                        key={dt.value}
                        type="button"
                        onClick={() => handleDesignType(dt.value)}
                        className={cn(
                          "flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                            : "border-border/60 bg-card/70 hover:border-border hover:bg-card"
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                          {dt.icon}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{dt.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{dt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!designType} variant="premium" shape="pill" size="lg">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Size & Placement ── */}
          {step === 2 && (
            <Card className="p-6 md:p-8">
              <CardContent>
                <h2 className="mb-1 text-xl font-semibold">Size & Placement</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Not sure about size? Upload your logo and we&apos;ll guide you.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Placement <span className="text-destructive">*</span></label>
                    <select
                      value={values.placement ?? ""}
                      onChange={(e) => {
                        const meta = getPlacementMeta(e.target.value);
                        update("placement", e.target.value);
                        update("is3dPuffJacketBack", meta.is3DPuffJacketBack);
                      }}
                      className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm"
                    >
                      <option value="">— Select placement —</option>
                      {PLACEMENT_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label} (max {p.maxSizeIn}&Prime;)</option>
                      ))}
                    </select>
                    {placementMeta && (
                      <p className="text-xs text-muted-foreground">Max recommended: {placementMeta.maxSizeIn}&Prime;</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Fabric type</label>
                    <select value={values.fabricType ?? ""} onChange={(e) => update("fabricType", e.target.value)} className="h-11 rounded-2xl border border-input bg-card/70 px-4 text-sm">
                      <option value="">— Select fabric —</option>
                      {FABRIC_TYPES.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Height (inches)</label>
                    <Input type="number" min={0.5} max={24} step={0.25} value={values.designHeightIn ?? ""} onChange={(e) => update("designHeightIn", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 3.5" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Width (inches)</label>
                    <Input type="number" min={0.5} max={24} step={0.25} value={values.designWidthIn ?? ""} onChange={(e) => update("designWidthIn", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 4.0" />
                  </div>
                </div>

                {values.is3dPuffJacketBack && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-600 dark:text-violet-300">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                    3D Puff Jacket Back is priced as a premium separate service.
                  </div>
                )}

                {/* ── Advanced Options ── */}
                <div className="mt-6 border-t border-border/60 pt-5">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <div>
                      <span>Advanced Embroidery Options</span>
                      <p className="text-xs font-normal text-muted-foreground">Optional details for professional clients or exact production requirements.</p>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input type="number" min={1} max={5000} value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value || 1))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Color quantity</label>
                        <Input type="number" min={0} max={50} value={values.colorQuantity ?? ""} onChange={(e) => update("colorQuantity", e.target.value ? Number(e.target.value) : undefined)} placeholder="Total # colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Thread brand</label>
                        <Input value={values.threadBrand ?? ""} onChange={(e) => update("threadBrand", e.target.value)} placeholder="e.g. Madeira, Robison-Anton" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Trims / underlay</label>
                        <Input value={values.trims ?? ""} onChange={(e) => update("trims", e.target.value)} placeholder="e.g. zig-zag underlay" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Stitch count (if known)</label>
                        <Input type="number" min={0} step={100} value={values.stitchCount ?? ""} onChange={(e) => update("stitchCount", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 8000" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Thread colors</label>
                        <Input type="number" min={1} max={16} value={values.colorCount} onChange={(e) => update("colorCount", Number(e.target.value || 1))} />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Color / thread details</label>
                        <textarea
                          value={values.colorDetails ?? ""}
                          onChange={(e) => update("colorDetails", e.target.value)}
                          placeholder="Describe thread colors, Pantone references, or color matching notes."
                          className="min-h-[72px] w-full rounded-2xl border border-border/80 bg-card/70 px-4 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Output file formats</label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {FILE_FORMAT_OPTIONS.filter((f) => ["DST", "PES", "EMB", "EXP", "JEF", "VP3", "XXX", "HUS", "SEW"].includes(f.value)).map((fmt) => {
                            const selected = (values.fileFormats as string[]).includes(fmt.value);
                            return (
                              <button
                                key={fmt.value}
                                type="button"
                                onClick={() => toggleFileFormat(fmt.value)}
                                className={cn(
                                  "rounded-2xl border px-3 py-2 text-center text-xs font-medium transition-all",
                                  selected
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border/60 bg-card/70 text-muted-foreground hover:border-border hover:bg-card"
                                )}
                              >
                                {fmt.value}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">Machine formats. DST and PES selected by default.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service policy */}
                <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                    <Info className="h-3.5 w-3.5" />
                    Service Policy
                  </div>
                  <ul className="mt-3 grid gap-2">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500">✓</span>
                      LC to LC same-size adjustment and color change is free
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">!</span>
                      LC to Jacket Back = new design / new order
                    </li>
                  </ul>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button onClick={() => setStep(1)} variant="ghost" shape="pill">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!values.placement} variant="premium" shape="pill" size="lg">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Delivery Speed ── */}
          {step === 3 && (
            <Card className="p-6 md:p-8">
              <CardContent>
                <h2 className="mb-1 text-xl font-semibold">Delivery Speed</h2>
                <p className="mb-5 text-sm text-muted-foreground">Choose how fast you need your design delivered.</p>

                {/* First-order-free banner — only for eligible clients */}
                {eligibleForFree && (
                  <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
                    <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                    Your first order is free — choose any delivery speed.
                  </div>
                )}

                <div className="grid gap-3">
                  {DELIVERY_SPEEDS.map((ds) => {
                    const selected = values.turnaround === ds.value;
                    return (
                      <button
                        key={ds.value}
                        type="button"
                        onClick={() => update("turnaround", ds.value)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-4 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                            : "border-border/60 bg-card/70 hover:border-border hover:bg-card"
                        )}
                      >
                        <div>
                          <div className="font-semibold">{ds.label}</div>
                          <div className="text-sm text-muted-foreground">{ds.time} — {ds.desc}</div>
                        </div>
                        <Badge className={cn(selected ? "bg-primary/15 text-primary border-primary/20" : "bg-muted text-muted-foreground")}>
                          {eligibleForFree ? "Free for your first order" : ds.price ? `+$${ds.price}` : "Included"}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button onClick={() => setStep(2)} variant="ghost" shape="pill">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} variant="premium" shape="pill" size="lg">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 4: Upload Design ── */}
          {step === 4 && (
            <Card className="p-6 md:p-8">
              <CardContent>
                <h2 className="mb-1 text-xl font-semibold">Upload Your Design</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Upload at least one artwork or reference file to submit your order. Supported: JPG, PNG, PDF, AI, EPS, SVG, PSD, ZIP.
                </p>

                <ReferenceFileUploader
                  files={refFiles}
                  onChange={setRefFiles}
                  guestEmail={ctx === "guest" ? values.email : undefined}
                  maxFiles={10}
                />

                {refFiles.length === 0 && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    No files uploaded yet. At least one artwork or reference file is required to submit your order.
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <Button onClick={() => setStep(3)} variant="ghost" shape="pill">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(5)} variant="premium" shape="pill" size="lg">
                    Review Order
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 5: Review & Confirm ── */}
          {step === 5 && (
            <Card className="p-6 md:p-8">
              <CardContent>
                <h2 className="mb-1 text-xl font-semibold">Review & Confirm</h2>
                <p className="mb-5 text-sm text-muted-foreground">Check your order details before submitting.</p>

                {/* Guest contact fields */}
                {ctx === "guest" && (
                  <div className="mb-5 grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Your name <span className="text-destructive">*</span></label>
                      <Input value={values.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Alex Chen" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                      <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="studio@example.com" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Phone / WhatsApp</label>
                      <Input value={values.companyName ?? ""} onChange={(e) => update("companyName", e.target.value)} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Design title <span className="text-destructive">*</span></label>
                      <Input value={values.designTitle} onChange={(e) => update("designTitle", e.target.value)} placeholder="Spring cap front logo" />
                    </div>
                  </div>
                )}

                {/* Summary card */}
                <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order Summary</h3>
                  <div className="grid gap-2.5 text-sm">
                    <SummaryRow label="Design type" value={DESIGN_TYPES.find((d) => d.value === designType)?.label ?? "—"} />
                    <SummaryRow label="Placement" value={placementMeta?.label ?? "—"} />
                    <SummaryRow label="Height" value={values.designHeightIn ? `${values.designHeightIn}"` : "—"} />
                    <SummaryRow label="Width" value={values.designWidthIn ? `${values.designWidthIn}"` : "—"} />
                    <SummaryRow label="Fabric" value={values.fabricType || "—"} />
                    <SummaryRow label="3D Puff" value={values.threeDPuff ? "Yes" : "No"} />
                    <SummaryRow label="Color quantity" value={values.colorQuantity ? String(values.colorQuantity) : "—"} />
                    <SummaryRow label="Trims" value={values.trims || "—"} />
                    <SummaryRow label="Output formats" value={(values.fileFormats as string[]).length > 0 ? (values.fileFormats as string[]).join(", ") : "DST, PES"} />
                    <SummaryRow label="Delivery" value={DELIVERY_SPEEDS.find((d) => d.value === values.turnaround)?.label ?? "Normal"} />
                    <SummaryRow label="Files uploaded" value={refFiles.length > 0 ? `${refFiles.length} file(s)` : "None"} />
                    {ctx === "client" && (
                      <SummaryRow label="Account" value={user?.email ?? "—"} />
                    )}
                    <SummaryRow
                      label="Pricing"
                      value={
                        eligibleForFree
                          ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free — first order</span>
                          : <span className="font-medium text-foreground">Standard pricing</span>
                      }
                    />
                  </div>
                </div>

                {/* Special instructions */}
                <div className="mt-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Special Instructions</label>
                  <textarea
                    value={values.specialInstructions ?? ""}
                    onChange={(e) => update("specialInstructions", e.target.value)}
                    placeholder="Tell us anything important about colors, placement, size, or style."
                    className="min-h-[90px] w-full rounded-2xl border border-border/80 bg-card/70 px-4 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* Soft warnings (non-blocking) */}
                {missing.length === 0 && softWarnings.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {softWarnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing field warnings (blocking) */}
                {missing.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <strong>Missing before confirmation:</strong> {missing.join(", ")}
                    </div>
                  </div>
                )}

                {/* Submit error */}
                {submitState.type === "error" && (
                  <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {submitState.text}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button onClick={() => setStep(4)} variant="ghost" shape="pill">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" shape="pill" onClick={saveDraft}>
                      <Save className="h-4 w-4" />
                      Save draft
                    </Button>
                  </div>
                  <Button
                    onClick={submitForm}
                    disabled={missing.length > 0}
                    variant="premium"
                    shape="pill"
                    size="lg"
                  >
                    {missing.length > 0 ? "Complete missing details" : ctx === "guest" ? "Submit Order as Guest" : "Confirm & Submit"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {savingState && <p className="mt-2 text-sm text-emerald-500">{savingState}</p>}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </main>
  );
}

