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
      url:             `${base}/services/embroidery-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/cap-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/3d-puff-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/services/logo-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/vector-art-conversion`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/custom-patches`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/jacket-back-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/services/left-chest-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/beanies-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/services/towels-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/services/bags-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/services/uniforms-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/sportswear-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
    },
    {
      url:             `${base}/services/corporate-apparel-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.85,
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
      url:             `${base}/blog`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.9,
    },
    {
      url:             `${base}/blog/what-is-embroidery-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/blog/manual-vs-auto-digitizing`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/blog/embroidery-file-formats-explained`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/blog/how-to-convert-jpg-to-vector`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${base}/free-designs`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.85,
    },
    {
      url:             `${base}/upload`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
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
