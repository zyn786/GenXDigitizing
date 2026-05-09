"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  ReferenceFileUploader,
  type RefFile,
} from "@/components/shared/reference-file-uploader";

type ServiceType =
  | "EMBROIDERY_DIGITIZING"
  | "VECTOR_ART"
  | "COLOR_SEPARATION_DTF"
  | "CUSTOM_PATCHES";

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

type Step = 0 | 1 | 2;

type Props = {
  mode?: "order" | "quote";
  prefillName?: string;
  prefillEmail?: string;
  isLoggedIn?: boolean;
};

const SERVICE_OPTIONS: {
  value: ServiceType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "EMBROIDERY_DIGITIZING",
    label: "Embroidery Digitizing",
    emoji: "🧵",
    description: "DST, PES, EMB and machine-ready stitch files.",
  },
  {
    value: "VECTOR_ART",
    label: "Vector Art",
    emoji: "✏️",
    description: "Logo redraw, clean vector rebuild and print-ready art.",
  },
  {
    value: "COLOR_SEPARATION_DTF",
    label: "Color Separation / DTF",
    emoji: "🎨",
    description: "Artwork cleanup and print production preparation.",
  },
  {
    value: "CUSTOM_PATCHES",
    label: "Custom Patches",
    emoji: "🪡",
    description: "Embroidered, chenille, PVC, woven and patch artwork.",
  },
];

const STEPS = ["Contact", "Order Details", "Files & Submit"] as const;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 36 : -36,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -36 : 36,
    opacity: 0,
  }),
};

const inputClass =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10";

const textareaClass =
  "min-h-[108px] w-full resize-none rounded-[1.35rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10";

const fieldLabel =
  "grid gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200";

function buildDefault(): FormState {
  return {
    name: "",
    email: "",
    phone: "",
    serviceType: "EMBROIDERY_DIGITIZING",
    designTitle: "",
    notes: "",
    placement: "",
    quantity: "1",
  };
}

