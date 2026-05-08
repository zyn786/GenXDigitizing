import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const staticRoutes = [
    { url: "/", changeFrequency: "weekly" as const, priority: 1.0 },
    { url: "/services", changeFrequency: "weekly" as const, priority: 0.9 },
    { url: "/portfolio", changeFrequency: "weekly" as const, priority: 0.9 },
    { url: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
    { url: "/quote", changeFrequency: "weekly" as const, priority: 0.7 },
    { url: "/order", changeFrequency: "weekly" as const, priority: 0.7 },
    { url: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
    { url: "/order-status", changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.2 },
    { url: "/terms-and-conditions", changeFrequency: "yearly" as const, priority: 0.2 },
    { url: "/refund-policy", changeFrequency: "yearly" as const, priority: 0.2 },
  ];

  const serviceSlugs = [
    "embroidery-digitizing",
    "vector-art",
    "custom-patches",
  ];

  const nicheSlugs = [
    "left-chest-logo",
    "cap-hat-logo",
    "3d-puff",
    "jacket-back",
    "full-back",
    "jpg-to-vector",
    "print-ready-artwork",
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r.url}`,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...serviceSlugs.map((slug) => ({
      url: `${base}/services/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...nicheSlugs.map((slug) => ({
      url: `${base}/niches/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
