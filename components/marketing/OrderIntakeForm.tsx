"use client";

import { useState, useRef, type DragEvent, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ChevronLeft, Upload, Check, FileImage, X,
  Shirt, Ruler, Zap, Clock, Building2, Mail, Phone, Sparkles,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   TYPES
   ═════════════════════════════════════════════════════════════ */
interface FormData {
  projectName: string;
  garment: string;
  width: string;
  height: string;
  unit: "in" | "mm";
  formats: string[];
  files: File[];
  companyName: string;
  email: string;
  phone: string;
  turnaround: "24h" | "6h";
}

interface FieldErrors {
  [key: string]: string;
}

const GARMENTS = ["Caps", "Polos", "Hoodies", "Canvas Jackets", "T-Shirts", "Work Shirts", "Bags", "Other"];
const FORMATS = [".DST", ".PES", ".EXP", ".EMB", ".JEF", ".XXX", ".VIP", ".HUS", ".AI", ".EPS", ".PDF"];
const ACCEPTED_FILES = ".png,.jpg,.jpeg,.webp,.pdf,.ai,.psd,.svg,.eps";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/* ═════════════════════════════════════════════════════════════
   STEP INDICATOR
   ═════════════════════════════════════════════════════════════ */
function StepIndicator({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Project Details" },
    { num: 2, label: "Technical Specs" },
    { num: 3, label: "Account & Timeline" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-4 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-4 flex-1 last:flex-[0_0_auto]">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                step > s.num
                  ? "bg-[#10B981] text-white"
                  : step === s.num
                    ? "bg-[#2563EB] text-white ring-[3px] ring-[#2563EB]/20"
                    : "bg-[#1a1d25] text-[#6B7280] border border-[#1f2229]"
              }`}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span
              className={`hidden sm:block text-xs font-semibold transition-colors whitespace-nowrap ${
                step >= s.num ? "text-white" : "text-[#6B7280]"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 hidden sm:block">
              <div className={`h-[2px] transition-colors ${step > s.num ? "bg-[#10B981]" : "bg-[#1f2229]"}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   FILE DROPZONE
   ═════════════════════════════════════════════════════════════ */
function FileDropzone({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.size <= MAX_FILE_SIZE
    );
    if (dropped.length) onAdd(dropped);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onAdd(Array.from(e.target.files).filter((f) => f.size <= MAX_FILE_SIZE));
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isOver
            ? "border-[#2563EB] bg-[#2563EB]/5"
            : "border-[#2a2d35] hover:border-[#3a3d45] bg-[#0F1115]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          onChange={handleChange}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-3">
          <Upload size={24} className="text-[#2563EB]" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">
          {isOver ? "Drop files here" : "Drag & drop your design files"}
        </p>
        <p className="text-xs text-[#6B7280]">
          PNG, JPG, PDF, AI, PSD — up to 50MB each
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a1d25] border border-[#2a2d35]"
              >
                <FileImage size={16} className="text-[#2563EB] flex-shrink-0" />
                <span className="text-sm text-white truncate flex-1">{file.name}</span>
                <span className="text-[11px] text-[#6B7280] flex-shrink-0">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  className="p-1 rounded-lg hover:bg-[#DC2626]/10 text-[#6B7280] hover:text-[#DC2626] transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   VALIDATION
   ═════════════════════════════════════════════════════════════ */
function validateStep(step: number, data: FormData): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    if (!data.projectName.trim()) errors.projectName = "Project name is required";
    if (!data.garment) errors.garment = "Select a garment type";
  }

  if (step === 2) {
    if (data.formats.length === 0) errors.formats = "Select at least one format";
  }

  if (step === 3) {
    if (!data.companyName.trim()) errors.companyName = "Company name is required";
    if (!data.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
  }

  return errors;
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function OrderIntakeForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [data, setData] = useState<FormData>({
    projectName: "",
    garment: "",
    width: "",
    height: "",
    unit: "in",
    formats: [],
    files: [],
    companyName: "",
    email: "",
    phone: "",
    turnaround: "24h",
  });

  const update = (field: keyof FormData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleFormat = (fmt: string) => {
    const next = data.formats.includes(fmt)
      ? data.formats.filter((f) => f !== fmt)
      : [...data.formats, fmt];
    update("formats", next);
  };

  const handleNext = () => {
    const errs = validateStep(step, data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(step + 1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateStep(3, data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // In production: POST to /api/orders/intake
      setSubmitted(true);
    }
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 min-h-[48px] ${
      errors[field]
        ? "border-[#DC2626] bg-[#DC2626]/[0.03] focus:ring-[3px] focus:ring-[#DC2626]/10"
        : data[field as keyof FormData] && String(data[field as keyof FormData]).length > 0
          ? "border-[#10B981] bg-[#10B981]/[0.03] focus:ring-[3px] focus:ring-[#10B981]/10"
          : "border-[#2a2d35] bg-[#0F1115] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/10"
    } text-white placeholder:text-[#4B5563]`;

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="bg-[#141720] rounded-2xl border border-[#1f2229] shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-6 py-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={18} className="text-white" />
            <h3 className="font-jakarta font-bold text-lg text-white">
              {submitted ? "Order Submitted" : "New Production Order"}
            </h3>
          </div>
          <p className="text-white/70 text-sm text-center">
            {submitted
              ? "We'll send a confirmation and proof within 1 hour"
              : "Complete the form below — takes less than 2 minutes"}
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <StepIndicator step={submitted ? 4 : step} />

          <AnimatePresence mode="wait">
            {submitted ? (
              /* ── SUCCESS ──────────────────────────────── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-[#10B981]" />
                </div>
                <h4 className="font-jakarta font-bold text-xl text-white mb-2">Order Received</h4>
                <p className="text-[#6B7280] text-sm mb-4 max-w-[360px] mx-auto">
                  Your project <strong className="text-white">{data.projectName}</strong> has been submitted.
                  We&apos;ll send a confirmation to <strong className="text-white">{data.email}</strong> within 1 hour.
                </p>
                <div className="inline-flex flex-wrap gap-2 justify-center">
                  {data.formats.map((f) => (
                    <span key={f} className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1d25] text-[#6B7280] border border-[#2a2d35]">
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit} noValidate>
                  {/* ══════════════════════════════════════════
                      STEP 1: PROJECT DETAILS
                      ══════════════════════════════════════════ */}
                  {step === 1 && (
                    <div className="space-y-5">
                      {/* Project Name */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">Project Name</label>
                        <input
                          type="text"
                          value={data.projectName}
                          onChange={(e) => update("projectName", e.target.value)}
                          placeholder="e.g. Summer 2026 Caps Collection"
                          className={inputClass("projectName")}
                        />
                        {errors.projectName && (
                          <p className="text-[11px] text-[#DC2626] mt-1.5">{errors.projectName}</p>
                        )}
                      </div>

                      {/* Garment Type */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">Target Garment / Material</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {GARMENTS.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => update("garment", g)}
                              className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                data.garment === g
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-[#0F1115] text-[#9CA3AF] border-[#2a2d35] hover:border-[#3a3d45] hover:text-white"
                              } border`}
                            >
                              <Shirt size={15} />
                              {g}
                            </button>
                          ))}
                        </div>
                        {errors.garment && (
                          <p className="text-[11px] text-[#DC2626] mt-1.5">{errors.garment}</p>
                        )}
                      </div>

                      {/* Dimensions */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">Dimensions</label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Ruler size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                            <input
                              type="text"
                              value={data.width}
                              onChange={(e) => update("width", e.target.value)}
                              placeholder="Width"
                              className={`${inputClass("width")} pl-9`}
                            />
                          </div>
                          <span className="text-[#6B7280] self-center text-sm">×</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={data.height}
                              onChange={(e) => update("height", e.target.value)}
                              placeholder="Height"
                              className={inputClass("height")}
                            />
                          </div>
                          <div className="flex rounded-xl border border-[#2a2d35] overflow-hidden">
                            {(["in", "mm"] as const).map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => update("unit", u)}
                                className={`px-3 py-3 text-xs font-bold uppercase transition-colors ${
                                  data.unit === u
                                    ? "bg-[#2563EB] text-white"
                                    : "bg-[#0F1115] text-[#6B7280]"
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        Continue to Technical Specs
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════
                      STEP 2: TECHNICAL SPECS
                      ══════════════════════════════════════════ */}
                  {step === 2 && (
                    <div className="space-y-5">
                      {/* File Formats */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">
                          Required Output Formats
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {FORMATS.map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => toggleFormat(fmt)}
                              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                                data.formats.includes(fmt)
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-[#0F1115] text-[#9CA3AF] border-[#2a2d35] hover:border-[#3a3d45] hover:text-white"
                              }`}
                            >
                              {fmt}
                              {data.formats.includes(fmt) && (
                                <Check size={12} className="inline ml-1.5" />
                              )}
                            </button>
                          ))}
                        </div>
                        {errors.formats && (
                          <p className="text-[11px] text-[#DC2626] mt-1.5">{errors.formats}</p>
                        )}
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">
                          Upload Design Files
                        </label>
                        <FileDropzone
                          files={data.files}
                          onAdd={(files) => update("files", [...data.files, ...files])}
                          onRemove={(i) => update("files", data.files.filter((_, j) => j !== i))}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-[#2a2d35] text-[#9CA3AF] hover:bg-[#1a1d25] hover:text-white active:scale-[0.98] transition-all min-h-[48px]"
                        >
                          <ChevronLeft size={15} />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all min-h-[48px]"
                        >
                          Continue to Account
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════
                      STEP 3: ACCOUNT & TIMELINE
                      ══════════════════════════════════════════ */}
                  {step === 3 && (
                    <div className="space-y-5">
                      {/* Company Name */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">Company Name</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                          <input
                            type="text"
                            value={data.companyName}
                            onChange={(e) => update("companyName", e.target.value)}
                            placeholder="Your embroidery business"
                            className={`${inputClass("companyName")} pl-9`}
                          />
                        </div>
                        {errors.companyName && (
                          <p className="text-[11px] text-[#DC2626] mt-1.5">{errors.companyName}</p>
                        )}
                      </div>

                      {/* Email + Phone row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-white block mb-2">Email</label>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                            <input
                              type="email"
                              value={data.email}
                              onChange={(e) => update("email", e.target.value)}
                              placeholder="you@company.com"
                              className={`${inputClass("email")} pl-9`}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-[11px] text-[#DC2626] mt-1.5">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-white block mb-2">Phone</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                            <input
                              type="tel"
                              value={data.phone}
                              onChange={(e) => update("phone", e.target.value)}
                              placeholder="+1 (555) 000-0000"
                              className={`${inputClass("phone")} pl-9`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Turnaround Toggle */}
                      <div>
                        <label className="text-sm font-semibold text-white block mb-2">Turnaround Speed</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "24h" as const, label: "Standard", sub: "24 hours", desc: "No extra charge", icon: Clock, color: "#2563EB" },
                            { id: "6h" as const, label: "Rush", sub: "6 hours", desc: "Priority queue", icon: Zap, color: "#F59E0B" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => update("turnaround", opt.id)}
                              className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                                data.turnaround === opt.id
                                  ? "border-[#10B981] bg-[#10B981]/5"
                                  : "border-[#2a2d35] bg-[#0F1115] hover:border-[#3a3d45]"
                              }`}
                            >
                              <opt.icon size={20} className="mx-auto mb-1.5" style={{ color: data.turnaround === opt.id ? "#10B981" : "#6B7280" }} />
                              <div className="font-jakarta font-bold text-sm text-white">{opt.label}</div>
                              <div className="text-xs text-[#6B7280]">{opt.sub}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: data.turnaround === opt.id ? "#10B981" : "#6B7280" }}>
                                {opt.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-[#2a2d35] text-[#9CA3AF] hover:bg-[#1a1d25] hover:text-white active:scale-[0.98] transition-all min-h-[48px]"
                        >
                          <ChevronLeft size={15} />
                          Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_14px_rgba(16,185,129,0.2)] active:scale-[0.98] transition-all min-h-[48px]"
                        >
                          <Upload size={15} />
                          Submit Production Order
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
