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
  return serviceSummaries.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceSummaries.find((item) => item.slug === slug);

  if (!service) {
    return {
      title: buildTitle("Service"),
    };
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

  if (!service) {
    notFound();
  }

  return (
    <>
      <PublicPageHero
        eyebrow={service.eyebrow}
        title={service.title}
        description={service.summary}
      />

      <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-12 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-16 lg:py-20">
        <ServiceDetailBackground />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />

        <div className="page-shell relative z-10">
          <div className="mb-7 flex flex-col gap-3 md:mb-9 md:flex-row md:items-center md:justify-between">
            <Link
              href="/services"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:bg-white hover:text-slate-950 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-300 dark:hover:bg-[#111C31] dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Service
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-6">
            <div className="relative h-fit overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[2rem] md:p-4">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

              <div className="relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white/85 p-5 dark:border-slate-800 dark:bg-[#0F172A] sm:rounded-[1.75rem] md:p-7 lg:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        What&apos;s included
                      </div>

                      <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-100 md:text-3xl">
                        Complete production setup
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                        {service.lead}
                      </p>
                    </div>

                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:flex">
                      <Ruler className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {service.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="group flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 text-sm shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/5 dark:border-slate-700 dark:bg-[#111C31] dark:hover:border-slate-600 dark:hover:bg-[#162238] dark:hover:shadow-black/20 sm:rounded-[1.5rem]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />

                        <span className="leading-6 text-slate-600 dark:text-slate-400">
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid h-fit gap-5">
              <div className="relative h-fit overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[2rem] md:p-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
                <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-cyan-400/10" />

                <div className="relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white/85 p-5 dark:border-slate-800 dark:bg-[#0F172A] sm:rounded-[1.75rem] md:p-7">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Available niches
                    </div>

                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-100">
                      Service-specific specializations
                    </h2>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {service.niches.map((niche) => (
                        <Badge
                          key={niche}
                          className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold capitalize text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-[#111C31] dark:text-slate-300"
                        >
                          {niche.replaceAll("-", " ")}
                        </Badge>
                      ))}
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-400">
                      Each niche has its own production requirements. Tell us
                      which applies when you submit your artwork — we&apos;ll
                      tailor the production approach accordingly.
                    </p>

                    <div className="mt-7 flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
                      <Link
                        href="/contact"
                        className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-indigo-500 dark:shadow-indigo-500/20 dark:hover:bg-indigo-400"
                      >
                        Discuss a project
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>

                      <Link
                        href="/order"
                        className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:hover:bg-[#111C31]"
                      >
                        Place direct order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {productionHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-[#0B1120] dark:hover:border-slate-700 dark:hover:bg-[#0F172A] dark:hover:shadow-black/20 sm:rounded-[1.5rem]"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />

                      <div className="relative z-10">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                          <Icon className="h-4 w-4" />
                        </div>

                        <h3 className="text-sm font-black text-slate-950 dark:text-slate-100">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                          {item.text}
                        </p>
                      </div>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.11),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.06),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
    </div>
  );
}