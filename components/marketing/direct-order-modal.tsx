"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

type ServiceType = "EMBROIDERY_DIGITIZING" | "VECTOR_ART" | "COLOR_SEPARATION_DTF" | "CUSTOM_PATCHES";

type FormState = {
  name: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  designTitle: string;
  notes: string;
  placement: string;
  quantity: string;
};

const SERVICE_OPTIONS: { value: ServiceType; label: string; emoji: string }[] = [
  { value: "EMBROIDERY_DIGITIZING", label: "Embroidery Digitizing", emoji: "🧵" },
  { value: "VECTOR_ART",            label: "Vector Art",            emoji: "✏️" },
  { value: "COLOR_SEPARATION_DTF",  label: "Color Separation / DTF",emoji: "🎨" },
  { value: "CUSTOM_PATCHES",        label: "Custom Patches",         emoji: "🪡" },
];

const STEPS = ["Contact", "Order Details", "Files & Submit"] as const;
type Step = 0 | 1 | 2;

const inp =
  "h-12 w-full rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:bg-white/[0.10] transition-all";
const fieldLabel = "grid gap-1.5 text-sm text-white/70";

function buildDefault(): FormState {
  return { name: "", email: "", phone: "", serviceType: "EMBROIDERY_DIGITIZING", designTitle: "", notes: "", placement: "", quantity: "1" };
}

