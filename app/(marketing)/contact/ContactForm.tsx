"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const SERVICES = [
  "Embroidery Digitizing",
  "Vector Redraw",
  "Patch Design",
  "Format Conversion",
  "Other",
];

const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/webp",
  "application/pdf",
  "image/vnd.adobe.photoshop", "application/postscript",
  "application/illustrator",
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upd =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Please upload PNG, JPG, WEBP, PDF, AI, or PSD files.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB.");
      return;
    }
    setFile(f);
  }

  function removeFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // All fields required
    if (!form.name || !form.email || !form.company || !form.service || !form.message) {
      toast.error("Please fill in all fields before sending.");
      return;
    }

    setSending(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("company", form.company);
      fd.append("service", form.service);
      fd.append("message", form.message);
      if (file) fd.append("artwork", file);

      const res = await fetch("/api/contact", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send message");
        return;
      }

      setDone(true);
      toast.success("Request sent with artwork — we reply within 1 hour");
    } catch {
      toast.error("Network error — try again or email support");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="bg-[var(--surface)] border border-[#16A34A]/20 rounded-2xl p-6 sm:p-10 text-center shadow-[0_20px_60px_rgba(22,163,74,0.12)]">
        <div className="text-4xl sm:text-[54px] mb-3 sm:mb-4">✅</div>

        <h3 className="font-syne font-bold text-lg sm:text-[22px] mb-2 text-[#16A34A]">
          Request Sent
        </h3>

        <p className="text-xs sm:text-sm text-[var(--txt2)] mb-4 sm:mb-6">
          We'll review your artwork and reply to{" "}
          <span className="text-[var(--txt)] font-semibold">
            {form.email}
          </span>{" "}
          within 1 hour.
        </p>

        <Button variant="grad" onClick={() => { setDone(false); setFile(null); }}>
          Send Another Request →
        </Button>
      </div>
    );
  }

  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-4 sm:p-7 md:p-8 overflow-hidden">

      <div className="absolute -top-20 -right-20 w-[220px] h-[220px] bg-[#2563EB]/20 blur-3xl rounded-full pointer-events-none" />

      <div className="mb-4 sm:mb-5">
        <h3 className="font-syne font-bold text-lg sm:text-xl">
          Send Your Request
        </h3>

        <p className="text-xs sm:text-sm text-[var(--txt3)] mt-1">
          Fill all details and upload your artwork — we reply within 1 hour
        </p>

        <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
          <span className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
            ⚡ Fast Reply
          </span>
          <span className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
            🧵 Expert Team
          </span>
          <span className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
            🔒 Secure
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 sm:gap-4">
        {/* Honeypot — hidden from humans, filled by bots */}
        <div className="absolute opacity-0 pointer-events-none" style={{ top: -9999, left: -9999 }} aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Your Name *"
            value={form.name}
            onChange={upd("name")}
            placeholder="John Doe"
          />

          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={upd("email")}
            placeholder="john@example.com"
          />
        </div>

        <Input
          label="Company *"
          value={form.company}
          onChange={upd("company")}
          placeholder="Your business name"
        />

        <Select
          label="Service Needed *"
          value={form.service}
          onChange={upd("service")}
        >
          <option value="">Select service…</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Textarea
          label="Project Details *"
          value={form.message}
          onChange={upd("message")}
          rows={4}
          placeholder="Tell us size, colors, placement, deadline, and requirements…"
        />

        {/* File Upload */}
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[var(--txt2)]">
            Upload Artwork *
          </label>

          {file ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border2)]">
              <FileText size={18} className="text-[#2563EB] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--txt)] truncate">{file.name}</p>
                <p className="text-[10px] text-[var(--txt3)]">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--elevated)] border border-[var(--border2)] flex items-center justify-center text-[var(--txt3)] hover:text-[var(--txt)] transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border2)] bg-[var(--bg)]
                flex flex-col items-center gap-2 cursor-pointer transition-all
                hover:border-[#2563EB] hover:bg-[#2563EB]/5 text-[var(--txt3)] hover:text-[#2563EB]"
            >
              <Upload size={20} />
              <span className="text-xs font-medium">Click to upload artwork</span>
              <span className="text-[10px]">PNG, JPG, WEBP, PDF, AI, PSD — max 20MB</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf,.ai,.psd"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="grad"
            size="md"
            className="w-full sm:size-lg"
            loading={sending}
          >
            <span className="sm:hidden">Send Request — Reply in 1 Hour</span>
            <span className="hidden sm:inline">Send Request with Artwork — Reply in 1 Hour</span>
          </Button>

          <p className="text-[10px] sm:text-[11px] text-[var(--txt3)] text-center mt-2 sm:mt-3">
            All fields required • Your artwork is securely uploaded
          </p>
        </div>
      </form>
    </div>
  );
}
