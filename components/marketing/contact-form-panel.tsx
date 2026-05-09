"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serviceOptions = [
  "Embroidery digitizing",
  "Vector art / logo redraw",
  "Custom patches",
  "Rush / specialty work",
  "Not sure — need a quote",
];

type FormStatus = "idle" | "sending" | "sent" | "error";

export function ContactFormPanel() {
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("sending");
    setErrorMsg("");

    const form = event.currentTarget;

    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      message: (
        form.elements.namedItem("message") as HTMLTextAreaElement
      ).value.trim(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setErrorMsg(result.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <Card className="relative h-fit overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[1.75rem] lg:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/8 dark:from-emerald-400/8 dark:to-indigo-400/6" />
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-emerald-400/10" />

        <CardContent className="relative z-10 flex flex-col items-center gap-4 px-5 py-14 text-center sm:px-6 sm:py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-100">
              Inquiry received
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              We&apos;ll follow up within one business day. For urgent jobs,
              mention it and we&apos;ll prioritize your request.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-500/15 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:hover:bg-indigo-400/15"
          >
            Send another inquiry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative h-fit overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[1.75rem] lg:rounded-[2rem]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

      <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
          <Send className="h-3.5 w-3.5" />
          Project inquiry
        </div>

        <CardTitle className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-100 sm:text-3xl">
          Send a project inquiry
        </CardTitle>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Tell us about your artwork and we&apos;ll reply with a quote within
          one business day.
        </p>
      </CardHeader>

      <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
        {status === "error" && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Name
              </span>

              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                className="h-11 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10"
                placeholder="Your name"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Email
              </span>

              <input
                name="email"
                required
                type="email"
                className="h-11 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Service interest
            </span>

            <select
              name="service"
              required
              className="h-11 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10"
            >
              <option value="">Select a service</option>
              {serviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Message
            </span>

            <textarea
              name="message"
              required
              minLength={10}
              maxLength={2000}
              className="min-h-[116px] resize-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-400/10"
              placeholder="Describe your artwork, garment type, size, turnaround needs, and file format."
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60 dark:bg-indigo-500 dark:text-white dark:shadow-indigo-500/20 dark:hover:bg-indigo-400"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send inquiry
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}