// @ts-nocheck
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://genxdigitizing.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow:     ["/", "/home", "/pricing", "/services", "/contact"],
        disallow:  ["/admin", "/crm", "/client", "/designer", "/api/", "/debug"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
