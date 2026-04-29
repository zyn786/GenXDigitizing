"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serviceOptions = [
  "Embroidery digitizing",
  "Vector art / logo redraw",
  "Custom patches",
  "Rush / specialty work",
  "Not sure — need a quote",
];

export function ContactFormPanel() {
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setErrorMsg(result.message ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Inquiry received</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              We&apos;ll follow up within one business day. For urgent jobs,
              mention it and we&apos;ll prioritize.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            Send another inquiry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
      <CardHeader>
        <CardTitle className="text-xl">Send a project inquiry</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us about your artwork and we&apos;ll reply with a quote within one business day.
        </p>
      </CardHeader>
      <CardContent>
        {status === "error" && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Name</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                name="email"
                required
                type="email"
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Service interest</span>
            <select
              name="service"
              required
              className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a service</option>
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Message</span>
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={2000}
              className="min-h-[120px] rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Describe your artwork, garment type, size, and turnaround needs"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send inquiry"}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
