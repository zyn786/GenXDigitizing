// @ts-nocheck
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.genxdigitizing.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*",
          "/crm/*",
          "/client/*",
          "/designer/*",
          "/api/*",
          "/debug/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
