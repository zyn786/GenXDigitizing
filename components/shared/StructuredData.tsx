import { SITE_INFO, SITE_STATS } from "@/lib/site-config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.genxdigitizing.com";

/** Organization schema — include on every page via layout */
export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_INFO.name,
    url: BASE_URL,
    logo: `${BASE_URL}/images/black_logo.png`,
    image: `${BASE_URL}/images/black_logo.png`,
    email: SITE_INFO.email,
    ...(SITE_INFO.phone ? { telephone: SITE_INFO.phone } : {}),
    ...(SITE_INFO.address ? {
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE_INFO.address.street,
        addressLocality: SITE_INFO.address.city,
        addressRegion: SITE_INFO.address.region,
        postalCode: SITE_INFO.address.postalCode,
        addressCountry: SITE_INFO.address.country,
      },
    } : {}),
    foundingDate: String(SITE_INFO.founded),
    description: `Production-ready embroidery digitizing, vector art, and custom patches. ${SITE_STATS.ordersCompleted.toLocaleString()}+ orders completed. Free revisions. Fast turnaround.`,
    ...(SITE_INFO.social ? {
      sameAs: Object.values(SITE_INFO.social),
    } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** FAQPage schema — include on pages with FAQ accordions */
export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Service schema — include on /services and individual service pages */
export function ServiceSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: SITE_INFO.name,
      url: BASE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "Worldwide",
    },
    ...(url && { url: `${BASE_URL}${url}` }),
    offers: {
      "@type": "Offer",
      price: "7.00",
      priceCurrency: "USD",
      description: "Starting from $7",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** VideoObject schema — for pages with a hero/promo video */
export function VideoObjectSchema({
  name,
  description,
  contentUrl,
  thumbnailUrl,
  uploadDate,
  duration,
}: {
  name: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    contentUrl,
    uploadDate,
    ...(duration ? { duration } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** WebSite schema — include on root layout for Google Sitelinks Searchbox */
export function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_INFO.name,
    url: BASE_URL,
    description: `Production-ready embroidery digitizing, vector art, and custom patches. ${SITE_STATS.ordersCompleted.toLocaleString()}+ orders completed. Free revisions. Fast turnaround.`,
    potentialAction: {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** BreadcrumbList schema — include on every page */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
