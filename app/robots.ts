import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/client/",
          "/portal/",
          "/designer/",
          "/manager/",
          "/marketing/",
          "/chat-support/",
          "/api/",
          "/checkout/",
          "/invoices/",
          "/files/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
