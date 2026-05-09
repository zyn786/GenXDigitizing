import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";

const SHOWCASE_ITEMS = [
  {
    id: 1,
    src: "/digitizing/After-1.png",
    label: "Logo Embroidery",
    description: "Crisp satin stitch left chest logo — production-ready in 24 hours.",
    accent: "from-indigo-500/15 via-violet-500/10 to-blue-500/5",
  },
  {
    id: 2,
    src: "/digitizing/After-2.png",
    label: "3D Puff Cap",
    description: "Structured 3D puff digitizing with precise foam integration for cap fronts.",
    accent: "from-emerald-500/15 via-teal-500/10 to-cyan-500/5",
  },
  {
    id: 3,
    src: "/digitizing/After-3.png",
    label: "Jacket Back",
    description: "Large jacket back design with multi-color fills, satin borders, and fine detail.",
    accent: "from-amber-500/15 via-orange-500/10 to-yellow-500/5",
  },
  {
    id: 4,
    src: "/digitizing/After-4.png",
    label: "Vector Art",
    description: "Clean vector redraw from raster artwork — print-ready for DTF and screen print.",
    accent: "from-blue-500/15 via-cyan-500/10 to-indigo-500/5",
  },
  {
    id: 5,
    src: "/digitizing/After-5.png",
    label: "Custom Patch",
    description: "Embroidered patch with merrowed border — approved and client-delivered.",
    accent: "from-rose-500/15 via-pink-500/10 to-violet-500/5",
  },
  {
    id: 6,
    src: "/digitizing/After-6.png",
    label: "Thread Detail",
    description: "Close-up thread path and stitch density on premium twill fabric.",
    accent: "from-purple-500/15 via-fuchsia-500/10 to-indigo-500/5",
  },
];

const MACHINE_FEATURES = [
  {
    title: "Commercial Machine Ready",
    description: "Files are prepared for real embroidery production, not just screen previews.",
  },
  {
    title: "Proof-First Workflow",
    description: "Every job gets a clean visual proof before final delivery.",
  },
  {
    title: "24h Turnaround",
    description: "Standard delivery within one business day, with rush options available.",
  },
  {
    title: "Revisions Included",
    description: "Adjustments are handled clearly until the proof is approved.",
  },
];

export function MediaShowcaseSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white sm:py-12 md:px-8 md:py-16 lg:py-20">
      <MediaShowcaseBackground />

      <div className="page-shell relative z-10">
        <div className="mx-auto mb-8 max-w-4xl text-center md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.24em]">
            <Play className="h-3.5 w-3.5" />
            Real work, real machines
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl md:text-5xl">
            Production you can{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
              clearly see.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7">
            See how artwork turns into clean embroidery, vector-ready designs,
            and production-approved patch work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE_ITEMS.map((item, index) => (
            <ShowcaseCard key={item.id} item={item} index={index} />
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
          {MACHINE_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.5rem] sm:p-5"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

              <div className="relative z-10">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/10 dark:bg-indigo-400/10 dark:text-indigo-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <div className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                  {feature.title}
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href="/portfolio"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-300 dark:text-slate-950 dark:hover:bg-indigo-200"
          >
            View full portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  item,
  index,
}: {
  item: (typeof SHOWCASE_ITEMS)[number];
  index: number;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 p-2 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065] sm:rounded-[1.75rem]">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`}
      />

      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950 sm:rounded-[1.5rem]">
        <Image
          src={item.src}
          alt={item.label}
          fill
          loading={index < 2 ? "eager" : "lazy"}
          priority={index < 2}
          className="object-cover transition-transform duration-500 ease-out md:group-hover:scale-105"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-sm backdrop-blur">
          {item.label}
        </div>
      </div>

      <div className="relative z-10 p-3 pt-4 sm:p-4">
        <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
          {item.label}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-white/55">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function MediaShowcaseBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
    </div>
  );
}