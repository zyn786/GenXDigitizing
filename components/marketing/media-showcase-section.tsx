import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

const SHOWCASE_ITEMS = [
  {
    id: 1,
    type: "image" as const,
    src: "/digitizing/After-1.png",
    label: "Logo Embroidery",
    description: "Crisp satin stitch left chest logo — production-ready in 24 hours.",
    accent: "from-indigo-600/30 to-violet-600/20",
  },
  {
    id: 2,
    type: "image" as const,
    src: "/digitizing/After-2.png",
    label: "3D Puff Cap",
    description: "Structured 3D puff digitizing with precise foam integration for cap fronts.",
    accent: "from-emerald-600/30 to-teal-600/20",
  },
  {
    id: 3,
    type: "image" as const,
    src: "/digitizing/After-3.png",
    label: "Jacket Back",
    description: "Large jacket back design with multi-color fills, satin borders, and fine detail.",
    accent: "from-amber-600/30 to-orange-600/20",
  },
  {
    id: 4,
    type: "image" as const,
    src: "/digitizing/After-4.png",
    label: "Vector Art",
    description: "Clean vector redraw from raster artwork — print-ready for DTF and screen print.",
    accent: "from-blue-600/30 to-cyan-600/20",
  },
  {
    id: 5,
    type: "image" as const,
    src: "/digitizing/After-5.png",
    label: "Custom Patch",
    description: "Embroidered patch with merrowed border — production-approved and client-delivered.",
    accent: "from-rose-600/30 to-pink-600/20",
  },
  {
    id: 6,
    type: "image" as const,
    src: "/digitizing/After-6.png",
    label: "Thread Detail",
    description: "Close-up thread path and stitch density on premium twill fabric substrate.",
    accent: "from-purple-600/30 to-fuchsia-600/20",
  },
];

const MACHINE_FEATURES = [
  {
    icon: "🧵",
    title: "15-Head Machines",
    description: "High-speed commercial embroidery machines running your production 24/7.",
  },
  {
    icon: "🎯",
    title: "Proof-First Workflow",
    description: "Every job gets a production proof before the first stitch is run.",
  },
  {
    icon: "⚡",
    title: "24h Turnaround",
    description: "Same-day and rush options available. Standard delivery within one business day.",
  },
  {
    icon: "🔁",
    title: "Free Revisions",
    description: "Revisions included until you're completely satisfied with the output.",
  },
];

export function MediaShowcaseSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.06),transparent_50%)]" />

      <div className="relative px-4 md:px-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 backdrop-blur">
              <Play className="h-3 w-3" />
              Real work, real machines
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Production You Can <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">See</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/55 leading-7">
              Every file we deliver has run through the same production environment — commercial machines, calibrated thread, and hands-on QA. This is what your artwork looks like stitched out.
            </p>
          </div>

          {/* Image grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE_ITEMS.map((item, i) => (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${item.accent} backdrop-blur transition hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                    {item.label}
                  </div>
                  <p className="mt-1 text-sm text-white/80 leading-5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Machine feature pills */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MACHINE_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:bg-white/[0.07]"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <div className="font-semibold text-white">{f.title}</div>
                <p className="mt-2 text-sm text-white/55 leading-6">{f.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.12] hover:border-white/25"
            >
              View Full Portfolio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
