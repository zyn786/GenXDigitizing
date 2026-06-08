// @ts-nocheck
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://genxdigitizing.com";
  const now  = new Date();

  return [
    {
      url:             `${base}/`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${base}/home`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${base}/about`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${base}/services`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.95,
    },
    {
      url:             `${base}/portfolio`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.9,
    },
    {
      url:             `${base}/pricing`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.95,
    },
    {
      url:             `${base}/free-designs`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.85,
    },
    {
      url:             `${base}/contact`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/privacy-policy`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.3,
    },
    {
      url:             `${base}/terms-and-conditions`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.3,
    },
    {
      url:             `${base}/refund-policy`,
      lastModified:    now,
      changeFrequency: "yearly",
      priority:        0.3,
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
