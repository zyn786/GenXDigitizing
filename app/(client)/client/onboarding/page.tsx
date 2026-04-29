import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, MessageCircle, Phone, Mail } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SiteLogo } from "@/components/branding/site-logo";
import { buildTitle } from "@/lib/site";
import { completeOnboardingAction } from "./actions";

export const metadata: Metadata = {
  title: buildTitle("Welcome"),
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // If already onboarded, send to dashboard
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingComplete: true, name: true },
  });

  if (dbUser?.onboardingComplete) {
    redirect("/client/dashboard");
  }

  const firstName = dbUser?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center"><SiteLogo size="sm" /></div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Let&apos;s set up your account. This takes under a minute and helps us
            deliver better, faster.
          </p>
        </div>

        <div className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-6 md:p-8">
          <form action={completeOnboardingAction} className="grid gap-6">

            {/* Company */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company name
                <span className="ml-auto text-xs text-muted-foreground">Optional</span>
              </label>
              <input
                name="companyName"
                type="text"
                maxLength={120}
                placeholder="Northline Uniforms"
                className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* WhatsApp */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                WhatsApp number
                <span className="ml-auto text-xs text-muted-foreground">Optional</span>
              </label>
              <input
                name="whatsapp"
                type="tel"
                maxLength={24}
                placeholder="+1 555 000 0000"
                className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                For urgent proof approvals and quick delivery updates.
              </p>
            </div>

            {/* Preferred contact */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Preferred contact method
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: "EMAIL", label: "Email", icon: Mail },
                  { value: "WHATSAPP", label: "WhatsApp", icon: Phone },
                  { value: "PORTAL", label: "Portal", icon: MessageCircle },
                  { value: "ANY", label: "Any", icon: MessageCircle },
                ].map(({ value, label }) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="contactMethod"
                      value={value}
                      defaultChecked={value === "EMAIL"}
                      className="peer sr-only"
                    />
                    <div className="flex h-11 items-center justify-center rounded-2xl border border-border/80 bg-background/70 text-sm font-medium text-muted-foreground transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary hover:bg-secondary">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Billing notes */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                Billing notes
                <span className="ml-auto text-xs text-muted-foreground">Optional</span>
              </label>
              <textarea
                name="billingNotes"
                maxLength={500}
                placeholder="PO numbers required, net-30 preferred, billing contact is…"
                className="min-h-[90px] rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="h-13 inline-flex items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold tracking-[0.12em] text-background transition hover:opacity-90"
            >
              ENTER MY WORKSPACE
            </button>

            <p className="text-center text-xs text-muted-foreground">
              You can update these preferences any time from your account settings.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
