"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

import { SiteLogo } from "@/components/branding/site-logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const serviceLinks: Array<{ href: Route; label: string }> = [
  {
    href: "/services/embroidery-digitizing" as Route,
    label: "Embroidery Digitizing",
  },
  {
    href: "/services/vector-art" as Route,
    label: "Vector Art Conversion",
  },
  {
    href: "/services/custom-patches" as Route,
    label: "Custom Patches",
  },
  { href: "/pricing" as Route, label: "Pricing" },
  { href: "/portfolio" as Route, label: "Portfolio" },
];

const companyLinks: Array<{ href: Route; label: string }> = [
  { href: "/contact" as Route, label: "Contact Us" },
  { href: "/login" as Route, label: "Client Portal" },
  { href: "/privacy-policy" as Route, label: "Privacy Policy" },
  { href: "/terms-and-conditions" as Route, label: "Terms & Conditions" },
  { href: "/refund-policy" as Route, label: "Refund Policy" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14 lg:py-16">
      <FooterBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />

      <div className="page-shell relative z-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20 md:p-8 lg:p-10">
          <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-12">
            {/* Brand */}
            <div>
              <SiteLogo size="sm" />

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600 dark:text-white/55">
                Premium embroidery digitizing, vector art, and custom patches —
                delivered production-ready with clean proofs and fast turnaround.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="sm"
                  className="min-h-[42px] shadow-lg shadow-indigo-500/15"
                >
                  <Link href="/contact">
                    Get a quote
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  shape="pill"
                  size="sm"
                  className="min-h-[42px] border-slate-300 bg-white/70 text-slate-900 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                >
                  <Link href="/portfolio">View work</Link>
                </Button>
              </div>
            </div>

            <FooterColumn title="Services" links={serviceLinks} />
            <FooterColumn title="Company" links={companyLinks} />
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-slate-200 pt-6 text-center dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="text-xs text-slate-500 dark:text-white/65">
              © {year} {siteConfig.name}. All rights reserved.
            </div>

            <div className="text-xs text-slate-500 dark:text-white/65">
              Production-ready embroidery digitizing &amp; vector art.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: Route; label: string }>;
}) {
  return (
    <div>
      <div className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-white/32">
        {title}
      </div>

      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-white/50 dark:hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/0 transition group-hover:bg-indigo-500" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
    </div>
  );
}