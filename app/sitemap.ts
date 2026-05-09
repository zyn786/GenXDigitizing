import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { serviceSummaries, nicheSummaries } from "@/lib/marketing-data";
import { getSiteUrl } from "@/lib/site-url";

const BASE_URL = (() => {
  try {
    return getSiteUrl();
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "https://genxdigitizing.com";
  }
})();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/order`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/order-status`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = serviceSummaries.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const nicheRoutes: MetadataRoute.Sitemap = nicheSummaries.map((n) => ({
    url: `${BASE_URL}/niches/${n.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  let portfolioLastMod = now;
  try {
    const latest = await prisma.portfolioItem.findFirst({
      where: { isVisible: true, approvalStatus: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (latest) portfolioLastMod = latest.updatedAt;
  } catch {
    // non-fatal — use current date
  }

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...nicheRoutes,
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: portfolioLastMod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
