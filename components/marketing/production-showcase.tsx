import { prisma } from "@/lib/db";
import { ProductionShowcaseClient } from "./production-showcase-client";

export async function ProductionShowcaseSection() {
  const items = await prisma.portfolioItem.findMany({
    where: {
      isVisible: true,
      approvalStatus: "APPROVED",
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
    take: 12,
    select: {
      id: true,
      title: true,
      serviceKey: true,
      nicheSlug: true,
      description: true,
      tags: true,
      afterImageKey: true,
      beforeImageKey: true,
      isFeatured: true,
    },
  });

  return <ProductionShowcaseClient items={items} />;
}