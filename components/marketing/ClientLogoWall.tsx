"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";

// Replace placeholders with real logo images when available
const CLIENTS = [
  { name: "ProStitch Apparel", industry: "Promotional Products" },
  { name: "Victory Sportswear", industry: "Team Uniforms" },
  { name: "Branded Threads Co.", industry: "Corporate Apparel" },
  { name: "The Embroidery House", industry: "Custom Embroidery" },
  { name: "ThreadWorks Studio", industry: "Fashion & Apparel" },
  { name: "Monogram Collective", industry: "Personalization" },
  { name: "StitchCraft Pro", industry: "Commercial Embroidery" },
  { name: "Urban Logowear", industry: "Streetwear Branding" },
];

export function ClientLogoWall() {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-12">
        <div className="mb-6 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--txt3)] sm:text-xs">
            Trusted by Embroidery Businesses Worldwide
          </p>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {CLIENTS.map((client) => (
            <div
              key={client.name}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--border3)]"
            >
              {/* Logo placeholder — replace with <Image> when logos available */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2563EB]/15 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10">
                <Building2 size={18} className="text-[var(--txt3)]" />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold leading-tight text-[var(--txt)] sm:text-xs">
                  {client.name}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--txt3)]">{client.industry}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
