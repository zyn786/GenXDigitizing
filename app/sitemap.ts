// @ts-nocheck
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://genxdigitizing.com";
  const now  = new Date();

  return [
    {
      url:             `${base}/`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        1.0,
    },
    {
      url:             `${base}/home`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        1.0,
    },
    {
      url:             `${base}/portfolio`,
      lastModified:    now,
      changeFrequency: "weekly" as const,
      priority:        0.85,
    },
    {
      url:             `${base}/pricing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${base}/services`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${base}/contact`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.7,
    },
    {
      url:             `${base}/login`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.5,
    },
    {
      url:             `${base}/register`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.6,
    },
  ];
}
