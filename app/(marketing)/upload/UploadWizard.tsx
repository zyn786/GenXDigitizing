"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
// Note: removed AnimatePresence — it was causing input focus loss on re-render
import { toast } from "sonner";
import {
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Zap,
  Star,
  Sparkles,
  Building2,
  Minus,
  Plus,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Shirt,
  Palette,
  Truck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TieredPricingTable } from "@/components/marketing/TieredPricingTable";

/* ── Constants ─────────────────────────────────────── */
const FORMATS = ["DST", "PES", "EMB", "EXP", "JEF", "Any"] as const;

const GARMENTS = [
  {
    id: "polo",
    label: "Polo / Shirt",
    emoji: "👔",
    placements: ["left_chest", "right_chest", "center_chest", "full_front"],
  },
  { id: "cap", label: "Cap / Hat", emoji: "🧢", placements: ["cap_front", "cap_side", "cap_back"] },
  {
    id: "jacket",
    label: "Jacket / Outerwear",
    emoji: "🧥",
    placements: ["jacket_back", "left_chest", "sleeve_left", "sleeve_right"],
  },
  {
    id: "hoodie",
    label: "Hoodie / Sweatshirt",
    emoji: "🧥",
    placements: ["center_chest", "left_chest", "hood", "sleeve_left"],
  },
  { id: "bag", label: "Bag / Backpack", emoji: "🎒", placements: ["bag_front", "bag_flap"] },
  {
    id: "towel",
    label: "Towel / Linen",
    emoji: "🧶",
    placements: ["towel_corner", "towel_center"],
  },
  { id: "patch", label: "Patch", emoji: "🏷️", placements: ["patch_standard"] },
  {
    id: "other",
    label: "Other Item",
    emoji: "📐",
    placements: ["left_chest", "jacket_back", "cap_front", "other"],
  },
] as const;

const PLACEMENT_LABELS: Record<string, { label: string; desc: string }> = {
  left_chest: { label: "Left Chest", desc: '~3.5"–4.5" wide' },
  right_chest: { label: "Right Chest", desc: '~3.5"–4.5" wide' },
  center_chest: { label: "Center Chest", desc: '~8"–12" wide' },
  full_front: { label: "Full Front", desc: '~12"–14" wide' },
  cap_front: { label: "Cap Front", desc: '~2.25" high' },
  cap_side: { label: "Cap Side", desc: '~2" wide' },
  cap_back: { label: "Cap Back", desc: '~2.5" wide' },
  jacket_back: { label: "Jacket Back", desc: '~10"–14" wide' },
  sleeve_left: { label: "Left Sleeve", desc: '~3"–4" wide' },
  sleeve_right: { label: "Right Sleeve", desc: '~3"–4" wide' },
  hood: { label: "Hood", desc: '~4"–6" wide' },
  bag_front: { label: "Bag Front", desc: '~5"–8" wide' },
  bag_flap: { label: "Bag Flap", desc: '~4"–6" wide' },
  towel_corner: { label: "Towel Corner", desc: '~4"–6" wide' },
  towel_center: { label: "Towel Center", desc: '~6"–10" wide' },
  patch_standard: { label: "Standard Patch", desc: '~2"–4" wide' },
  other: { label: "Custom", desc: "Specify in notes" },
};

const FABRICS = [
  { id: "cotton", label: "Cotton", icon: "🧵" },
  { id: "polyester", label: "Polyester", icon: "🧶" },
  { id: "denim", label: "Denim", icon: "👖" },
  { id: "leather", label: "Leather", icon: "👜" },
  { id: "fleece", label: "Fleece", icon: "🧸" },
  { id: "knit", label: "Knit / Jersey", icon: "🧣" },
  { id: "nylon", label: "Nylon", icon: "🎽" },
  { id: "performance", label: "Performance", icon: "🏃" },
  { id: "not_sure", label: "Not Sure", icon: "❓" },
] as const;

const SPEEDS = [
  {
    id: "standard",
    label: "Standard",
    time: "Guaranteed within 12 Hours",
    icon: "⭐",
    badge: "Most Popular",
  },
  { id: "rush", label: "Rush", time: "Priority Queue — 6 Hours", icon: "⚡", badge: "" },
  {
    id: "urgent",
    label: "Emergency",
    time: "Fastest Available — 2–4 Hours",
    icon: "🚀",
    badge: "",
  },
] as const;

