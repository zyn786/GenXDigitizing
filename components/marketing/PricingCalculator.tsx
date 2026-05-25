"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowRight, Check, Zap, Shirt, Scissors, Clock, ChevronLeft, Sparkles, FileImage } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   PRICING LOGIC
   ═══════════════════════════════════════════════════════ */
type ServiceType = "digitizing" | "vector";
type Placement = "left-chest" | "jacket-back";
type Turnaround = "standard" | "rush";

interface FormData {
  name: string;
  email: string;
  file: File | null;
}

function calculatePrice(
  service: ServiceType,
  stitches: number,
  placement: Placement,
  turnaround: Turnaround
): { subtotal: number; speedPremium: number; total: number } {
  let subtotal = 0;

  if (service === "digitizing") {
    // Base $10 for up to 5k stitches, +$1.50 per additional 1k
    if (stitches <= 5000) {
      subtotal = 10;
    } else {
      const extraK = (stitches - 5000) / 1000;
      subtotal = 10 + extraK * 1.5;
    }
    // Placement multiplier
    if (placement === "jacket-back") {
      subtotal *= 1.6; // 60% premium for large format
    }
  } else {
    // Vector: Simple vs Complex
    subtotal = placement === "jacket-back" ? 30 : 15;
  }

  const speedMultiplier = turnaround === "rush" ? 1.3 : 1.0;
  const speedPremium = subtotal * (speedMultiplier - 1);
  const total = subtotal * speedMultiplier;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    speedPremium: Math.round(speedPremium * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/* ═══════════════════════════════════════════════════════
   STEP INDICATOR
   ═══════════════════════════════════════════════════════ */
function StepIndicator({ step }: { step: number }) {
  const steps = ["Service", "Details", "Review", "Upload"];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i + 1 <= step
                  ? "bg-[#10B981] text-white"
                  : "bg-[var(--elevated)] text-[var(--txt3)]"
              }`}
            >
              {i + 1 < step ? <Check size={13} /> : i + 1}
            </span>
            <span
              className={`hidden sm:block text-xs font-medium transition-colors ${
                i + 1 <= step ? "text-[var(--txt)]" : "text-[var(--txt3)]"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-6 sm:w-10 h-[2px] transition-colors ${
                i + 1 < step ? "bg-[#10B981]" : "bg-[var(--border2)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function PricingCalculator() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceType>("digitizing");
  const [stitches, setStitches] = useState(5000);
  const [placement, setPlacement] = useState<Placement>("left-chest");
  const [turnaround, setTurnaround] = useState<Turnaround>("standard");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({ name: "", email: "", file: null });

  const price = useMemo(
    () => calculatePrice(service, stitches, placement, turnaround),
    [service, stitches, placement, turnaround]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: POST to /api/quote or trigger CRM webhook
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-6 py-5 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={18} />
            <h3 className="font-jakarta font-bold text-lg">Instant Pricing Calculator</h3>
          </div>
          <p className="text-white/80 text-sm">Get an exact quote in 30 seconds — no signup required</p>
        </div>

        <div className="p-5 sm:p-7">
          <StepIndicator step={submitted ? 4 : step} />

          <AnimatePresence mode="wait">
            {submitted ? (
              /* ── SUCCESS STATE ──────────────────────── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-[#10B981]" />
                </div>
                <h4 className="font-jakarta font-bold text-xl mb-2">Quote Locked In!</h4>
                <p className="text-[var(--txt2)] text-sm mb-4 max-w-[360px] mx-auto">
                  Your file and details have been received. We&apos;ll send a final quote to{" "}
                  <strong className="text-[var(--txt)]">{form.email}</strong> within 1 hour.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEF3C7] text-[#92400E] text-sm font-semibold">
                  <Zap size={14} />
                  Estimated: ${price.total.toFixed(2)}
                </div>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {/* ── STEP 1: SERVICE TYPE ──────────────── */}
                {step === 1 && (
                  <div>
                    <h4 className="font-jakarta font-bold text-lg mb-1 text-center">Choose Your Service</h4>
                    <p className="text-sm text-[var(--txt2)] text-center mb-5">What type of file do you need?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          id: "digitizing" as ServiceType,
                          icon: Shirt,
                          title: "Embroidery Digitizing",
                          desc: "Production-ready stitch files for commercial machines",
                          base: "From $10",
                        },
                        {
                          id: "vector" as ServiceType,
                          icon: Scissors,
                          title: "Vector Conversion",
                          desc: "Clean AI, SVG, EPS files from any source artwork",
                          base: "From $15",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setService(opt.id)}
                          className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                            service === opt.id
                              ? "border-[#2563EB] bg-[#2563EB]/[0.03] shadow-[0_0_0_4px_rgba(37,99,235,0.06)]"
                              : "border-[var(--border)] hover:border-[var(--border3)]"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                service === opt.id ? "bg-[#2563EB] text-white" : "bg-[var(--elevated)] text-[var(--txt2)]"
                              }`}
                            >
                              <opt.icon size={20} />
                            </div>
                            <div>
                              <div className="font-jakarta font-bold text-sm">{opt.title}</div>
                              <div className="text-xs text-[#10B981] font-semibold">{opt.base}</div>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--txt2)] leading-relaxed">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all min-h-[48px]"
                    >
                      Continue
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* ── STEP 2: DETAILS ──────────────────── */}
                {step === 2 && (
                  <div>
                    <h4 className="font-jakarta font-bold text-lg mb-1 text-center">Design Details</h4>
                    <p className="text-sm text-[var(--txt2)] text-center mb-5">Help us calculate your exact price</p>

                    {/* Stitch count slider — digitizing only */}
                    {service === "digitizing" && (
                      <div className="mb-6">
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="text-sm font-semibold text-[var(--txt)]">Stitch Count</label>
                          <span className="text-sm font-bold text-[#2563EB] tabular-nums">
                            {stitches.toLocaleString()} stitches
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={25000}
                          step={1000}
                          value={stitches}
                          onChange={(e) => setStitches(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#2563EB]"
                          style={{
                            background: `linear-gradient(to right, #2563EB 0%, #2563EB ${((stitches - 1000) / 24000) * 100}%, var(--elevated) ${((stitches - 1000) / 24000) * 100}%, var(--elevated) 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-[11px] text-[var(--txt3)] mt-1.5">
                          <span>1,000</span>
                          <span>5,000 (base)</span>
                          <span>25,000</span>
                        </div>
                        {stitches > 5000 && (
                          <p className="text-[11px] text-[#F59E0B] mt-2">
                            +$1.50 per additional 1,000 stitches above 5k
                          </p>
                        )}
                      </div>
                    )}

                    {/* Placement */}
                    <div className="mb-5">
                      <label className="text-sm font-semibold text-[var(--txt)] block mb-2">Design Placement</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "left-chest" as Placement, label: "Left Chest / Cap", desc: "Standard size" },
                          { id: "jacket-back" as Placement, label: "Jacket Back / Large", desc: "+60% premium" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setPlacement(opt.id)}
                            className={`p-3.5 rounded-xl border-2 text-center transition-all duration-200 ${
                              placement === opt.id
                                ? "border-[#2563EB] bg-[#2563EB]/[0.03]"
                                : "border-[var(--border)] hover:border-[var(--border3)]"
                            }`}
                          >
                            <div className="font-jakarta font-bold text-sm">{opt.label}</div>
                            <div className="text-[11px] text-[var(--txt3)]">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Turnaround */}
                    <div>
                      <label className="text-sm font-semibold text-[var(--txt)] block mb-2">Turnaround Speed</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "standard" as Turnaround, label: "Standard 24h", desc: "Base price", icon: Clock },
                          { id: "rush" as Turnaround, label: "Rush 6h", desc: "+30%", icon: Zap },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setTurnaround(opt.id)}
                            className={`p-3.5 rounded-xl border-2 transition-all duration-200 ${
                              turnaround === opt.id
                                ? opt.id === "rush"
                                  ? "border-[#F59E0B] bg-[#FEF3C7]/30"
                                  : "border-[#2563EB] bg-[#2563EB]/[0.03]"
                                : "border-[var(--border)] hover:border-[var(--border3)]"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-0.5">
                              <opt.icon size={14} className={turnaround === opt.id && opt.id === "rush" ? "text-[#F59E0B]" : "text-[var(--txt2)]"} />
                              <span className="font-jakarta font-bold text-sm">{opt.label}</span>
                            </div>
                            <div className="text-[11px] text-[var(--txt3)]">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--txt2)] hover:bg-[var(--elevated)] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        <ChevronLeft size={15} />
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        Review Quote
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: REVIEW ────────────────────── */}
                {step === 3 && (
                  <div>
                    <h4 className="font-jakarta font-bold text-lg mb-1 text-center">Your Quote</h4>
                    <p className="text-sm text-[var(--txt2)] text-center mb-5">Review your selections below</p>

                    {/* Price summary card */}
                    <div className="bg-[var(--elevated)] rounded-xl p-5 mb-5">
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--txt2)]">
                            {service === "digitizing" ? "Embroidery Digitizing" : "Vector Conversion"}
                          </span>
                          <span className="font-semibold">
                            {service === "digitizing"
                              ? `${stitches.toLocaleString()} stitches`
                              : placement === "jacket-back"
                                ? "Complex"
                                : "Simple"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--txt2)]">
                            {placement === "left-chest" ? "Left Chest / Cap" : "Jacket Back / Large"}
                          </span>
                          <span className="font-semibold">
                            {placement === "jacket-back" ? "+60%" : "Standard"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--txt2)]">
                            {turnaround === "standard" ? "Standard 24h" : "Rush 6h"}
                          </span>
                          <span className="font-semibold">
                            {turnaround === "rush" ? "+30%" : "Included"}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-[var(--border2)] pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--txt2)]">Subtotal</span>
                          <span className="font-semibold">${price.subtotal.toFixed(2)}</span>
                        </div>
                        {price.speedPremium > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F59E0B]">Speed premium</span>
                            <span className="font-semibold text-[#F59E0B]">+${price.speedPremium.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base pt-2 border-t border-[var(--border2)]">
                          <span className="font-jakarta font-bold">Total</span>
                          <span className="font-jakarta font-extrabold text-[#10B981]">${price.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features included */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6 text-xs text-[var(--txt2)]">
                      <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> Free revisions</span>
                      <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> All formats</span>
                      <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> Machine-tested</span>
                      <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> Pay after approval</span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--txt2)] hover:bg-[var(--elevated)] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        <ChevronLeft size={15} />
                        Back
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_14px_rgba(16,185,129,0.25)] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        Lock In This Price
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: UPLOAD FORM ────────────────── */}
                {step === 4 && (
                  <form onSubmit={handleSubmit}>
                    <h4 className="font-jakarta font-bold text-lg mb-1 text-center">Upload File & Lock In Price</h4>
                    <p className="text-sm text-[var(--txt2)] text-center mb-5">
                      Your quote: <strong className="text-[#10B981]">${price.total.toFixed(2)}</strong> — we&apos;ll confirm within 1 hour
                    </p>

                    <div className="space-y-4 mb-5">
                      <div>
                        <label className="text-sm font-semibold text-[var(--txt)] block mb-1.5">Your Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="John Smith"
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/10 outline-none transition-all min-h-[48px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[var(--txt)] block mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="john@embroideryco.com"
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/10 outline-none transition-all min-h-[48px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[var(--txt)] block mb-1.5">Design File</label>
                        <div className="relative border-2 border-dashed border-[var(--border2)] rounded-xl p-6 text-center hover:border-[#2563EB]/40 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.pdf,.ai,.psd,.svg,.eps"
                            onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <FileImage size={24} className="text-[var(--txt3)] mx-auto mb-2" />
                          <p className="text-sm font-medium text-[var(--txt)]">
                            {form.file ? form.file.name : "Click to upload your design"}
                          </p>
                          <p className="text-[11px] text-[var(--txt3)] mt-1">PNG, JPG, PDF, AI — max 20MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--txt2)] hover:bg-[var(--elevated)] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        <ChevronLeft size={15} />
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_14px_rgba(16,185,129,0.25)] active:scale-[0.98] transition-all min-h-[48px]"
                      >
                        <Upload size={15} />
                        Upload File & Lock In This Price
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
