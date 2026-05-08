import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MessageSquareText,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serviceSummaries } from "@/lib/marketing-data";
import { buildTitle } from "@/lib/site";

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const productionHighlights = [
  {
    icon: FileCheck2,
    title: "Production-ready files",
    text: "Prepared for real embroidery, vector, patch, or print production.",
  },
  {
    icon: MessageSquareText,
    title: "Proof-first workflow",
    text: "Review the proof before final production files are released.",
  },
  {
    icon: Clock3,
    title: "Fast turnaround",
    text: "Clear delivery timeline with rush-ready workflow support.",
  },
  {
    icon: ShieldCheck,
    title: "Quality checked",
    text: "Built around clean output, revisions, and production accuracy.",
  },
];

export async function generateStaticParams() {
  return serviceSummaries.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceSummaries.find((item) => item.slug === slug);

  if (!service) {
    return { title: buildTitle("Service") };
  }

  return {
    title: buildTitle(service.title),
    description: service.summary,
  };
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = serviceSummaries.find((item) => item.slug === slug);

  if (!service) notFound();

  return (
    <>
      <PublicPageHero
        eyebrow={service.eyebrow}
        title={service.title}
        description={service.summary}
      />

      <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28">
        <ServiceDetailBackground />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

        <div className="page-shell relative z-10">
          <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-center md:justify-between">
            <Link
              href="/services"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Service
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            {/* Included Card */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30 md:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(168,85,247,0.12),transparent_34%)]" />

              <div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/75 p-5 dark:border-white/[0.08] dark:bg-[#07111f]/65 md:p-7 lg:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        What&apos;s included
                      </div>

                      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-3xl">
                        Complete production setup
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/55">
                        {service.lead}
                      </p>
                    </div>

                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-indigo-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-300 sm:flex">
                      <Ruler className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {service.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="group flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white/70 p-4 text-sm shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/[0.08] dark:bg-white/[0.045] dark:hover:border-white/[0.16] dark:hover:shadow-black/20"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                        <span className="leading-6 text-slate-600 dark:text-white/55">
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Niches / CTA Card */}
            <div className="grid gap-6">
              <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30 md:p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.14),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(59,130,246,0.1),transparent_34%)]" />

                <div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/75 p-5 dark:border-white/[0.08] dark:bg-[#07111f]/65 md:p-7">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Available niches
                    </div>

                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      Service-specific specializations
                    </h2>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {service.niches.map((niche) => (
                        <Badge
                          key={niche}
                          className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-[11px] font-bold capitalize text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55"
                        >
                          {niche.replaceAll("-", " ")}
                        </Badge>
                      ))}
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-white/55">
                      Each niche has its own production requirements. Tell us
                      which applies when you submit your artwork — we&apos;ll
                      tailor the digitizing approach accordingly.
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                      <Link
                        href="/contact"
                        className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                      >
                        Discuss a project
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>

                      <Link
                        href="/orders"
                        className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                      >
                        Place direct order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production highlights */}
              <div className="grid gap-3 sm:grid-cols-2">
                {productionHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/[0.08] dark:bg-white/[0.045] dark:hover:border-white/[0.16] dark:hover:shadow-black/20"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-indigo-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-300">
                        <Icon className="h-4 w-4" />
                      </div>

                      <h3 className="text-sm font-black text-slate-950 dark:text-white">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-white/48">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceDetailBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

      <svg
        className="absolute -left-32 top-8 hidden h-64 w-[52rem] opacity-45 dark:opacity-28 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#serviceDetailThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="serviceDetailThreadTop"
            x1="24"
            y1="0"
            x2="820"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}