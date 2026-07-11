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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-6">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--txt3)] mb-2">
            Trusted by Embroidery Businesses Worldwide
          </p>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {CLIENTS.map((client) => (
            <div
              key={client.name}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border3)] transition-all duration-200"
            >
              {/* Logo placeholder — replace with <Image> when logos available */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 border border-[#2563EB]/15 flex items-center justify-center">
                <Building2 size={18} className="text-[var(--txt3)]" />
              </div>
              <div className="text-center">
                <p className="text-[11px] sm:text-xs font-semibold text-[var(--txt)] leading-tight">
                  {client.name}
                </p>
                <p className="text-[10px] text-[var(--txt3)] mt-0.5">{client.industry}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
