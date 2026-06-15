"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Upload, X, ArrowRight, Check, Shield, Zap, Star, Sparkles, Building2, Minus, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCoupon } from "@/hooks/use-coupon";
import { OfferBanner } from "@/components/marketing/OfferBanner";
import { CouponInput } from "@/components/marketing/CouponInput";
import { TieredPricingTable } from "@/components/marketing/TieredPricingTable";

/* ── Constants ─────────────────────────────────────── */
const FORMATS = ["DST", "PES", "EMB", "EXP", "JEF", "Any"] as const;

const PLACEMENTS = [
  { id: "left_chest", label: "Left Chest", emoji: "👕" },
  { id: "cap", label: "Cap", emoji: "🧢" },
  { id: "jacket_back", label: "Jacket Back", emoji: "🧥" },
  { id: "sleeve", label: "Sleeve", emoji: "💪" },
  { id: "patch", label: "Patch", emoji: "🏷️" },
  { id: "other", label: "Other", emoji: "📐" },
] as const;

const SPEEDS = [
  { id: "standard", label: "Standard", time: "Guaranteed within 12 Hours", icon: "⭐", badge: "Most Popular" },
  { id: "rush", label: "Rush", time: "Priority Queue — 6 Hours", icon: "⚡", badge: "" },
  { id: "urgent", label: "Emergency", time: "Fastest Available — 2–4 Hours", icon: "🚀", badge: "" },
] as const;

import { SITE_INFO } from "@/lib/site-config";
const WHATSAPP_ICON_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z";

function genRef(): string { return `GX-${Date.now().toString(36).toUpperCase()}`; }
function fmtSize(b: number): string { return `${(b / 1024 / 1024).toFixed(1)} MB`; }

function WhatsAppIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className}><path d={WHATSAPP_ICON_PATH} /></svg>;
}

const inputCls = "w-full rounded-xl px-4 py-2.5 sm:py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 placeholder:text-[var(--txt3)] transition-all";

/* ── Section heading ───────────────────────────────── */
function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <span className="text-lg sm:text-xl">{emoji}</span>
      <h2 className="font-syne font-bold text-[18px] sm:text-[22px] text-[var(--txt)]">{title}</h2>
    </div>
  );
}

