"use client";

import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Loader2, MessageCircle, X } from "lucide-react";
import Link from "next/link";

const SERVICES = [
  ["embroidery", "Embroidery Digitizing"],
  ["vector", "Vector Artwork"],
  ["patch", "Custom Patches"],
  ["puff", "3D Puff / Cap"],
  ["jacket", "Jacket Back"],
  ["left-chest", "Left Chest"],
];

const FORMATS = ["DST", "PES", "EMB", "JEF", "EXP", "HUS", "XXX", "Other"];
const SPEEDS = [
  ["standard", "Standard", "12–24h"],
  ["rush", "Rush", "6h"],
  ["urgent", "Urgent", "3h"],
];

export default function UploadPageClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list);
    if (files.length + next.length > 5) {
      setError("You can upload up to 5 files.");
      return;
    }
    if (next.some((file) => file.size > 25 * 1024 * 1024)) {
      setError("Each file must be 25MB or smaller.");
      return;
    }
    setError("");
    setFiles((current) => [...current, ...next]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!files.length) {
      setError("Please upload at least one design file.");
      return;
    }

    setBusy(true);
    const form = new FormData(e.currentTarget);
    files.forEach((file) => form.append("files", file));

    try {
      const res = await fetch("/api/upload/guest-order", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We could not submit your request.");
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="rounded-3xl border border-emerald-200 bg-[var(--surface)] p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Design received.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--txt2)]">
            Your request is with the GenX team. We will review the artwork and contact you with the
            confirmed price and turnaround.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="rounded-xl bg-[var(--txt)] px-5 py-3 text-sm font-bold text-[var(--bg)] no-underline">
              Back to GenX
            </Link>
            <a
              href="https://wa.me/18302102135?text=Hi%20GenX%2C%20I%20just%20submitted%20a%20design."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border2)] px-5 py-3 text-sm font-bold text-[var(--txt)] no-underline"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div className="mb-7">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--txt2)] no-underline hover:text-[var(--txt)]">
          <ArrowLeft size={14} /> Back to GenX
        </Link>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Upload your design</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--txt2)]">
          Send the artwork and a few details. You do not need an account. We review the design first,
          then confirm the price and turnaround.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="font-bold">1. Your design</h2>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex min-h-44 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 text-center"
            >
              <FileUp className="text-blue-600" size={28} />
              <span className="mt-3 text-sm font-bold">Choose files</span>
              <span className="mt-1 text-xs text-[var(--txt2)]">PNG, JPG, WEBP, PDF, AI or PSD · up to 25MB each · max 5</span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.pdf,.ai,.psd"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </button>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={file.name + index} className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2 text-xs">
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))} className="ml-3 text-[var(--txt3)] hover:text-red-500">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="font-bold">2. What do you need?</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SERVICES.map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input name="service" value={value} type="radio" required className="peer sr-only" />
                  <span className="flex min-h-12 items-center rounded-xl border border-[var(--border)] px-3 text-xs font-semibold peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="font-bold">3. Production details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="design_name" required placeholder="Design / logo name" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="placement" required placeholder="Placement (e.g. left chest, cap front)" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="width" placeholder='Width in inches (e.g. 4")' className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="height" placeholder='Height in inches (e.g. 4")' className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="colors" placeholder="Approx. thread colors" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <select name="format" defaultValue="DST" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                {FORMATS.map((format) => <option key={format}>{format}</option>)}
              </select>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {SPEEDS.map(([value, label, time]) => (
                <label key={value} className="cursor-pointer">
                  <input name="speed" value={value} type="radio" defaultChecked={value === "standard"} className="peer sr-only" />
                  <span className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-3 text-xs peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <b>{label}</b><span className="text-[var(--txt2)]">{time}</span>
                  </span>
                </label>
              ))}
            </div>
            <textarea name="notes" placeholder="Anything we should know? Fabric, machine, stitch count, special instructions..." rows={4} className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 mt-3 resize-none" />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="font-bold">4. Your contact details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Your name" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="email" required type="email" placeholder="Email address" className="w-full rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              <input name="company" placeholder="Company (optional)" className="field sm:col-span-2" />
            </div>
          </section>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--txt)] px-6 text-sm font-bold text-[var(--bg)] disabled:opacity-60">
            {busy ? <><Loader2 size={17} className="animate-spin" /> Sending design...</> : <>Send Design for Review</>}
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:sticky lg:top-28">
          <h2 className="font-bold">What happens next?</h2>
          <div className="mt-5 space-y-4">
            {[
              ["01", "We receive your artwork"],
              ["02", "We review size, placement and complexity"],
              ["03", "We confirm your price and turnaround"],
              ["04", "You approve and we start"],
            ].map(([n, text]) => (
              <div key={n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-700">{n}</span>
                <p className="text-sm leading-5 text-[var(--txt2)]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--txt2)]">
            <b className="text-[var(--txt)]">Need an answer now?</b><br />
            Message us on WhatsApp and send your design there.
          </div>
          <a href="https://wa.me/18302102135" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white no-underline">
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </aside>
      </form>
    </main>
  );
}