type Props = {
  mode?: "order" | "quote";
  prefillName?: string;
  prefillEmail?: string;
  isLoggedIn?: boolean;
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

export function DirectOrderModal({ mode = "order", prefillName, prefillEmail, isLoggedIn }: Props) {
  const [open, setOpen]       = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [step, setStep]       = React.useState<Step>(0);
  const [dir, setDir]         = React.useState(1);
  const [form, setForm]       = React.useState<FormState>(() => ({
    ...buildDefault(),
    name:  prefillName  ?? "",
    email: prefillEmail ?? "",
  }));
  const [refFiles, setRefFiles] = React.useState<RefFile[]>([]);
  const [submitState, setSubmitState] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage]     = React.useState("");
  const [orderNumber, setOrderNumber] = React.useState("");
  const [errors, setErrors]       = React.useState<Partial<Record<keyof FormState, string>>>({});

  // Canonical mount-detection pattern — portal needs document
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setMounted(true); }, []);

  // Body scroll lock + Escape
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") handleClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function go(next: Step) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())  e.name  = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.designTitle.trim()) e.designTitle = "Design title is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    go((step + 1) as Step);
  }

  function handleBack() {
    if (step > 0) go((step - 1) as Step);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitState === "submitting") return;
    setSubmitState("submitting");
    setMessage("");

    const endpoint = mode === "order" ? "/api/guest/order" : "/api/guest/quote";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name:           form.name,
          email:          form.email,
          phone:          form.phone || undefined,
          serviceType:    form.serviceType,
          designTitle:    form.designTitle,
          notes:          form.notes    || undefined,
          placement:      form.placement || undefined,
          quantity:       Number(form.quantity) || 1,
          referenceFiles: refFiles,
        }),
      });
      const result = (await res.json()) as { ok: boolean; message?: string; orderNumber?: string };
      if (!res.ok || !result.ok) {
        setSubmitState("error");
        setMessage(result.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitState("success");
      setMessage(result.message ?? "Submitted!");
      setOrderNumber(result.orderNumber ?? "");
    } catch {
      setSubmitState("error");
      setMessage("Network error. Please try again.");
    }
  }

  function handleClose() {
    setOpen(false);
    setStep(0);
    setDir(1);
    setSubmitState("idle");
    setMessage("");
    setOrderNumber("");
    setErrors({});
    setForm({ ...buildDefault(), name: prefillName ?? "", email: prefillEmail ?? "" });
    setRefFiles([]);
  }

  const dialogTitle = mode === "order" ? "Place a Direct Order" : "Request a Free Quote";

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/[0.16] bg-white px-7 text-sm font-semibold text-slate-950 shadow-[0_4px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(255,255,255,0.20)] active:scale-[0.98]"
      >
        {mode === "order" ? "Place Direct Order" : "Get a Free Quote"}
        <Upload className="h-4 w-4" />
      </button>

      {/* Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onClick={handleClose}
                />

                {/* Card */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialogTitle}
                  className="relative z-10 flex w-full max-w-2xl flex-col max-h-[calc(100dvh-32px)] rounded-[2rem] border border-white/[0.12] bg-[#080e1c] shadow-[0_40px_140px_rgba(0,0,0,0.85)]"
                  initial={{ opacity: 0, scale: 0.95, y: 28 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* ── Header ── */}
                  <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-400/60">
                        GenX Digitizing
                      </div>
                      <h2 className="mt-0.5 text-lg font-semibold text-white">{dialogTitle}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close dialog"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.08] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* ── Step indicator (hidden on success) ── */}
                  {submitState !== "success" && (
                    <div className="shrink-0 flex items-center gap-0 border-b border-white/[0.06] px-6 py-3">
                      {STEPS.map((label, i) => {
                        const done    = i < step;
                        const active  = i === step;
                        return (
                          <React.Fragment key={label}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                                  done
                                    ? "bg-indigo-500 text-white"
                                    : active
                                    ? "border-2 border-indigo-400 text-indigo-300"
                                    : "border border-white/20 text-white/30"
                                }`}
                              >
                                {done ? "✓" : i + 1}
                              </div>
                              <span
                                className={`hidden sm:block text-xs font-medium transition-colors ${
                                  active ? "text-white" : done ? "text-white/50" : "text-white/25"
                                }`}
                              >
                                {label}
                              </span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div
                                className={`mx-3 h-px flex-1 transition-colors ${
                                  i < step ? "bg-indigo-500/50" : "bg-white/[0.08]"
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Scrollable body ── */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <AnimatePresence mode="wait" custom={dir}>
                      {submitState === "success" ? (
                        /* Success */
                        <motion.div
                          key="success"
                          className="flex flex-col items-center gap-6 px-6 py-12 text-center"
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">
                              {mode === "order" ? "Order submitted!" : "Quote request sent!"}
                            </h3>
                            <p className="mt-2 text-sm text-white/60">{message}</p>
                          </div>
                          {orderNumber && (
                            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Reference number</div>
                              <div className="mt-2 font-mono text-xl font-bold text-white">{orderNumber}</div>
                            </div>
                          )}
                          <p className="text-sm text-white/50">
                            Check your email for confirmation. We&apos;ll be in touch shortly.
                          </p>
                          {orderNumber && (
                            <a
                              href={`/order-status?number=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(form.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo-500 px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(99,102,241,0.30)] transition hover:bg-indigo-400"
                            >
                              Track your order
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-full border border-white/[0.12] px-6 py-2.5 text-sm font-medium text-white/60 transition hover:text-white/90"
                          >
                            Close
                          </button>
                        </motion.div>
                      ) : step === 0 ? (
                        /* Step 1 — Contact */
                        <motion.div
                          key="step-0"
                          custom={dir}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="grid gap-5 px-6 py-6"
                        >
                          <p className="text-sm text-white/45">
                            Tell us who you are so we can send your confirmation and reach you if we have questions.
                          </p>
                          <label className={fieldLabel}>
                            Full name <span className="text-red-400">*</span>
                            <input
                              value={form.name}
                              onChange={(e) => update("name", e.target.value)}
                              placeholder="Your full name"
                              className={`${inp} ${errors.name ? "border-red-400/50" : ""}`}
                              disabled={isLoggedIn}
                            />
                            {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                          </label>
                          <label className={fieldLabel}>
                            Email <span className="text-red-400">*</span>
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => update("email", e.target.value)}
                              placeholder="you@example.com"
                              className={`${inp} ${errors.email ? "border-red-400/50" : ""}`}
                              disabled={isLoggedIn}
                            />
                            {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                          </label>
                          <label className={fieldLabel}>
                            Phone <span className="text-white/30 text-xs">(optional)</span>
                            <input
                              type="tel"
                              value={form.phone}
                              onChange={(e) => update("phone", e.target.value)}
                              placeholder="+1 555 000 0000"
                              className={inp}
                            />
                          </label>
                        </motion.div>
                      ) : step === 1 ? (
                        /* Step 2 — Order Details */
                        <motion.div
                          key="step-1"
                          custom={dir}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="grid gap-5 px-6 py-6"
                        >
                          <p className="text-sm text-white/45">
                            Choose your service and describe what you need.
                          </p>

                          {/* Service tiles */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {SERVICE_OPTIONS.map((svc) => (
                              <button
                                key={svc.value}
                                type="button"
                                onClick={() => update("serviceType", svc.value)}
                                className={`rounded-2xl border p-3.5 text-left transition ${
                                  form.serviceType === svc.value
                                    ? "border-indigo-400/40 bg-indigo-500/15 text-white"
                                    : "border-white/[0.09] bg-white/[0.04] text-white/60 hover:bg-white/[0.07]"
                                }`}
                              >
                                <div className="text-base">{svc.emoji}</div>
                                <div className="mt-1 text-sm font-medium">{svc.label}</div>
                              </button>
                            ))}
                          </div>

                          <label className={fieldLabel}>
                            Design title / description <span className="text-red-400">*</span>
                            <input
                              value={form.designTitle}
                              onChange={(e) => update("designTitle", e.target.value)}
                              placeholder="e.g. Hat front logo, company badge…"
                              className={`${inp} ${errors.designTitle ? "border-red-400/50" : ""}`}
                            />
                            {errors.designTitle && <span className="text-xs text-red-400">{errors.designTitle}</span>}
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className={fieldLabel}>
                              Placement <span className="text-white/30 text-xs">(optional)</span>
                              <input
                                value={form.placement}
                                onChange={(e) => update("placement", e.target.value)}
                                placeholder="Left chest, hat front…"
                                className={inp}
                              />
                            </label>
                            <label className={fieldLabel}>
                              Quantity
                              <input
                                type="number"
                                min="1"
                                max="5000"
                                value={form.quantity}
                                onChange={(e) => update("quantity", e.target.value)}
                                className={inp}
                              />
                            </label>
                          </div>

                          <label className={fieldLabel}>
                            Notes / special instructions <span className="text-white/30 text-xs">(optional)</span>
                            <textarea
                              value={form.notes}
                              onChange={(e) => update("notes", e.target.value)}
                              placeholder="Colors, fabric type, turnaround requirements, anything else we should know…"
                              rows={3}
                              className="w-full rounded-[1.5rem] border border-white/[0.12] bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:bg-white/[0.10] transition-all resize-none"
                            />
                          </label>
                        </motion.div>
                      ) : (
                        /* Step 3 — Files & Submit */
                        <motion.form
                          key="step-2"
                          custom={dir}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          onSubmit={handleSubmit}
                          className="grid gap-5 px-6 py-6"
                        >
                          <p className="text-sm text-white/45">
                            Upload your artwork or reference images, then submit. Files are optional but help us start faster.
                          </p>

                          <ReferenceFileUploader
                            files={refFiles}
                            onChange={setRefFiles}
                            guestEmail={!isLoggedIn ? form.email : undefined}
                            maxFiles={10}
                            disabled={submitState === "submitting"}
                          />

                          {/* Order summary pill */}
                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs text-white/50 space-y-1">
                            <div className="font-semibold text-white/70 uppercase tracking-wider text-[10px]">Summary</div>
                            <div>{form.name} · {form.email}</div>
                            <div>{SERVICE_OPTIONS.find(s => s.value === form.serviceType)?.label} · {form.designTitle}</div>
                            {form.placement && <div>Placement: {form.placement}</div>}
                            <div>Qty: {form.quantity}</div>
                          </div>

                          {submitState === "error" && (
                            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                              {message}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submitState === "submitting"}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-500 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400 hover:shadow-[0_8px_32px_rgba(99,102,241,0.50)] disabled:opacity-60"
                          >
                            {submitState === "submitting" ? (
                              <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                            ) : (
                              <>{mode === "order" ? "Submit Order" : "Submit Quote Request"}<ArrowRight className="h-4 w-4" /></>
                            )}
                          </button>

                          <p className="text-center text-[11px] text-white/25">
                            No account needed · We&apos;ll email your confirmation · Free to start
                          </p>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── Footer nav (hidden on success and step 3 which has its own submit) ── */}
                  {submitState !== "success" && step < 2 && (
                    <div className="shrink-0 flex items-center justify-between border-t border-white/[0.07] px-6 py-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={step === 0}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.05] px-5 text-sm font-medium text-white/60 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-0 disabled:pointer-events-none"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-500 px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(99,102,241,0.30)] transition hover:bg-indigo-400"
                      >
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