/* ── Upload Page ───────────────────────────────────── */
export function UploadWizard() {
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [designName, setDesignName] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [colors, setColors] = useState("");
  const [placement, setPlacement] = useState("");
  const [format, setFormat] = useState("DST");
  const [notes, setNotes] = useState("");
  const [speed, setSpeed] = useState("standard");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPostSubmit, setShowPostSubmit] = useState(false);
  const [reference] = useState(genRef);
  const fileRef = useRef<HTMLInputElement>(null);

  const isB2B = company.trim() !== "" || files.length >= 3 || (email && !/@(gmail|yahoo|hotmail|outlook)\./i.test(email));

  // Coupon / offers
  const {
    couponCode, setCouponCode,
    appliedCoupon, discount,
    isApplying, error: couponError,
    applyCoupon, removeCoupon,
    isFirstVisitor, visitorId, autoOffers,
  } = useCoupon(files.length, email);

  // Live timeline progress
  const timelineDone = [
    files.length > 0,                           // Upload
    designName.trim() !== "" && placement !== "", // Review
    name.trim() !== "" && email.includes("@"),   // Digitize (contact ready)
    false,                                       // QC Check
    false,                                       // Delivery
  ];

  // Hide footer & nudge BackToTop above sticky submit (mobile only)
  useEffect(() => {
    const footer = document.querySelector("footer");
    const backToTop = document.querySelector<HTMLElement>('[aria-label="Back to top"]');
    const mq = window.matchMedia("(max-width: 639px)");
    if (footer) footer.style.display = "none";
    const apply = () => { if (backToTop) backToTop.style.bottom = mq.matches ? "88px" : ""; };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      if (footer) footer.style.display = "";
      if (backToTop) backToTop.style.bottom = "";
      mq.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    if (!done) { setShowPostSubmit(false); return; }
    const t = setTimeout(() => setShowPostSubmit(true), 5000);
    return () => clearTimeout(t);
  }, [done]);

  /* ── File handling ──────────────────────────────── */
  function handleFiles(fl: FileList | null) {
    if (!fl) return;
    const incoming: { file: File; preview: string }[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      if (f.size > 25 * 1024 * 1024) { toast.error(`${f.name} exceeds 25MB`); continue; }
      incoming.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setFiles(prev => [...prev, ...incoming].slice(0, 5));
  }

  function removeFile(idx: number) {
    setFiles(prev => { const n = [...prev]; URL.revokeObjectURL(n[idx].preview); n.splice(idx, 1); return n; });
  }

  /* ── Validation ──────────────────────────────────── */
  function canSubmit(): boolean {
    return files.length > 0 && designName.trim() !== "" && placement !== "" && name.trim() !== "" && email.trim() !== "" && email.includes("@");
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit() {
    if (!canSubmit()) {
      if (files.length === 0) { toast.error("Upload at least 1 design file"); return; }
      if (!designName.trim() || !placement) { toast.error("Fill in design name and placement"); return; }
      if (!name.trim() || !email.trim() || !email.includes("@")) { toast.error("Fill in your name and email"); return; }
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("design_name", designName);
      fd.append("width", width); fd.append("height", height); fd.append("colors", colors);
      fd.append("placement", placement); fd.append("format", format); fd.append("speed", speed);
      fd.append("notes", notes); fd.append("name", name); fd.append("email", email);
      fd.append("company", company);
      if (appliedCoupon) {
        fd.append("coupon_code", appliedCoupon.code);
        fd.append("coupon_id", appliedCoupon.id);
        fd.append("discount_amount", String(discount));
      }
      fd.append("visitor_id", visitorId);
      files.forEach(f => fd.append("files", f.file));
      const res = await fetch("/api/upload/guest-order", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error || "Upload failed"); return; }
      setDone(true);
      toast.success("Quote request submitted! We reply within 1 hour.");
    } catch { toast.error("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  function resetForm() {
    setDone(false); setFiles([]);
    setDesignName(""); setPlacement(""); setCompany(""); setName(""); setEmail("");
    setWidth(""); setHeight(""); setColors(""); setNotes("");
  }

  /* ── Done screen ─────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-12">
        <div className="max-w-[440px] w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#16A34A]/15 to-[#16A34A]/5 border-2 border-[#16A34A]/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_8px_32px_rgba(22,163,74,0.12)]">
            <Check size={28} className="sm:w-[34px] sm:h-[34px] text-[#16A34A]" />
          </motion.div>
          <h2 className="font-syne font-bold text-[24px] sm:text-[30px] mb-2 sm:mb-3 text-[var(--txt)]">Request Sent!</h2>
          <p className="text-[13px] sm:text-sm text-[var(--txt2)] mb-2 leading-relaxed">
            Reviewing <strong className="text-[var(--txt)]">{designName}</strong>. Reply to <strong className="text-[var(--txt)]">{email}</strong> within 1 hour.
          </p>
          <p className="text-[12px] sm:text-[13px] text-[#16A34A] font-semibold mb-4 sm:mb-6">Reference: {reference}</p>

          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 text-left mb-4 sm:mb-6">
            <h3 className="font-syne font-bold text-[12px] sm:text-[13px] text-[var(--txt)] mb-3 sm:mb-4">What happens next</h3>
            {[
              ["📤", "Design received & reviewed", "Now"],
              ["👨‍💼", "Assigned to a digitizer", "~30 min"],
              ["💰", "You receive a free quote", "~1 hour"],
              ["✅", "Pay only after preview approval", "After review"],
            ].map(([icon, text, time], i) => (
              <div key={i} className="flex items-center gap-3 py-2 sm:py-2.5 border-b border-[var(--border)] last:border-0">
                <span className="text-base sm:text-lg">{icon}</span>
                <span className="flex-1 text-[12px] sm:text-[13px] text-[var(--txt)]">{text}</span>
                <span className="text-[10px] sm:text-[11px] text-[var(--txt3)]">{time}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-left mb-4 sm:mb-6">
            {[
              ["Design", designName],
              ["Placement", PLACEMENTS.find(p => p.id === placement)?.label || placement],
              ["Speed", SPEEDS.find(s => s.id === speed)?.time],
              ["Files", `${files.length} uploaded`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-1.5 text-[12px] sm:text-[13px] border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--txt3)]">{k}</span><span className="font-semibold text-[var(--txt)]">{v}</span>
              </div>
            ))}
          </div>

          <a href={`https://wa.me/${SITE_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer"
            className="w-full mb-3 py-3 sm:py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-2 no-underline shadow-[0_4px_14px_rgba(37,211,102,0.25)] active:scale-[0.98] transition-all">
            <WhatsAppIcon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] fill-current" /> Chat on WhatsApp
          </a>

          <div className="flex gap-2 mb-4 sm:mb-6">
            <Link href="/upload" className="flex-1" onClick={resetForm}><Button variant="outline" size="md" className="w-full">Upload Another</Button></Link>
            <Link href="/" className="flex-1"><Button variant="ghost" size="md" className="w-full">Home</Button></Link>
          </div>

          {showPostSubmit && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 text-center">
              <p className="font-syne font-bold text-[14px] sm:text-[15px] text-[var(--txt)] mb-3">Need another design digitized?</p>
              <div className="flex gap-2">
                <Link href="/upload" className="flex-1" onClick={resetForm}><Button variant="grad" size="sm" className="w-full">Quick Upload</Button></Link>
                <a href={`https://wa.me/${SITE_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-[12px] sm:text-[13px] no-underline active:scale-95 transition-all">
                  <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> Chat
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     SINGLE-PAGE FORM
     ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      <div className="pt-4 sm:pt-6 lg:pt-8 pb-28 sm:pb-16 px-4">
        <div className="max-w-[560px] mx-auto">

          {/* ═══ HERO ═══════════════════════════ */}
          <h1 className="font-syne font-bold text-[24px] sm:text-[30px] lg:text-[34px] mb-1 text-center tracking-tight">
            Upload Your Design
          </h1>
          <p className="text-[13px] sm:text-sm text-[var(--txt2)] text-center mb-3 sm:mb-4">
            Free quote in ~1 hour — no payment required
          </p>

          {/* ═══ OFFER BANNER ═══════════════════ */}
          <OfferBanner
            autoOffers={autoOffers}
            isFirstVisitor={isFirstVisitor}
            appliedCoupon={appliedCoupon}
            fileCount={files.length}
          />

          {/* ═══ SECTION 1: UPLOAD ══════════════ */}
          <section className="mb-6 sm:mb-8">
            <SectionHeading emoji="📤" title="Files" />

            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl px-4 py-5 sm:p-7 lg:p-9 text-center cursor-pointer transition-all duration-300 bg-[var(--surface)] ${
                dragOver ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02] shadow-[0_0_48px_rgba(37,99,235,0.12)]"
                         : files.length > 0 ? "border-[#16A34A]/30 bg-[#16A34A]/3"
                         : "border-[#2563EB]/25 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/2"}`}>
              <motion.div animate={{ scale: dragOver ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                {files.length > 0
                  ? <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-2"><Check size={22} className="text-[#16A34A]" /></div>
                  : <Upload size={26} className="sm:w-[30px] sm:h-[30px] text-[#2563EB] mx-auto mb-2" />}
              </motion.div>
              <p className="font-semibold text-[15px] sm:text-[16px] text-[var(--txt)] mb-1">
                {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : dragOver ? "Drop your files here" : "Tap to upload or drag files"}
              </p>
              <p className="text-[11px] sm:text-xs text-[var(--txt3)]">
                JPG · PNG · PDF · AI · EPS · SVG <span className="mx-1.5 text-[var(--border3)]">|</span> Up to 5 files · 25MB each
              </p>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.ai,.eps,.svg,.dst" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>

            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] group hover:border-[#2563EB]/30 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-[var(--elevated)] flex-shrink-0 border border-[var(--border)]">
                      {f.file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(f.file.name)
                        ? <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-[var(--txt3)]" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--txt)] truncate">{f.file.name}</p>
                      <p className="text-[11px] text-[var(--txt3)]">{fmtSize(f.file.size)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeFile(i); }}
                      className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 text-[var(--txt3)] opacity-0 group-hover:opacity-100 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[11px] sm:text-[12px] text-[var(--txt3)]">
              {[
                [Shield, "Secure upload"],
                [Check, "No payment required"],
                [Zap, "Fast turnaround"],
              ].map(([Icon, text]) => (
                <span key={text as string} className="flex items-center gap-1">
                  <Icon size={12} className="text-[#16A34A] flex-shrink-0" />
                  <span>{text as string}</span>
                </span>
              ))}
            </div>
          </section>

          {/* ═══ SECTION 2: DETAILS ══════════════ */}
          <section className="mb-6 sm:mb-8">
            <SectionHeading emoji="📝" title="Design Details" />

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Design Name *</label>
                <input value={designName} onChange={e => setDesignName(e.target.value)}
                  placeholder="e.g. Company Logo" className={inputCls} />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StepperField label="Width (in)" value={width} onChange={setWidth} placeholder="Not sure" step={0.5} />
                <StepperField label="Height (in)" value={height} onChange={setHeight} placeholder="Not sure" step={0.5} />
                <StepperField label="Colors" value={colors} onChange={setColors} placeholder="Auto" step={1} />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1.5 sm:mb-2">Placement *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLACEMENTS.map(p => (
                    <button key={p.id} type="button" onClick={() => setPlacement(p.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[11px] sm:text-[12px] font-medium transition-all ${
                        placement === p.id
                          ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] shadow-[0_0_0_1px_rgba(37,99,235,0.15)]"
                          : "border-[var(--border2)] text-[var(--txt2)] hover:border-[var(--border3)] hover:bg-[var(--surface)]"}`}>
                      <span className="text-base sm:text-lg">{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Format</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {FORMATS.map(f => (
                    <button key={f} type="button" onClick={() => setFormat(f)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${
                        format === f ? "bg-[#2563EB] text-white shadow-sm" : "bg-[var(--surface)] border border-[var(--border2)] text-[var(--txt2)] hover:border-[var(--border3)]"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Fabric type, special instructions..." className={inputCls + " resize-none"} />
              </div>
            </div>
          </section>

          {/* ═══ SECTION 3: SPEED ════════════════ */}
          <section className="mb-6 sm:mb-8">
            <SectionHeading emoji="⚡" title="Delivery Speed" />

            <div className="space-y-2 sm:space-y-3">
              {SPEEDS.map((s, i) => (
                <button key={s.id} type="button" onClick={() => setSpeed(s.id)}
                  className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative ${
                    speed === s.id
                      ? "border-[#2563EB] bg-[#2563EB]/3 shadow-[0_0_0_1px_rgba(37,99,235,0.2)] shadow-md"
                      : "border-[var(--border2)] hover:border-[var(--border3)] hover:bg-[var(--surface)]"}`}>
                  {s.badge && (
                    <span className="absolute -top-2 right-3 sm:right-4 bg-[#2563EB] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{s.badge}</span>
                  )}
                  <span className="text-xl sm:text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="font-syne font-bold text-[14px] sm:text-[15px] text-[var(--txt)]">{s.label}</div>
                    <div className="text-[11px] sm:text-[12px] text-[var(--txt2)]">{s.time}</div>
                  </div>
                  {speed === s.id && (i === 0
                    ? <Sparkles size={14} className="text-[#2563EB]" />
                    : <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2563EB] flex items-center justify-center"><Check size={10} className="text-white" /></div>)}
                </button>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/15 text-center">
              <p className="text-[12px] text-[#16A34A] font-semibold">
                <Shield size={12} className="inline mr-1" />
                All delivery speeds are <strong>FREE</strong>. No hidden fees. No rush charges. Ever.
              </p>
            </div>
          </section>

          {/* ═══ COUPON & PRICING ═════════════════ */}
          <section className="mb-4 sm:mb-6">
            <CouponInput
              value={couponCode}
              onChange={setCouponCode}
              onApply={applyCoupon}
              onRemove={removeCoupon}
              appliedCoupon={appliedCoupon}
              discount={discount}
              isApplying={isApplying}
              error={couponError}
            />
            <div className="mt-3 sm:mt-4">
              <TieredPricingTable fileCount={files.length} />
            </div>
          </section>

          {/* ═══ SECTION 4: REVIEW & SEND ═══════ */}
          <section className="mb-6 sm:mb-8">
            <SectionHeading emoji="✅" title="Review & Send" />

            {/* Trust inline */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-[11px] sm:text-[12px] text-[var(--txt3)]">
              <span className="flex items-center gap-1"><Shield size={11} className="text-[#16A34A]" /> Free revisions</span>
              <span className="flex items-center gap-1"><Star size={11} className="text-[#F59E0B]" /> 4.9/5 rated</span>
              <span className="flex items-center gap-1"><Zap size={11} className="text-[#F97316]" /> 1h response</span>
            </div>

            {/* Order summary */}
            {files.length > 0 && (
              <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 sm:p-4 mb-3 sm:mb-4">
                <h3 className="font-syne font-bold text-[12px] sm:text-sm mb-2 sm:mb-3 text-[var(--txt)]">Your Order</h3>
                {[
                  ["Design", designName || "—"],
                  ["Files", `${files.length} uploaded`],
                  ["Placement", PLACEMENTS.find(p => p.id === placement)?.label || "—"],
                  ["Format", format],
                  ["Speed", SPEEDS.find(s => s.id === speed)?.label],
                  width && ["Size", `${width}" × ${height}"`],
                  colors && ["Colors", colors],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k as string} className="flex justify-between py-1.5 text-[12px] sm:text-[13px] border-b border-[var(--border)] last:border-0">
                    <span className="text-[var(--txt3)]">{k}</span>
                    <span className="font-semibold text-[var(--txt)]">{v}</span>
                  </div>
                ))}
                {/* Discount row */}
                {appliedCoupon && discount > 0 && (
                  <div className="flex justify-between py-1.5 text-[12px] sm:text-[13px] border-b border-[var(--border)]">
                    <span className="text-[var(--txt3)]">Discount ({appliedCoupon.code})</span>
                    <span className="font-semibold text-[#16A34A]">-${discount.toFixed(2)}/ea</span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline — live status */}
            <div className="p-3 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-3 sm:mb-4">
              <div className="flex items-center gap-0.5 sm:gap-1">
                {["Upload", "Review", "Digitize", "QC", "Delivery"].map((l, i, arr) => (
                  <div key={l} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-500 ${
                        timelineDone[i] ? "bg-[#16A34A] shadow-[0_0_6px_rgba(22,163,74,0.3)]" : "bg-[var(--border2)]"
                      }`} />
                      <span className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap transition-colors duration-500 ${
                        timelineDone[i] ? "text-[#16A34A]" : "text-[var(--txt3)]"
                      }`}>{l}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`flex-1 h-px mx-0.5 sm:mx-1 transition-colors duration-500 ${
                        timelineDone[i] ? "bg-[#16A34A]/40" : "bg-[var(--border)]"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-[var(--txt3)] mt-2 sm:mt-3">
                Estimated: <strong className="text-[var(--txt)]">{SPEEDS.find(s => s.id === speed)?.time}</strong>
              </p>
            </div>

            {/* B2B banner */}
            {isB2B && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED]/8 to-[#2563EB]/8 border border-[#7C3AED]/20">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <Building2 size={14} className="text-[#7C3AED]" />
                  <span className="font-syne font-bold text-[13px] sm:text-[14px] text-[#7C3AED]">Business Account</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[11px] text-[var(--txt2)]">
                  <span className="flex items-center gap-1"><Check size={9} className="text-[#7C3AED]" /> Volume pricing</span>
                  <span className="flex items-center gap-1"><Check size={9} className="text-[#7C3AED]" /> Account manager</span>
                  <span className="flex items-center gap-1"><Check size={9} className="text-[#7C3AED]" /> Priority queue</span>
                  <span className="flex items-center gap-1"><Check size={9} className="text-[#7C3AED]" /> Monthly billing</span>
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
              {[
                [Shield, "Free Revisions"],
                [Zap, "Fast Delivery"],
                [Check, "Pay When Satisfied"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <Icon size={13} className="text-[#16A34A]" />
                  <span className="text-[10px] font-semibold text-[var(--txt)] text-center">{label as string}</span>
                </div>
              ))}
            </div>

            {/* Contact fields */}
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="John Doe" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">Company (optional)</label>
                <input value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Your business name" className={inputCls} />
              </div>
            </div>
          </section>

          {/* Desktop submit (inline) */}
          <div className="hidden sm:block">
            <button onClick={handleSubmit} disabled={submitting} type="button"
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold text-[14px] sm:text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)]">
              {submitting ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending…</>
              ) : (
                <>Send My Design <ArrowRight size={16} /></>
              )}
            </button>
            <p className="text-[11px] text-[var(--txt3)] text-center mt-2 sm:mt-3">
              Free quote in ~1 hour. No payment required. Pay only after you approve the preview.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky submit (mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-t border-[var(--border)] px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:hidden">
        <div className="max-w-[560px] mx-auto">
          <button onClick={handleSubmit} disabled={submitting} type="button"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold text-[13px] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
            {submitting ? "Sending…" : <>Send My Design <ArrowRight size={14} /></>}
          </button>
          <p className="text-[10px] text-[var(--txt3)] text-center mt-1">Free quote in ~1 hour · Pay after preview</p>
        </div>
      </div>
    </div>
  );
}

/* ── StepperField ──────────────────────────────────── */
function StepperField({ label, value, onChange, placeholder, step = 1 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; step?: number;
}) {
  const min = 0;
  const num = value === "" ? null : Number(value);
  const dec = () => { const cur = num ?? 0; onChange(String(Math.max(min, cur - step))); };
  const inc = () => { const cur = num ?? (min - step); onChange(String(cur + step)); };
  return (
    <div>
      <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1">{label}</label>
      <div className="flex rounded-xl border border-[var(--border2)] bg-[var(--surface)] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10 overflow-hidden transition-all">
        <button type="button" onClick={dec}
          className="w-7 sm:w-10 flex items-center justify-center text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--elevated)] active:bg-[var(--elevated2)] transition-colors flex-shrink-0">
          <Minus size={11} className="sm:w-[14px] sm:h-[14px]" />
        </button>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step}
          className="flex-1 w-full text-center px-0 sm:px-1 py-2 sm:py-3 text-[12px] sm:text-[14px] bg-transparent text-[var(--txt)] outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[var(--txt3)]" />
        <button type="button" onClick={inc}
          className="w-7 sm:w-10 flex items-center justify-center text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--elevated)] active:bg-[var(--elevated2)] transition-colors flex-shrink-0">
          <Plus size={11} className="sm:w-[14px] sm:h-[14px]" />
        </button>
      </div>
    </div>
  );
}
