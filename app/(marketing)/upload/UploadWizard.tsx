"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, X, ArrowRight, ArrowLeft, Check, FileText, Shield, Zap, Star, Sparkles, Building2, Users, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GradientOrb } from "@/components/shared/GradientOrb";

/* ── Types ─────────────────────────────────────────── */
interface FileWithPreview {
  file: File;
  preview: string;
}

/* ── Constants ─────────────────────────────────────── */
const STEPS = ["Upload", "Details", "Speed", "Review"];

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
  { id: "standard", label: "Standard", time: "Guaranteed within 12 Hours", icon: "⭐", desc: "Recommended", badge: "Most Popular" },
  { id: "rush", label: "Rush", time: "Priority Queue — 6 Hours", icon: "⚡", desc: "Fast", badge: "" },
  { id: "urgent", label: "Emergency", time: "Fastest Available — 2–4 Hours", icon: "🚀", desc: "Urgent", badge: "" },
] as const;

/* ── Upload Wizard ─────────────────────────────────── */
export function UploadWizard() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
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
  const [trustIdx, setTrustIdx] = useState(0);
  const [liveIdx, setLiveIdx] = useState(0);
  const [showPostSubmit, setShowPostSubmit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // B2B detection
  const isB2B = company.trim() !== "" || files.length >= 3 || (email && !/@(gmail|yahoo|hotmail|outlook)\./i.test(email));

  // Rotating trust messages
  const TRUST_MSGS = [
    { icon: Star, text: "4.9/5 from 500+ reviews" },
    { icon: Shield, text: "Free unlimited revisions" },
    { icon: Zap, text: "99.8% on-time delivery" },
    { icon: TrendingUp, text: "27,000+ files delivered" },
    { icon: Users, text: "5,000+ happy clients" },
    { icon: Globe, text: "Trusted in 100+ countries" },
  ];

  useEffect(() => {
    const t = setInterval(() => setTrustIdx(i => (i + 1) % TRUST_MSGS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Live activity
  const LIVE_ACTIVITY = [
    "Ahmed from Texas uploaded a cap logo",
    "Sarah from London received her file",
    "Print shop in Sydney placed a bulk order",
    "Carlos from Mexico ordered 3D puff digitizing",
    "Emma from Toronto requested a jacket back",
    "Raj from Mumbai uploaded a vector logo",
  ];

  useEffect(() => {
    const t = setInterval(() => setLiveIdx(i => (i + 1) % LIVE_ACTIVITY.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Post-submit prompt (5s delay)
  useEffect(() => {
    if (!done) { setShowPostSubmit(false); return; }
    const t = setTimeout(() => setShowPostSubmit(true), 5000);
    return () => clearTimeout(t);
  }, [done]);

  /* ── File handling ──────────────────────────────── */
  function handleFiles(fl: FileList | null) {
    if (!fl) return;
    const incoming: FileWithPreview[] = [];
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

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  /* ── Validation ──────────────────────────────────── */
  function canAdvance(s: number): boolean {
    if (s === 0) return files.length > 0;
    if (s === 1) return designName.trim() !== "" && placement !== "";
    if (s === 2) return true;
    if (s === 3) return name.trim() !== "" && email.trim() !== "" && email.includes("@");
    return false;
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit() {
    if (!canAdvance(3)) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("design_name", designName);
      fd.append("width", width);
      fd.append("height", height);
      fd.append("colors", colors);
      fd.append("placement", placement);
      fd.append("format", format);
      fd.append("speed", speed);
      fd.append("notes", notes);
      fd.append("name", name);
      fd.append("email", email);
      fd.append("company", company);
      files.forEach(f => fd.append("files", f.file));

      const res = await fetch("/api/upload/guest-order", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error || "Upload failed"); return; }
      setDone(true);
      toast.success("Quote request submitted! We reply within 1 hour.");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Done screen ─────────────────────────────────── */
  if (done) {
    const ref = `GX-${Date.now().toString(36).toUpperCase()}`;
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-12">
        <div className="max-w-[440px] w-full text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#16A34A]/15 to-[#16A34A]/5 border-2 border-[#16A34A]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_8px_32px_rgba(22,163,74,0.12)]">
            <Check size={34} className="text-[#16A34A]" />
          </div>
          <h2 className="font-syne font-bold text-[26px] sm:text-[30px] mb-3 text-[var(--txt)]">Request Sent!</h2>
          <p className="text-sm text-[var(--txt2)] mb-2 leading-relaxed">
            We&apos;ll review <strong className="text-[var(--txt)]">{designName}</strong> and reply to <strong className="text-[var(--txt)]">{email}</strong> within 1 hour.
          </p>
          <p className="text-[13px] text-[#16A34A] font-semibold mb-6">Reference: {ref}</p>

          {/* Timeline */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 text-left mb-6">
            <h3 className="font-syne font-bold text-[13px] text-[var(--txt)] mb-4">What happens next</h3>
            {[
              { icon: "📤", text: "Design received & reviewed", time: "Now" },
              { icon: "👨‍💼", text: "Assigned to a digitizer", time: "~30 min" },
              { icon: "💰", text: "You receive a free quote", time: "~1 hour" },
              { icon: "✅", text: "Pay only after preview approval", time: "After review" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-[13px] text-[var(--txt)]">{item.text}</span>
                <span className="text-[11px] text-[var(--txt3)]">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Order summary compact */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-left mb-6">
            {[
              ["Design", designName],
              ["Placement", PLACEMENTS.find(p => p.id === placement)?.label || placement],
              ["Speed", SPEEDS.find(s => s.id === speed)?.time],
              ["Files", `${files.length} uploaded`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-1.5 text-[13px] border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--txt3)]">{k}</span>
                <span className="font-semibold text-[var(--txt)]">{v}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp support */}
          <a href={`https://wa.me/${"18302102135"}`} target="_blank" rel="noopener noreferrer"
            className="w-full mb-3 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-[14px] flex items-center justify-center gap-2 no-underline shadow-[0_4px_14px_rgba(37,211,102,0.25)] active:scale-[0.98] transition-all">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            Chat on WhatsApp
          </a>

          <div className="flex gap-2 mb-6">
            <Link href="/upload" className="flex-1" onClick={() => { setDone(false); setStep(0); setFiles([]); setDesignName(""); setPlacement(""); setCompany(""); setName(""); setEmail(""); setWidth(""); setHeight(""); setColors(""); setNotes(""); }}>
              <Button variant="outline" size="md" className="w-full">Upload Another</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="ghost" size="md" className="w-full">Home</Button>
            </Link>
          </div>

          {/* Post-submit CTA — appears after 5s */}
          {showPostSubmit && (
            <div className="animate-fade-in-up rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 text-center">
              <p className="font-syne font-bold text-[15px] text-[var(--txt)] mb-3">Need another design digitized?</p>
              <div className="flex gap-2">
                <Link href="/upload" className="flex-1" onClick={() => { setDone(false); setStep(0); setFiles([]); }}>
                  <Button variant="grad" size="sm" className="w-full">Quick Upload</Button>
                </Link>
                <a href={`https://wa.me/${"18302102135"}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-[13px] no-underline active:scale-95 transition-all">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  Chat
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* Progress bar */}
      <div className="fixed top-[100px] lg:top-[104px] inset-x-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-[600px] mx-auto px-4 py-3 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                i < step ? "bg-[#16A34A] text-white" :
                i === step ? "bg-[#2563EB] text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:block whitespace-nowrap ${
                i <= step ? "text-[var(--txt)]" : "text-gray-300"
              }`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-[#16A34A]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Rotating trust strip */}
      <div className="fixed top-[148px] lg:top-[152px] inset-x-0 z-30 bg-[#2563EB]/5 border-b border-[#2563EB]/10">
        <div className="max-w-[600px] mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#2563EB] transition-all">
          {(() => { const T = TRUST_MSGS[trustIdx]; return <><T.icon size={12} />{T.text}</>; })()}
        </div>
      </div>

      {/* Live activity ticker */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[var(--bg)]/95 border-t border-[var(--border)] sm:hidden">
        <div className="px-4 py-1.5 text-center text-[11px] text-[var(--txt3)] font-medium animate-fade-in-up">
          🟢 {LIVE_ACTIVITY[liveIdx]} · just now
        </div>
      </div>

      <div className="pt-[180px] lg:pt-[186px] pb-28 px-4">
        <div className="max-w-[560px] mx-auto">
          <GradientOrb color="#2563EB" size={200} className="-top-20 left-1/2 -translate-x-1/2 opacity-8" />

          {/* ── Step 1: Upload ─────────────────────── */}
          {step === 0 && (
            <div>
              <h1 className="font-syne font-bold text-2xl sm:text-3xl mb-2 text-center">Upload Your Design</h1>
              <p className="text-sm text-[var(--txt2)] text-center mb-6">Drag & drop or browse — JPG, PNG, PDF, AI, EPS, SVG</p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 bg-[var(--surface)] ${
                  dragOver
                    ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02] shadow-[0_0_40px_rgba(37,99,235,0.1)]"
                    : "border-[#2563EB]/25 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/2"
                }`}
              >
                <div className={`transition-transform duration-300 ${dragOver ? "scale-110" : ""}`}>
                  <Upload size={36} className="text-[#2563EB] mx-auto mb-3" />
                </div>
                <p className="font-semibold text-[15px] text-[var(--txt)] mb-1">
                  {dragOver ? "Drop your files here" : "Drop files here or click to browse"}
                </p>
                <p className="text-xs text-[var(--txt3)]">JPG, PNG, PDF, AI, EPS, SVG · Max 25MB each · Up to 5 files</p>
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.ai,.eps,.svg,.dst" className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] group hover:border-[var(--border3)] transition-all">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--elevated)] flex-shrink-0 border border-[var(--border)]">
                        {f.file.type.startsWith("image/") ? (
                          <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-[var(--txt3)]" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--txt)] truncate">{f.file.name}</p>
                        <p className="text-[11px] text-[var(--txt3)]">{(f.file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-[var(--txt3)] opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Details ─────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2 text-center">Tell us about your design</h2>
              <p className="text-sm text-[var(--txt2)] text-center mb-6">Only design name and placement are required — we can figure out the rest</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Design Name *</label>
                  <input value={designName} onChange={e => setDesignName(e.target.value)} placeholder="e.g. Company Logo" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Width (in)</label>
                    <input value={width} onChange={e => setWidth(e.target.value)} placeholder="Not sure" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] placeholder:text-[var(--txt3)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Height (in)</label>
                    <input value={height} onChange={e => setHeight(e.target.value)} placeholder="Not sure" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] placeholder:text-[var(--txt3)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Colors</label>
                    <input value={colors} onChange={e => setColors(e.target.value)} placeholder="Auto" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] placeholder:text-[var(--txt3)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--txt2)] mb-2">Placement *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLACEMENTS.map(p => (
                      <button key={p.id} onClick={() => setPlacement(p.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[12px] font-medium transition-all ${
                          placement === p.id ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]" : "border-[var(--border2)] text-[var(--txt2)] hover:border-[var(--border3)]"
                        }`}>
                        <span className="text-lg">{p.emoji}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setFormat(f)}
                        className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                          format === f ? "bg-[#2563EB] text-white" : "bg-[var(--surface)] border border-[var(--border2)] text-[var(--txt2)] hover:border-[var(--border3)]"
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Fabric type, special instructions..." className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Speed ───────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2 text-center">How fast do you need it?</h2>
              <p className="text-sm text-[var(--txt2)] text-center mb-6">All speeds included at no extra charge</p>
              <div className="space-y-3">
                {SPEEDS.map((s, i) => (
                  <button key={s.id} onClick={() => setSpeed(s.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all relative ${
                      speed === s.id
                        ? "border-[#2563EB] bg-[#2563EB]/3 shadow-[0_0_0_1px_rgba(37,99,235,0.2)] shadow-md"
                        : "border-[var(--border2)] hover:border-[var(--border3)]"
                    }`}>
                    {s.badge && (
                      <span className="absolute -top-2.5 right-4 bg-[#2563EB] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {s.badge}
                      </span>
                    )}
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-syne font-bold text-[15px] text-[var(--txt)]">{s.label}</div>
                      <div className="text-[12px] text-[var(--txt2)]">{s.time}</div>
                    </div>
                    {i === 0 && speed === s.id && (
                      <Sparkles size={16} className="text-[#2563EB]" />
                    )}
                    {speed === s.id && i !== 0 && (
                      <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"><Check size={11} className="text-white" /></div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/15 text-center">
                <p className="text-[13px] text-[#16A34A] font-semibold leading-relaxed">
                  <Shield size={14} className="inline mr-1" />
                  All delivery speeds are <strong>FREE</strong>. No hidden fees. No rush charges. Ever.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ──────────────── */}
          {step === 3 && (
            <div>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-2 text-center">Review & Send</h2>
              <p className="text-sm text-[var(--txt2)] text-center mb-4">Double-check everything — we'll start right away</p>

              {/* B2B banner */}
              {isB2B && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED]/8 to-[#2563EB]/8 border border-[#7C3AED]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-[#7C3AED]" />
                    <span className="font-syne font-bold text-[14px] text-[#7C3AED]">Business Account Detected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[var(--txt2)]">
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#7C3AED]" /> Volume pricing available</span>
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#7C3AED]" /> Dedicated account manager</span>
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#7C3AED]" /> Priority queue</span>
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#7C3AED]" /> Monthly billing available</span>
                  </div>
                </div>
              )}

              {/* Timeline preview */}
              <div className="mb-5 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <h3 className="font-syne font-bold text-[12px] text-[var(--txt3)] uppercase tracking-wider mb-3">Your Timeline</h3>
                <div className="flex items-center gap-1">
                  {[
                    { label: "Upload", done: true },
                    { label: "Review", done: true },
                    { label: "Digitize", done: false },
                    { label: "QC Check", done: false },
                    { label: "Delivery", done: false },
                  ].map((t, i, arr) => (
                    <div key={t.label} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${t.done ? "bg-[#16A34A]" : "bg-[var(--border2)]"}`} />
                        <span className={`text-[9px] font-semibold whitespace-nowrap ${t.done ? "text-[#16A34A]" : "text-[var(--txt3)]"}`}>{t.label}</span>
                      </div>
                      {i < arr.length - 1 && <div className={`flex-1 h-px mx-0.5 ${t.done ? "bg-[#16A34A]" : "bg-[var(--border)]"}`} />}
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] text-[var(--txt3)] mt-3">
                  Estimated completion: <strong className="text-[var(--txt)]">{SPEEDS.find(s => s.id === speed)?.time}</strong>
                </p>
              </div>

              {/* Trust strip */}
              <div className="flex items-center justify-center gap-4 mb-5 text-[11px] text-[var(--txt3)]">
                <span className="flex items-center gap-1"><Shield size={11} className="text-[#16A34A]" /> Free revisions</span>
                <span className="flex items-center gap-1"><Star size={11} className="text-[#F59E0B]" /> 4.9/5 rated</span>
                <span className="flex items-center gap-1"><Zap size={11} className="text-[#F97316]" /> 1h response</span>
              </div>

              {/* Order summary */}
              <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-5">
                <h3 className="font-syne font-bold text-sm mb-3 text-[var(--txt)]">Your Order</h3>
                {[
                  ["Design", designName],
                  ["Files", `${files.length} uploaded`],
                  ["Placement", PLACEMENTS.find(p => p.id === placement)?.label],
                  ["Format", format],
                  ["Speed", `${SPEEDS.find(s => s.id === speed)?.icon} ${SPEEDS.find(s => s.id === speed)?.label} (${SPEEDS.find(s => s.id === speed)?.time})`],
                  width && ["Size", `${width}" × ${height}"`],
                  colors && ["Colors", colors],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k as string} className="flex justify-between py-2 text-[13px] border-b border-[var(--border)] last:border-0">
                    <span className="text-[var(--txt3)]">{k}</span>
                    <span className="font-semibold text-[var(--txt)]">{v}</span>
                  </div>
                ))}
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { icon: Shield, label: "Free Revisions" },
                  { icon: Zap, label: "Fast Delivery" },
                  { icon: Check, label: "Pay When Satisfied" },
                ].map(g => (
                  <div key={g.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <g.icon size={14} className="text-[#16A34A]" />
                    <span className="text-[10px] font-semibold text-[var(--txt)] text-center">{g.label}</span>
                  </div>
                ))}
              </div>

              {/* Contact fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--txt2)] mb-1.5">Company (optional)</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your business name" className="w-full rounded-xl px-4 py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB]" />
                </div>
              </div>

              {/* B2B detection */}
              {(company || files.length >= 3) && (
                <div className="mt-4 p-3 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/15 text-center">
                  <p className="text-[12px] text-[#7C3AED] font-semibold">
                    🏢 Need ongoing digitizing? <span className="underline cursor-pointer">Ask about B2B volume pricing →</span>
                  </p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold text-[15px] shadow-[0_6px_24px_rgba(37,99,235,0.35)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? "Sending…" : <>
                  Send My Design
                  <ArrowRight size={17} />
                </>}
              </button>
              <p className="text-[11px] text-[var(--txt3)] text-center mt-3">
                Free quote in ~1 hour. No payment required. Pay only after you approve the preview.
              </p>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────── */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3.5 rounded-2xl border border-[var(--border2)] text-[var(--txt2)] font-semibold text-[14px] hover:bg-[var(--surface)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {step < 3 && (
              <button onClick={() => canAdvance(step) ? setStep(s => s + 1) : toast.error(step === 0 ? "Please upload at least one design file" : "Please fill in the design name and placement")}
                className={`flex-[2] py-3.5 rounded-2xl text-white font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${
                  canAdvance(step) ? "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_16px_rgba(37,99,235,0.3)]" : "bg-gray-300 cursor-not-allowed"
                }`}>
                {step === 0 ? "Continue to Details" : step === 1 ? "Continue to Speed" : "Continue to Review"}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