export function DirectOrderModal({
  mode = "order",
  prefillName,
  prefillEmail,
  isLoggedIn,
}: Props) {
  const prefersReduced = useReducedMotion();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>(0);
  const [dir, setDir] = React.useState(1);

  const [form, setForm] = React.useState<FormState>(() => ({
    ...buildDefault(),
    name: prefillName ?? "",
    email: prefillEmail ?? "",
  }));

  const [refFiles, setRefFiles] = React.useState<RefFile[]>([]);
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = React.useState("");
  const [orderNumber, setOrderNumber] = React.useState("");
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const dialogTitle =
    mode === "order" ? "Place a Direct Order" : "Request a Free Quote";

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update(key: keyof FormState, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((previous) => ({
        ...previous,
        [key]: undefined,
      }));
    }
  }

  function go(next: Step) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function validateContact(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateDetails(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.designTitle.trim()) {
      nextErrors.designTitle = "Design title is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateContact()) return;
    if (step === 1 && !validateDetails()) return;

    go((step + 1) as Step);
  }

  function handleBack() {
    if (step > 0) {
      go((step - 1) as Step);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (submitState === "submitting") return;
    if (!validateContact() || !validateDetails()) return;

    setSubmitState("submitting");
    setMessage("");

    const endpoint = mode === "order" ? "/api/guest/order" : "/api/guest/quote";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          serviceType: form.serviceType,
          designTitle: form.designTitle.trim(),
          notes: form.notes.trim() || undefined,
          placement: form.placement.trim() || undefined,
          quantity: Number(form.quantity) || 1,
          referenceFiles: refFiles,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        orderNumber?: string;
      };

      if (!response.ok || !result.ok) {
        setSubmitState("error");
        setMessage(result.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitState("success");
      setMessage(result.message ?? "Submitted successfully.");
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
    setForm({
      ...buildDefault(),
      name: prefillName ?? "",
      email: prefillEmail ?? "",
    });
    setRefFiles([]);
  }

  const activeService = SERVICE_OPTIONS.find(
    (service) => service.value === form.serviceType,
  );

  const portal =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/75 backdrop-blur-md"
                  initial={prefersReduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleClose}
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialogTitle}
                  className="relative z-10 flex max-h-[calc(100dvh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl shadow-black/40 dark:border-slate-800 dark:bg-[#0B1120] sm:max-h-[calc(100dvh-48px)] sm:rounded-[2rem]"
                  initial={
                    prefersReduced
                      ? false
                      : {
                          opacity: 0,
                          scale: 0.96,
                          y: 22,
                        }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={
                    prefersReduced
                      ? undefined
                      : {
                          opacity: 0,
                          scale: 0.97,
                          y: 16,
                        }
                  }
                  transition={{ duration: 0.28, ease }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />

                  <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
                        GenX Digitizing
                      </div>

                      <h2 className="mt-1 truncate text-lg font-black tracking-tight text-slate-950 dark:text-slate-100">
                        {dialogTitle}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close dialog"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-[#111C31] dark:hover:text-slate-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {submitState !== "success" && (
                    <div className="relative z-10 shrink-0 border-b border-slate-200 px-5 py-3 dark:border-slate-800 sm:px-6">
                      <div className="flex items-center">
                        {STEPS.map((label, index) => {
                          const done = index < step;
                          const active = index === step;

                          return (
                            <React.Fragment key={label}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={[
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition",
                                    done
                                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                                      : active
                                        ? "border-2 border-indigo-500 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                                        : "border border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500",
                                  ].join(" ")}
                                >
                                  {done ? "✓" : index + 1}
                                </div>

                                <span
                                  className={[
                                    "hidden text-xs font-bold transition sm:block",
                                    active
                                      ? "text-slate-950 dark:text-slate-100"
                                      : done
                                        ? "text-slate-500 dark:text-slate-400"
                                        : "text-slate-400 dark:text-slate-600",
                                  ].join(" ")}
                                >
                                  {label}
                                </span>
                              </div>

                              {index < STEPS.length - 1 && (
                                <div
                                  className={[
                                    "mx-2 h-px flex-1 transition sm:mx-3",
                                    index < step
                                      ? "bg-indigo-500/60"
                                      : "bg-slate-200 dark:bg-slate-800",
                                  ].join(" ")}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
                    <AnimatePresence mode="wait" custom={dir}>
                      {submitState === "success" ? (
                        <motion.div
                          key="success"
                          className="flex flex-col items-center gap-5 px-5 py-10 text-center sm:px-6 sm:py-12"
                          initial={
                            prefersReduced
                              ? false
                              : {
                                  opacity: 0,
                                  scale: 0.97,
                                }
                          }
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          transition={{ duration: 0.28, ease }}
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>

                          <div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">
                              {mode === "order"
                                ? "Order submitted!"
                                : "Quote request sent!"}
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                              {message}
                            </p>
                          </div>

                          {orderNumber && (
                            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0F172A]">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Reference number
                              </div>

                              <div className="mt-2 font-mono text-xl font-black text-slate-950 dark:text-slate-100">
                                {orderNumber}
                              </div>
                            </div>
                          )}

                          <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Check your email for confirmation. We&apos;ll be in
                            touch shortly.
                          </p>

                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            {orderNumber && (
                              <a
                                href={`/order-status?number=${encodeURIComponent(
                                  orderNumber,
                                )}&email=${encodeURIComponent(form.email)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                              >
                                Track your order
                                <ArrowRight className="h-4 w-4" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={handleClose}
                              className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-[#111C31]"
                            >
                              Close
                            </button>
                          </div>
                        </motion.div>
                      ) : step === 0 ? (
                        <motion.div
                          key="step-0"
                          custom={dir}
                          variants={slideVariants}
                          initial={prefersReduced ? false : "enter"}
                          animate="center"
                          exit={prefersReduced ? undefined : "exit"}
                          transition={{ duration: 0.24, ease }}
                          className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6"
                        >
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Tell us who you are so we can send your confirmation
                            and reach you if we have questions.
                          </p>

                          <label className={fieldLabel}>
                            <span>
                              Full name <span className="text-red-500">*</span>
                            </span>

                            <input
                              value={form.name}
                              onChange={(event) =>
                                update("name", event.target.value)
                              }
                              placeholder="Your full name"
                              className={`${inputClass} ${
                                errors.name
                                  ? "border-red-500/50 focus:border-red-500/50"
                                  : ""
                              }`}
                              disabled={isLoggedIn}
                            />

                            {errors.name && (
                              <span className="text-xs font-medium text-red-500">
                                {errors.name}
                              </span>
                            )}
                          </label>

                          <label className={fieldLabel}>
                            <span>
                              Email <span className="text-red-500">*</span>
                            </span>

                            <input
                              type="email"
                              value={form.email}
                              onChange={(event) =>
                                update("email", event.target.value)
                              }
                              placeholder="you@example.com"
                              className={`${inputClass} ${
                                errors.email
                                  ? "border-red-500/50 focus:border-red-500/50"
                                  : ""
                              }`}
                              disabled={isLoggedIn}
                            />

                            {errors.email && (
                              <span className="text-xs font-medium text-red-500">
                                {errors.email}
                              </span>
                            )}
                          </label>

                          <label className={fieldLabel}>
                            <span>
                              Phone{" "}
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                optional
                              </span>
                            </span>

                            <input
                              type="tel"
                              value={form.phone}
                              onChange={(event) =>
                                update("phone", event.target.value)
                              }
                              placeholder="+1 555 000 0000"
                              className={inputClass}
                            />
                          </label>
                        </motion.div>
                      ) : step === 1 ? (
                        <motion.div
                          key="step-1"
                          custom={dir}
                          variants={slideVariants}
                          initial={prefersReduced ? false : "enter"}
                          animate="center"
                          exit={prefersReduced ? undefined : "exit"}
                          transition={{ duration: 0.24, ease }}
                          className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6"
                        >
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Choose your service and describe what you need.
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {SERVICE_OPTIONS.map((service) => {
                              const selected =
                                form.serviceType === service.value;

                              return (
                                <button
                                  key={service.value}
                                  type="button"
                                  onClick={() =>
                                    update("serviceType", service.value)
                                  }
                                  className={[
                                    "rounded-2xl border p-3.5 text-left transition",
                                    selected
                                      ? "border-indigo-500/40 bg-indigo-500/10 text-slate-950 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-400/10 dark:text-slate-100"
                                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-[#111C31]",
                                  ].join(" ")}
                                >
                                  <div className="text-base">
                                    {service.emoji}
                                  </div>

                                  <div className="mt-1 text-sm font-black">
                                    {service.label}
                                  </div>

                                  <div className="mt-1 text-xs leading-5 opacity-70">
                                    {service.description}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <label className={fieldLabel}>
                            <span>
                              Design title / description{" "}
                              <span className="text-red-500">*</span>
                            </span>

                            <input
                              value={form.designTitle}
                              onChange={(event) =>
                                update("designTitle", event.target.value)
                              }
                              placeholder="e.g. Hat front logo, company badge..."
                              className={`${inputClass} ${
                                errors.designTitle
                                  ? "border-red-500/50 focus:border-red-500/50"
                                  : ""
                              }`}
                            />

                            {errors.designTitle && (
                              <span className="text-xs font-medium text-red-500">
                                {errors.designTitle}
                              </span>
                            )}
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className={fieldLabel}>
                              <span>
                                Placement{" "}
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                  optional
                                </span>
                              </span>

                              <input
                                value={form.placement}
                                onChange={(event) =>
                                  update("placement", event.target.value)
                                }
                                placeholder="Left chest, hat front..."
                                className={inputClass}
                              />
                            </label>

                            <label className={fieldLabel}>
                              Quantity

                              <input
                                type="number"
                                min="1"
                                max="5000"
                                value={form.quantity}
                                onChange={(event) =>
                                  update("quantity", event.target.value)
                                }
                                className={inputClass}
                              />
                            </label>
                          </div>

                          <label className={fieldLabel}>
                            <span>
                              Notes / special instructions{" "}
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                optional
                              </span>
                            </span>

                            <textarea
                              value={form.notes}
                              onChange={(event) =>
                                update("notes", event.target.value)
                              }
                              placeholder="Colors, fabric type, turnaround requirements, and anything else we should know."
                              rows={3}
                              className={textareaClass}
                            />
                          </label>
                        </motion.div>
                      ) : (
                        <motion.form
                          key="step-2"
                          custom={dir}
                          variants={slideVariants}
                          initial={prefersReduced ? false : "enter"}
                          animate="center"
                          exit={prefersReduced ? undefined : "exit"}
                          transition={{ duration: 0.24, ease }}
                          onSubmit={handleSubmit}
                          className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6"
                        >
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Upload your artwork or reference images, then
                            submit. Files are optional but help us start faster.
                          </p>

                          <ReferenceFileUploader
                            files={refFiles}
                            onChange={setRefFiles}
                            guestEmail={!isLoggedIn ? form.email : undefined}
                            maxFiles={10}
                            disabled={submitState === "submitting"}
                          />

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-400">
                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                              Summary
                            </div>

                            <div className="space-y-1 leading-5">
                              <div>
                                {form.name} · {form.email}
                              </div>
                              <div>
                                {activeService?.label} · {form.designTitle}
                              </div>
                              {form.placement && (
                                <div>Placement: {form.placement}</div>
                              )}
                              <div>Qty: {form.quantity}</div>
                            </div>
                          </div>

                          {submitState === "error" && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                              {message}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submitState === "submitting"}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60 dark:bg-indigo-500 dark:shadow-indigo-500/20 dark:hover:bg-indigo-400"
                          >
                            {submitState === "submitting" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                {mode === "order"
                                  ? "Submit Order"
                                  : "Submit Quote Request"}
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>

                          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                            No account needed · We&apos;ll email your
                            confirmation · Free to start
                          </p>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {submitState !== "success" && step < 2 && (
                    <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={step === 0}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-0 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-[#111C31] dark:hover:text-slate-100"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
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
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/90 active:scale-[0.98] dark:bg-indigo-500 dark:text-white dark:shadow-indigo-500/20 dark:hover:bg-indigo-400 sm:w-auto"
      >
        {mode === "order" ? "Place Direct Order" : "Get a Free Quote"}
        <Upload className="h-4 w-4" />
      </button>

      {portal}
    </>
  );
}