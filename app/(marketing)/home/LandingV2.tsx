"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Clock3, MessageCircle, Upload } from "lucide-react";

const WORK = [
  {
    label: "Cap embroidery",
    image:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_900/v1779204050/cap-embroidery_sjxoep.webp",
  },
  {
    label: "Jacket back",
    image:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_900/v1779207170/jacket-embroidery_ycfnqh.webp",
  },
  {
    label: "Left chest",
    image:
      "https://res.cloudinary.com/djoixgojj/image/upload/f_auto,q_auto,w_900/v1779204050/shirt-embroidery_bisqry.webp",
  },
];

const STEPS = [
  ["01", "Upload your design", "Send your artwork, size and placement. No account required to ask for a quote."],
  ["02", "We review it", "Our team checks the design and confirms the service, price and turnaround."],
  ["03", "We digitize", "Your file is manually prepared for embroidery and sent for review."],
  ["04", "You approve", "Request changes if needed, then receive your production-ready files."],
];

export function LandingV2({
  services,
}: {
  services: Array<{
    title: string;
    desc: string;
    tiers: Array<{ size: string; price: string }>;
  }>;
}) {
  const digitizing = services.find((s) => s.title.toLowerCase().includes("embroidery"));
  const vector = services.find((s) => s.title.toLowerCase().includes("vector"));
  const patches = services.find((s) => s.title.toLowerCase().includes("patch"));

  return (
    <main className="bg-[var(--bg)] text-[var(--txt)]">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Production-ready embroidery files
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Send your design.
              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500 bg-clip-text text-transparent">
                We make it stitch-ready.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--txt2)] sm:text-lg">
              Professional embroidery digitizing, vector artwork and custom patches. Simple ordering,
              clear pricing and free revisions.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/upload"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--txt)] px-6 text-sm font-bold text-[var(--bg)] no-underline transition-transform hover:-translate-y-0.5"
              >
                <Upload size={17} />
                Upload Design — Free
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://wa.me/18302102135?text=Hi%20GenX%2C%20I%27d%20like%20a%20quote%20for%20a%20design."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-6 text-sm font-bold text-[var(--txt)] no-underline"
              >
                <MessageCircle size={17} />
                WhatsApp
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[var(--txt2)]">
              <span className="inline-flex items-center gap-1.5"><Check size={14} /> No subscription</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} /> Free revisions</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} /> Major machine formats</span>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl">
            <div className="overflow-hidden rounded-2xl bg-black">
              <Image
                src={WORK[0].image}
                alt="Cap embroidery example"
                width={900}
                height={675}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 p-2">
              {WORK.map((item) => (
                <div key={item.label} className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <Image src={item.image} alt={item.label} width={300} height={225} className="aspect-[4/3] object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-7 sm:grid-cols-3 sm:px-8 lg:px-10">
          {[
            ["From $7", "Standard embroidery designs"],
            ["12–24h", "Standard turnaround"],
            ["Free", "Revisions and format conversion"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-2xl font-black">{value}</p>
              <p className="mt-1 text-sm text-[var(--txt2)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Services</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Everything you need to get artwork into production.</h2>
          <p className="mt-3 text-[var(--txt2)]">Start with the design. We will help with the production details.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Embroidery Digitizing", digitizing?.desc || "Production-ready embroidery files for caps, shirts, jackets and more.", "/services/embroidery-digitizing"],
            ["Vector Artwork", vector?.desc || "Clean AI, EPS and SVG artwork for print and production.", "/services/vector-art-conversion"],
            ["Custom Patches", patches?.desc || "Artwork and production-ready files for embroidered, woven and PVC patches.", "/services/custom-patches"],
          ].map(([title, desc, href]) => (
            <Link key={title} href={href} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 no-underline transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-[var(--txt)]">{title}</h3>
                <ArrowRight size={18} className="text-[var(--txt3)] transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--txt2)]">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">How it works</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Four simple steps.</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {STEPS.map(([number, title, desc]) => (
              <div key={number} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <span className="text-xs font-black text-blue-600">{number}</span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--txt2)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Pricing</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Clear starting prices.</h2>
            <p className="mt-3 text-sm text-[var(--txt2)]">Final price is confirmed after we review the design.</p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 no-underline">
            Get my quote <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {[
            ["Embroidery", digitizing?.tiers || []],
            ["Vector", vector?.tiers || []],
            ["Patch / Sewout", patches?.tiers || []],
          ].map(([name, rows]: any) => (
            <div key={name} className="border-b border-[var(--border)] p-5 last:border-b-0 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold">{name}</h3>
                <Clock3 size={17} className="text-[var(--txt3)]" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {rows.length ? rows.map((row: any) => (
                  <div key={row.size} className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-4 py-3 text-sm">
                    <span className="text-[var(--txt2)]">{row.size}</span>
                    <span className="font-black">{row.price}</span>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--txt2)]">Quote after design review.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--txt)] text-[var(--bg)]">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Have a design ready?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 opacity-70">Upload it and let us review the artwork. No complicated setup.</p>
          </div>
          <Link href="/upload" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--bg)] px-6 text-sm font-black text-[var(--txt)] no-underline">
            Upload Design — Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
