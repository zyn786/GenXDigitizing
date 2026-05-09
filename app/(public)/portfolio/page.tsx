import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { PortfolioCtaStrip } from "@/components/marketing/portfolio-cta-strip";
import { PortfolioHeroSection } from "@/components/marketing/portfolio-hero-section";
import { PortfolioClient } from "./portfolio-client";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse before and after examples of our embroidery digitizing, vector art, and custom patch work.",
};

export default async function PortfolioPage() {
  const dbItems = await prisma.portfolioItem.findMany({
    where: {
      isVisible: true,
      approvalStatus: "APPROVED",
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
    take: 60,
    select: {
      id: true,
      title: true,
      serviceKey: true,
      nicheSlug: true,
      description: true,
      tags: true,
      isFeatured: true,
      beforeImageKey: true,
      afterImageKey: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-950 dark:bg-[#050814] dark:text-white">
      <PortfolioHeroSection />

      <PortfolioClient items={dbItems} />

      <PortfolioCtaStrip />
    </main>
  );
}