import { SITE_INFO } from "@/lib/site-config";
import NextImage from "next/image";
const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z";

function genRef(): string {
  return `GX-${Date.now().toString(36).toUpperCase()}`;
}
function fmtSize(b: number): string {
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d={WHATSAPP_ICON_PATH} />
    </svg>
  );
}

const inputCls =
  "w-full rounded-xl px-4 py-2.5 sm:py-3 text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 placeholder:text-[var(--txt3)] transition-all";

/* ── Step config ────────────────────────────────────── */
const STEPS = [
  { num: 1, label: "Upload", icon: Upload },
  { num: 2, label: "Garment", icon: Shirt },
  { num: 3, label: "Design", icon: Palette },
  { num: 4, label: "Deliver", icon: Truck },
] as const;

/* ── Upload Page ───────────────────────────────────── */
export function UploadWizard() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<{ file: File; preview: string; fmt: string }[]>([]);
  const [garment, setGarment] = useState("");
  const [fabric, setFabric] = useState("");
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
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference] = useState(genRef);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isB2B =
    company.trim() !== "" || (email && !/@(gmail|yahoo|hotmail|outlook)\./i.test(email));
  const selGarment = GARMENTS.find((g) => g.id === garment);

  // Hide footer & nudge BackToTop
  useEffect(() => {
    const footer = document.querySelector("footer");
    const backToTop = document.querySelector<HTMLElement>('[aria-label="Back to top"]');
    const mq = window.matchMedia("(max-width: 639px)");
    if (footer) footer.style.display = "none";
    const apply = () => {
      if (backToTop) backToTop.style.bottom = mq.matches ? "88px" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      if (footer) footer.style.display = "";
      if (backToTop) backToTop.style.bottom = "";
      mq.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    if (!done) {
      setShowPostSubmit(false);
      return;
    }
    const t = setTimeout(() => setShowPostSubmit(true), 5000);
    return () => clearTimeout(t);
  }, [done]);

  /* ── File handling ──────────────────────────────── */
  function handleFiles(fl: FileList | null) {
    if (!fl) return;
    const existingPrints = new Set(
      files.map((f) => `${f.file.name}::${f.file.size}::${f.file.lastModified}`)
    );
    const incoming: { file: File; preview: string; fmt: string }[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 25MB`);
        continue;
      }
      const fp = `${f.name}::${f.size}::${f.lastModified}`;
      if (existingPrints.has(fp)) {
        toast.error(`${f.name} already added`);
        continue;
      }
      existingPrints.add(fp);
      const ext = f.name.split(".").pop()?.toUpperCase();
      const detectedFmt = ext && FORMATS.includes(ext as any) ? ext : format;
      incoming.push({ file: f, preview: URL.createObjectURL(f), fmt: detectedFmt });
    }
    if (incoming.length) setFiles((prev) => [...prev, ...incoming].slice(0, 5));
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const n = [...prev];
      URL.revokeObjectURL(n[idx].preview);
      n.splice(idx, 1);
      return n;
    });
  }

  /* ── Step validation ─────────────────────────────── */
  function canAdvance(target: number): boolean {
    if (target === 2) {
      if (files.length === 0) {
        toast.error("Upload at least 1 design file");
        return false;
      }
      return true;
    }
    if (target === 3) {
      if (!garment) {
        toast.error("Select what you're embroidering on");
        return false;
      }
      if (!placement) {
        toast.error("Select the placement");
        return false;
      }
      return true;
    }
    if (target === 4) {
      if (!designName.trim()) {
        toast.error("Name your design");
        return false;
      }
      if (!format) {
        toast.error("Select output format");
        return false;
      }
      return true;
    }
    return true;
  }

  function gotoStep(n: number) {
    if (n > step && !canAdvance(n)) return;
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Validation helpers ──────────────────────────── */
  const step1Valid = files.length > 0;
  const step2Valid = garment !== "" && placement !== "";
  const step3Valid = designName.trim() !== "" && format !== "";
  const step4Valid = name.trim() !== "" && email.trim() !== "" && email.includes("@");

  function canSubmit(): boolean {
    return step1Valid && step2Valid && step3Valid && step4Valid;
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit() {
    if (!canSubmit()) {
      if (!name.trim() || !email.trim() || !email.includes("@")) {
        toast.error("Fill in your name and email");
        return;
      }
      return;
    }
    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const fd = new FormData();
      fd.append("design_name", designName);
      fd.append("width", width);
      fd.append("height", height);
      fd.append("colors", colors);
      fd.append("placement", placement);
      fd.append("format", format);
      fd.append("speed", speed);
      fd.append("garment", garment);
      fd.append("fabric", fabric);
      fd.append("notes", `${notes}\nGarment: ${garment}\nFabric: ${fabric}`.trim());
      fd.append("name", name);
      fd.append("email", email);
      fd.append("company", company);
      files.forEach((f) => {
        fd.append("files", f.file);
        fd.append("file_formats", f.fmt);
      });

      const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/guest-order");
        const onAbort = () => {
          xhr.abort();
          resolve({ ok: false, error: "Upload cancelled" });
        };
        controller.signal.addEventListener("abort", onAbort, { once: true });
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setSubmitProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          controller.signal.removeEventListener("abort", onAbort);
          if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true });
          else {
            let msg = "Upload failed";
            try {
              const e = JSON.parse(xhr.responseText);
              msg = e.error || msg;
            } catch {}
            resolve({ ok: false, error: msg });
          }
        });
        xhr.addEventListener("error", () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve({ ok: false, error: "Network error — please check connection" });
        });
        xhr.addEventListener("abort", () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve({ ok: false, error: "Upload cancelled" });
        });
        xhr.send(fd);
      });

      if (!result.ok) {
        setSubmitError(result.error || "Upload failed");
        toast.error(result.error || "Upload failed");
        return;
      }

      setDone(true);
      toast.success("Quote request submitted! We reply within 1 hour.");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmitting(false);
      abortRef.current = null;
    }
  }

  function resetForm() {
    setDone(false);
    setFiles([]);
    setStep(1);
    setGarment("");
    setFabric("");
    setPlacement("");
    setDesignName("");
    setNotes("");
    setWidth("");
    setHeight("");
    setColors("");
    setFormat("DST");
    setCompany("");
    setName("");
    setEmail("");
    setSubmitError(null);
    setSubmitProgress(0);
  }

  /* ── WhatsApp pre-filled message ────────────────── */
  function whatsAppLink(): string {
    const lines = [
      `📋 *New Design Request* — ${reference}`,
      ``,
      `*Design:* ${designName}`,
      `*Garment:* ${GARMENTS.find((g) => g.id === garment)?.label || "—"}`,
      `*Placement:* ${PLACEMENT_LABELS[placement]?.label || placement || "—"}`,
      `*Fabric:* ${FABRICS.find((f) => f.id === fabric)?.label || "—"}`,
      `*Format:* ${format}`,
      `*Speed:* ${SPEEDS.find((s) => s.id === speed)?.label}`,
      width && `*Size:* ${width}" × ${height}"`,
      colors && `*Colors:* ${colors}`,
      notes && `*Notes:* ${notes}`,
      `*Files:* ${files.length} uploaded`,
      ``,
      `*Name:* ${name}`,
      `*Email:* ${email}`,
      company && `*Company:* ${company}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${SITE_INFO.whatsapp}?text=${encodeURIComponent(lines)}`;
  }

  /* ── Done screen ─────────────────────────────────── */
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-12">
        <div className="w-full max-w-[440px] text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-[#16A34A]/20 bg-gradient-to-br from-[#16A34A]/15 to-[#16A34A]/5 shadow-[0_8px_32px_rgba(22,163,74,0.12)] sm:mb-6 sm:h-20 sm:w-20"
          >
            <Check size={28} className="text-[#16A34A] sm:h-[34px] sm:w-[34px]" />
          </motion.div>
          <h2 className="mb-2 font-syne text-[24px] font-bold text-[var(--txt)] sm:mb-3 sm:text-[30px]">
            Request Sent!
          </h2>
          <p className="mb-2 text-[13px] leading-relaxed text-[var(--txt2)] sm:text-sm">
            Reviewing <strong className="text-[var(--txt)]">{designName}</strong>. Reply to{" "}
            <strong className="text-[var(--txt)]">{email}</strong> within 1 hour.
          </p>
          <p className="mb-4 text-[12px] font-semibold text-[#16A34A] sm:mb-6 sm:text-[13px]">
            Reference: {reference}
          </p>

          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left sm:mb-6 sm:p-5">
            <h3 className="mb-3 font-syne text-[12px] font-bold text-[var(--txt)] sm:mb-4 sm:text-[13px]">
              What happens next
            </h3>
            {[
              ["📤", "Design received & reviewed", "Now"],
              ["👨‍💼", "Assigned to a digitizer", "~30 min"],
              ["💰", "You receive a free quote", "~1 hour"],
              ["✅", "Pay only after preview approval", "After review"],
            ].map(([icon, text, time], i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-[var(--border)] py-2 last:border-0 sm:py-2.5"
              >
                <span className="text-base sm:text-lg">{icon}</span>
                <span className="flex-1 text-[12px] text-[var(--txt)] sm:text-[13px]">{text}</span>
                <span className="text-[10px] text-[var(--txt3)] sm:text-[11px]">{time}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left sm:mb-6">
            {[
              ["Design", designName],
              ["Garment", GARMENTS.find((g) => g.id === garment)?.label || "—"],
              ["Placement", PLACEMENT_LABELS[placement]?.label || placement],
              ["Fabric", FABRICS.find((f) => f.id === fabric)?.label || "—"],
              ["Format", format],
              ["Speed", SPEEDS.find((s) => s.id === speed)?.label],
              ["Files", `${files.length} uploaded`],
            ].map(([k, v]) => (
              <div
                key={k as string}
                className="flex justify-between border-b border-[var(--border)] py-1.5 text-[12px] last:border-0 sm:text-[13px]"
              >
                <span className="text-[var(--txt3)]">{k}</span>
                <span className="font-semibold text-[var(--txt)]">{v}</span>
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-3 text-[13px] font-bold text-white no-underline shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all active:scale-[0.98] sm:py-3.5 sm:text-[14px]"
          >
            📋 Create Account to Track Order
          </Link>

          <a
            href={whatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-[13px] font-bold text-white no-underline shadow-[0_4px_14px_rgba(37,211,102,0.25)] transition-all active:scale-[0.98] sm:py-3.5 sm:text-[14px]"
          >
            <WhatsAppIcon className="h-[16px] w-[16px] fill-current sm:h-[18px] sm:w-[18px]" /> Chat
            on WhatsApp
          </a>

          <div className="mb-4 flex gap-2 sm:mb-6">
            <Link href="/upload" className="flex-1" onClick={resetForm}>
              <Button variant="outline" size="md" className="w-full">
                Upload Another
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="ghost" size="md" className="w-full">
                Home
              </Button>
            </Link>
          </div>

          {showPostSubmit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center sm:p-5"
            >
              <p className="mb-3 font-syne text-[14px] font-bold text-[var(--txt)] sm:text-[15px]">
                Need another design digitized?
              </p>
              <div className="flex gap-2">
                <Link href="/upload" className="flex-1" onClick={resetForm}>
                  <Button variant="grad" size="sm" className="w-full">
                    Quick Upload
                  </Button>
                </Link>
                <a
                  href={whatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-[12px] font-semibold text-white no-underline transition-all active:scale-95 sm:text-[13px]"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" /> Chat
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP INDICATOR
     ════════════════════════════════════════════════════ */
  function StepIndicator() {
    return (
      <div className="mb-8 flex items-center justify-center gap-0 sm:mb-10">
        {STEPS.map((s, i) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          const Icon = s.icon;
          return (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 sm:h-11 sm:w-11 ${
                    isDone
                      ? "bg-[#16A34A] text-white shadow-[0_4px_12px_rgba(22,163,74,0.25)]"
                      : isActive
                        ? "scale-110 bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
                        : "border-2 border-[var(--border2)] bg-[var(--elevated)] text-[var(--txt3)]"
                  }`}
                >
                  {isDone ? (
                    <Check size={16} className="sm:h-[18px] sm:w-[18px]" />
                  ) : (
                    <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors sm:text-[11px] ${
                    isActive ? "text-[#2563EB]" : isDone ? "text-[#16A34A]" : "text-[var(--txt3)]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-0.5 mb-5 h-[2px] w-6 rounded-full transition-all duration-500 sm:mx-2 sm:w-12 ${
                    step > s.num ? "bg-[#16A34A]" : "bg-[var(--border2)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP 1: UPLOAD FILES
     ════════════════════════════════════════════════════ */
  function StepUpload() {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="mb-1 font-syne text-[18px] font-bold text-[var(--txt)] sm:text-[24px]">
            Upload Your Artwork
          </h2>
          <p className="text-[11px] text-[var(--txt2)] sm:text-[13px]">
            Any format — we'll trace and convert for embroidery
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed bg-[var(--surface)] px-4 py-8 text-center transition-all duration-300 sm:p-10 ${
            dragOver
              ? "scale-[1.02] border-[#2563EB] bg-[#2563EB]/5 shadow-[0_0_48px_rgba(37,99,235,0.12)]"
              : files.length > 0
                ? "bg-[#16A34A]/3 border-[#16A34A]/30"
                : "hover:bg-[#2563EB]/2 border-[#2563EB]/25 hover:border-[#2563EB]/50"
          }`}
        >
          <motion.div
            animate={{ scale: dragOver ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {files.length > 0 ? (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A34A]/10 sm:h-14 sm:w-14">
                <Check size={26} className="text-[#16A34A]" />
              </div>
            ) : (
              <Upload size={30} className="mx-auto mb-3 text-[#2563EB] sm:h-[34px] sm:w-[34px]" />
            )}
          </motion.div>
          <p className="mb-1 text-[15px] font-semibold text-[var(--txt)] sm:text-[16px]">
            {files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} ready`
              : dragOver
                ? "Drop your files here"
                : "Click or drag & drop files"}
          </p>
          <p className="text-[11px] text-[var(--txt3)] sm:text-xs">
            JPG · PNG · PDF · AI · EPS · SVG <span className="mx-1.5 text-[var(--border3)]">|</span>{" "}
            Up to 5 files · 25MB each
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.eps,.svg,.dst"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-all hover:border-[#2563EB]/30 hover:shadow-sm"
              >
                {/* `relative` is required: next/image `fill` sets position:absolute
                    with inset:0, so without a positioned ancestor the thumbnail
                    escapes this box and overlaps the page. `sizes` matches the
                    real rendered size — 100vw here made Next fetch an 800px-wide
                    image to paint a 56px thumbnail. */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--elevated)] sm:h-14 sm:w-14">
                  {f.file.type.startsWith("image/") ||
                  /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(f.file.name) ? (
                    <NextImage
                      fill
                      src={f.preview}
                      alt={f.file.name}
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon size={18} className="text-[var(--txt3)]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[var(--txt)]">
                    {f.file.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-[11px] text-[var(--txt3)]">{fmtSize(f.file.size)}</p>
                    <select
                      value={f.fmt}
                      onChange={(e) => {
                        setFiles((prev) => {
                          const n = [...prev];
                          n[i] = { ...n[i], fmt: e.target.value };
                          return n;
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer rounded-md border border-[var(--border2)] bg-[var(--elevated)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--txt)]"
                    >
                      {FORMATS.map((fm) => (
                        <option key={fm} value={fm}>
                          {fm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="rounded-lg p-2 text-[var(--txt3)] opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--txt3)] sm:text-[12px]">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-[#16A34A]" /> Secure upload
          </span>
          <span className="flex items-center gap-1">
            <Check size={12} className="text-[#16A34A]" /> No payment now
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-[#16A34A]" /> Fast turnaround
          </span>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP 2: GARMENT & PLACEMENT
     ════════════════════════════════════════════════════ */
  function StepGarment() {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div>
          <h2 className="mb-1 font-syne text-[18px] font-bold text-[var(--txt)] sm:text-[24px]">
            What are you embroidering?
          </h2>
          <p className="text-[11px] text-[var(--txt2)] sm:text-[13px]">
            Garment type determines the digitizing technique
          </p>
        </div>

        {/* Garment type */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
            Item Type *
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGarment(g.id);
                  setPlacement("");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all sm:rounded-2xl sm:p-4 ${
                  garment === g.id
                    ? "border-[#2563EB] bg-[#2563EB]/5 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                    : "border-[var(--border2)] hover:border-[var(--border3)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="text-xl sm:text-3xl">{g.emoji}</span>
                <span
                  className={`text-center text-[10px] font-semibold leading-tight sm:text-[12px] ${garment === g.id ? "text-[#2563EB]" : "text-[var(--txt)]"}`}
                >
                  {g.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fabric type */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
            Fabric / Material *
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {FABRICS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFabric(f.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all sm:p-3 ${
                  fabric === f.id
                    ? "border-[#2563EB] bg-[#2563EB]/5 shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                    : "border-[var(--border2)] hover:border-[var(--border3)]"
                }`}
              >
                <span className="text-lg sm:text-xl">{f.icon}</span>
                <span
                  className={`text-[10px] font-semibold sm:text-[11px] ${fabric === f.id ? "text-[#2563EB]" : "text-[var(--txt)]"}`}
                >
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Placements (dependent on garment) */}
        {selGarment && (
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
              Placement *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {selGarment.placements.map((pid) => {
                const info = PLACEMENT_LABELS[pid];
                if (!info) return null;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => setPlacement(pid)}
                    className={`flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all ${
                      placement === pid
                        ? "border-[#2563EB] bg-[#2563EB]/5 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                        : "border-[var(--border2)] hover:border-[var(--border3)]"
                    }`}
                  >
                    <span
                      className={`text-[12px] font-bold sm:text-[13px] ${placement === pid ? "text-[#2563EB]" : "text-[var(--txt)]"}`}
                    >
                      {info.label}
                    </span>
                    <span className="text-[10px] text-[var(--txt3)] sm:text-[11px]">
                      {info.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected summary */}
        {garment && placement && (
          <div className="flex items-center gap-2 rounded-xl border border-[#16A34A]/15 bg-[#16A34A]/5 p-3">
            <Check size={14} className="flex-shrink-0 text-[#16A34A]" />
            <p className="text-[12px] font-semibold text-[#16A34A] sm:text-[13px]">
              {GARMENTS.find((g) => g.id === garment)?.emoji}{" "}
              {GARMENTS.find((g) => g.id === garment)?.label} → {PLACEMENT_LABELS[placement]?.label}
              {fabric && ` on ${FABRICS.find((f) => f.id === fabric)?.label}`}
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP 3: DESIGN SPECS
     ════════════════════════════════════════════════════ */
  function StepDesign() {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div>
          <h2 className="mb-1 font-syne text-[18px] font-bold text-[var(--txt)] sm:text-[24px]">
            Design Specifications
          </h2>
          <p className="text-[11px] text-[var(--txt2)] sm:text-[13px]">
            Tell us exactly what you need
          </p>
        </div>

        {/* Design name */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--txt2)] sm:text-xs">
            Design Name *
          </label>
          <input
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder="e.g. Company Logo, Event Crest, Team Mascot"
            className={inputCls}
          />
        </div>

        {/* Dimensions + Colors */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StepperField
            label="Width (inches)"
            value={width}
            onChange={setWidth}
            placeholder="Auto"
            step={0.5}
          />
          <StepperField
            label="Height (inches)"
            value={height}
            onChange={setHeight}
            placeholder="Auto"
            step={0.5}
          />
          <StepperField
            label="Thread Colors"
            value={colors}
            onChange={setColors}
            placeholder="Auto"
            step={1}
          />
        </div>

        {/* Format */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
            Output Format *
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all sm:text-[13px] ${
                  format === f
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt2)] hover:border-[var(--border3)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--txt2)] sm:text-xs">
            Special Instructions{" "}
            <span className="font-normal normal-case text-[var(--txt3)]">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Thread brand, 3D puff, metallic thread, specific colors, backing preference…"
            className={inputCls + " resize-none"}
          />
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP 4: DELIVERY & REVIEW
     ════════════════════════════════════════════════════ */
  function StepDelivery() {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div>
          <h2 className="mb-1 font-syne text-[18px] font-bold text-[var(--txt)] sm:text-[24px]">
            Delivery & Contact
          </h2>
          <p className="text-[11px] text-[var(--txt2)] sm:text-[13px]">How fast do you need it?</p>
        </div>

        {/* Speed */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
            Turnaround Time *
          </label>
          <div className="space-y-2">
            {SPEEDS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeed(s.id)}
                className={`relative flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all sm:gap-4 sm:p-4 ${
                  speed === s.id
                    ? "bg-[#2563EB]/3 border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                    : "border-[var(--border2)] hover:border-[var(--border3)] hover:bg-[var(--surface)]"
                }`}
              >
                {s.badge && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#2563EB] px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {s.badge}
                  </span>
                )}
                <span className="text-xl sm:text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <div className="font-syne text-[14px] font-bold text-[var(--txt)] sm:text-[15px]">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-[var(--txt2)] sm:text-[12px]">{s.time}</div>
                </div>
                {speed === s.id &&
                  (i === 0 ? (
                    <Sparkles size={16} className="text-[#2563EB]" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB]">
                      <Check size={10} className="text-white" />
                    </div>
                  ))}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-[#16A34A]/15 bg-[#16A34A]/5 p-3 text-center">
            <p className="text-[12px] font-semibold text-[#16A34A]">
              <Shield size={12} className="mr-1 inline" /> All speeds are <strong>FREE</strong>. No
              rush charges. Ever.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <TieredPricingTable fileCount={files.length} />
        </div>

        {/* Order recap */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
          <h3 className="mb-3 flex items-center gap-1.5 font-syne text-[12px] font-bold text-[var(--txt)] sm:text-[13px]">
            <Info size={13} className="text-[#2563EB]" /> Order Summary
          </h3>
          <div className="space-y-0">
            {[
              ["Design", designName || "—"],
              [
                "Garment",
                (GARMENTS.find((g) => g.id === garment)?.emoji || "") +
                  " " +
                  (GARMENTS.find((g) => g.id === garment)?.label || "—"),
              ],
              ["Placement", PLACEMENT_LABELS[placement]?.label || "—"],
              [
                "Fabric",
                (FABRICS.find((f) => f.id === fabric)?.icon || "") +
                  " " +
                  (FABRICS.find((f) => f.id === fabric)?.label || "—"),
              ],
              width && ["Size", `${width}" × ${height}"`],
              colors && ["Thread Colors", colors],
              ["Output Format", format],
              ["Turnaround", SPEEDS.find((s) => s.id === speed)?.label],
              ["Files", `${files.length} file${files.length !== 1 ? "s" : ""}`],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <div
                  key={k as string}
                  className="flex items-center justify-between border-b border-[var(--border)] py-2 last:border-0"
                >
                  <span className="mr-2 flex-shrink-0 text-[11px] text-[var(--txt3)] sm:text-[12px]">
                    {k}
                  </span>
                  <span className="text-right text-[11px] font-semibold leading-tight text-[var(--txt)] sm:text-[12px]">
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* B2B banner */}
        {isB2B && (
          <div className="from-[#7C3AED]/8 to-[#2563EB]/8 rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-r p-3 sm:p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Building2 size={14} className="text-[#7C3AED]" />
              <span className="font-syne text-[13px] font-bold text-[#7C3AED] sm:text-[14px]">
                Business Account
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--txt2)] sm:text-[11px]">
              {["Volume pricing", "Account manager", "Priority queue", "Monthly billing"].map(
                (t) => (
                  <span key={t} className="flex items-center gap-1">
                    <Check size={9} className="text-[#7C3AED]" />
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-2">
          {[
            [Shield, "Free Revisions"],
            [Zap, "Fast Delivery"],
            [Check, "Pay When Satisfied"],
          ].map(([Icon, label]) => (
            <div
              key={label as string}
              className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <Icon size={14} className="text-[#16A34A]" />
              <span className="text-center text-[10px] font-semibold text-[var(--txt)]">
                {label as string}
              </span>
            </div>
          ))}
        </div>

        {/* Contact fields */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--txt2)] sm:mb-2 sm:text-xs sm:tracking-wider">
            Your Details *
          </label>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className={inputCls}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className={inputCls}
              />
            </div>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company Name (optional)"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     NAVIGATION
     ════════════════════════════════════════════════════ */
  function NavButtons() {
    return (
      <div className="flex gap-2 sm:gap-3">
        {step > 1 && (
          <button
            onClick={() => gotoStep(step - 1)}
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border2)] bg-[var(--surface)] py-3 text-[13px] font-semibold text-[var(--txt)] transition-all active:scale-[0.98] sm:py-3.5 sm:text-[14px]"
          >
            <ArrowLeft size={15} /> Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => gotoStep(step + 1)}
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] sm:py-3.5 sm:text-[14px]"
          >
            Continue <ArrowRight size={15} />
          </button>
        ) : (
          <div className="flex-1">
            {submitting && submitProgress > 0 && (
              <div
                className="mb-3 rounded-xl border p-3"
                style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.2)" }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className="flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: "#7C3AED" }}
                  >
                    <Loader2 size={12} className="animate-spin" /> Uploading… {submitProgress}%
                  </span>
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="cursor-pointer rounded border-none bg-transparent px-2 py-1 text-[11px] font-semibold"
                    style={{ color: "#B91C1C" }}
                  >
                    Cancel
                  </button>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--elevated)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${submitProgress}%`,
                      background: "linear-gradient(90deg, #7C3AED, #D946EF)",
                    }}
                  />
                </div>
              </div>
            )}
            {submitError && !submitting && (
              <div
                className="mb-3 flex items-center justify-between rounded-xl border p-3"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}
              >
                <span
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: "#B91C1C" }}
                >
                  <AlertTriangle size={12} /> {submitError}
                </span>
                <button
                  onClick={handleSubmit}
                  className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-[11px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}
                >
                  Retry
                </button>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:opacity-50 sm:py-3.5 sm:text-[14px]"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>{" "}
                  Sending…
                </>
              ) : (
                <>
                  Send My Design <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      <div className="px-4 pb-28 pt-4 sm:pb-16 sm:pt-6 lg:pt-8">
        <div className="mx-auto max-w-[600px]">
          {/* ═══ HERO ═══════════════════════════ */}
          <h1
            className="mb-1 text-center font-syne text-[22px] font-bold leading-[1.15] tracking-tight sm:text-[30px] lg:text-[36px]"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED, #D946EF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Upload Your Design
          </h1>
          <p className="mb-3 text-center text-[13px] text-[var(--txt2)] sm:mb-4 sm:text-sm">
            Free quote in ~1 hour — no payment required
          </p>

          <div className="mb-6 text-center sm:mb-8">
            <p className="mb-0.5 text-[13px] font-semibold text-[#2563EB] sm:text-[14px]">
              🎁 New clients get <strong>one FREE sample digitizing</strong>
            </p>
            <p className="text-[11px] text-[var(--txt3)] sm:text-[12px]">
              No credit card — just upload and we'll prove our quality
            </p>
          </div>

          {/* ═══ STEP INDICATOR ════════════════ */}
          {StepIndicator()}

          {/* ═══ STEP CONTENT ══════════════════ */}
          <div className="mb-6 sm:mb-8">
            <div className="transition-opacity duration-200">
              {step === 1 && StepUpload()}
              {step === 2 && StepGarment()}
              {step === 3 && StepDesign()}
              {step === 4 && StepDelivery()}
            </div>
          </div>

          {/* ═══ NAVIGATION (desktop) ═════════ */}
          <div className="hidden sm:block">
            {NavButtons()}
            {step === 4 && (
              <p className="mt-2 text-center text-[11px] text-[var(--txt3)] sm:mt-3">
                Free quote in ~1 hour · No payment required · Pay only after preview
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ STICKY NAV (mobile) ══════════════ */}
      <div className="bg-[var(--bg)]/95 fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md sm:hidden">
        <div className="mx-auto max-w-[600px]">
          {NavButtons()}
          {step === 4 && (
            <p className="mt-1 text-center text-[10px] text-[var(--txt3)]">
              Free quote in ~1 hour · Pay after preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── StepperField ──────────────────────────────────── */
function StepperField({
  label,
  value,
  onChange,
  placeholder,
  step = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: number;
}) {
  const min = 0;
  const num = value === "" ? null : Number(value);
  const dec = () => {
    const cur = num ?? 0;
    onChange(String(Math.max(min, cur - step)));
  };
  const inc = () => {
    const cur = num ?? min - step;
    onChange(String(cur + step));
  };
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold text-[var(--txt2)] sm:text-[11px]">
        {label}
      </label>
      <div className="flex overflow-hidden rounded-xl border border-[var(--border2)] bg-[var(--surface)] transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10">
        <button
          type="button"
          onClick={dec}
          className="flex w-7 flex-shrink-0 items-center justify-center text-[var(--txt3)] transition-colors hover:bg-[var(--elevated)] hover:text-[var(--txt)] active:bg-[var(--elevated2)] sm:w-10"
        >
          <Minus size={12} className="sm:h-[14px] sm:w-[14px]" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          className="w-full flex-1 border-none bg-transparent px-0 py-2 text-center text-[12px] text-[var(--txt)] outline-none [appearance:textfield] placeholder:text-[var(--txt3)] sm:px-1 sm:py-2.5 sm:text-[13px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={inc}
          className="flex w-7 flex-shrink-0 items-center justify-center text-[var(--txt3)] transition-colors hover:bg-[var(--elevated)] hover:text-[var(--txt)] active:bg-[var(--elevated2)] sm:w-10"
        >
          <Plus size={12} className="sm:h-[14px] sm:w-[14px]" />
        </button>
      </div>
    </div>
  );
}
