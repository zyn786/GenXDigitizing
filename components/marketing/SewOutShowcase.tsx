"use client";

import { motion } from "framer-motion";
import { ArrowRight, Ruler, Shirt, Scissors } from "lucide-react";
import Link from "next/link";

/* ═════════════════════════════════════════════════════════════
   SEW-OUT DATA
   ═════════════════════════════════════════════════════════════ */
const SHOWCASE = [
  {
    id: "cap-logo",
    title: "Structured Cap — Left Chest Logo",
    client: "US Streetwear Brand",
    source: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp",
      label: "Client Artwork — Low-res JPG, 72dpi",
    },
    output: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
      label: "Production Sew-Out — Cotton Twill Cap",
    },
    meta: {
      stitches: "6,400",
      thread: "Madeira Poly Neon",
      stabilizer: "2.5oz Tear-Away",
      turnaround: "12h Standard",
    },
  },
  {
    id: "jacket-back",
    title: "Full Jacket Back — Satin Stitch Lettering",
    client: "UK Apparel Manufacturer",
    source: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp",
      label: "Client Artwork — Scanned sketch, 150dpi",
    },
    output: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
      label: "Production Sew-Out — Nylon Satin Jacket",
    },
    meta: {
      stitches: "34,400",
      thread: "Madeira Classic Rayon",
      stabilizer: "3.0oz Cut-Away",
      turnaround: "12h Standard",
    },
  },
  {
    id: "puff-cap",
    title: "3D Puff — Raised Foam Embroidery",
    client: "Australian Headwear Brand",
    source: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp",
      label: "Client Artwork — Vector AI file, clean source",
    },
    output: {
      url: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
      label: "Production Sew-Out — Structured Cotton Cap",
    },
    meta: {
      stitches: "8,200",
      thread: "Gunold Poly 40wt",
      stabilizer: "2.0oz Tear-Away + Topping",
      turnaround: "Rush 6h",
    },
  },
];

/* ═════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function SewOutShowcase() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/8 text-[#2563EB] border border-[#2563EB]/15 mb-4">
            Real-World Sew-Out Showcase
          </span>
          <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3 tracking-tight">
            Source artwork.
            <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
              Production sew-out. No surprises.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--txt2)] max-w-[640px] mx-auto">
            Every file is tested on commercial embroidery machines before delivery. See the results from real client production runs.
          </p>
        </div>

        {/* Masonry grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {SHOWCASE.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
            >
              {/* Header */}
              <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-jakarta font-bold text-base sm:text-lg">{item.title}</h3>
                </div>
                <p className="text-xs text-[var(--txt3)]">{item.client}</p>
              </div>

              {/* Before / After comparison */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 px-5 sm:px-7">
                {/* Source */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--txt3)]">Source</span>
                  </div>
                  <div className="aspect-[3/2] rounded-xl bg-[var(--elevated)] border border-[var(--border)] overflow-hidden">
                    <img
                      src={item.source.url}
                      alt={item.source.label}
                      loading="lazy"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--txt3)] mt-1.5 text-center leading-relaxed">
                    {item.source.label}
                  </p>
                </div>

                {/* Output */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#10B981]">Sew-Out</span>
                  </div>
                  <div className="aspect-[3/2] rounded-xl bg-[#ECFDF5] border border-[#10B981]/20 overflow-hidden">
                    <img
                      src={item.output.url}
                      alt={item.output.label}
                      loading="lazy"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--txt3)] mt-1.5 text-center leading-relaxed">
                    {item.output.label}
                  </p>
                </div>
              </div>

              {/* Production metadata */}
              <div className="px-5 sm:px-7 py-4 mt-3 bg-[var(--elevated)]/50 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Scissors size={13} className="text-[var(--txt3)] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider">Stitches</div>
                      <div className="text-xs font-mono font-semibold text-[var(--txt)]">{item.meta.stitches}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler size={13} className="text-[var(--txt3)] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider">Thread</div>
                      <div className="text-xs font-semibold text-[var(--txt)] truncate max-w-[100px]">{item.meta.thread}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shirt size={13} className="text-[var(--txt3)] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider">Stabilizer</div>
                      <div className="text-xs font-semibold text-[var(--txt)] truncate max-w-[100px]">{item.meta.stabilizer}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider">Delivery</div>
                      <div className="text-xs font-semibold text-[var(--txt)]">{item.meta.turnaround}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
              bg-[#2563EB] text-white hover:bg-[#1D4ED8]
              active:scale-[0.98] transition-all duration-200 no-underline"
          >
            View Full Sew-Out Portfolio
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
