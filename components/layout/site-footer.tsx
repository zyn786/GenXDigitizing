"use client";

import Link from "next/link";
import type { Route } from "next";

import { SiteLogo } from "@/components/branding/site-logo";
import { siteConfig } from "@/lib/site";

const serviceLinks: Array<{ href: Route; label: string }> = [
  { href: "/services/embroidery-digitizing" as Route, label: "Embroidery Digitizing" },
  { href: "/services/vector-art" as Route, label: "Vector Art Conversion" },
  { href: "/services/custom-patches" as Route, label: "Custom Patches" },
  { href: "/pricing", label: "Pricing" },
  { href: "/portfolio", label: "Portfolio" },
];

const companyLinks: Array<{ href: Route; label: string }> = [
  { href: "/contact", label: "Contact Us" },
  { href: "/login", label: "Client Portal" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund Policy" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-4 pb-8 pt-8 md:px-8">
      <div className="page-shell">
        <div className="glass-panel premium-shadow rounded-[2rem] p-8 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
            {/* Brand column */}
            <div>
              <SiteLogo size="sm" />
              <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
                Premium embroidery digitizing, vector art, and custom patches — delivered
                production-ready within 24 hours.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Get a quote
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex h-9 items-center rounded-full border border-border/80 bg-card/70 px-5 text-xs font-semibold transition hover:bg-card"
                >
                  View work
                </Link>
              </div>
            </div>

            {/* Services column */}
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Services
              </div>
              <ul className="space-y-2.5">
                {serviceLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company column */}
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Company
              </div>
              <ul className="space-y-2.5">
                {companyLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </div>
            <div className="text-xs text-muted-foreground">
              Production-ready embroidery digitizing &amp; vector art.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
