import { SITE_INFO, SITE_CLAIMS, TURNAROUND_RANGE_LABEL } from "@/lib/site-config";

/**
 * The description used across structured data.
 *
 * Built from the claim constants rather than typed out, because this exact
 * sentence lived here twice and kept saying "12-hour turnaround" for a day
 * after the site had moved to the published range. JSON-LD is the copy Google
 * reads, so it drifting from the page is the version that matters.
 */
const SITE_DESCRIPTION =
  `Production-ready embroidery digitizing, vector art, and custom patches. ` +
  `From ${SITE_CLAIMS.price.value}, ${TURNAROUND_RANGE_LABEL} turnaround, unlimited free revisions, ` +
  `every major machine format.`;

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
    ...(SITE_INFO.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: SITE_INFO.address.street,
            addressLocality: SITE_INFO.address.city,
            addressRegion: SITE_INFO.address.region,
            postalCode: SITE_INFO.address.postalCode,
            addressCountry: SITE_INFO.address.country,
          },
        }
      : {}),
    foundingDate: String(SITE_INFO.founded),
    // No aggregateRating here. It previously carried a fabricated 4.9/5 from
    // 500 invented reviews, which is deceptive advertising and a Google
    // structured-data violation that risks a manual action. Only add
    // aggregateRating when the `reviews` table actually has published rows.
    priceRange: "$5-$30",
    description: SITE_DESCRIPTION,
    ...(SITE_INFO.social
      ? {
          sameAs: Object.values(SITE_INFO.social),
        }
      : {}),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** Service schema — include on /services and individual service pages */
/**
 * `price` must be the same value the page renders (`data.startingPrice` in
 * ServicePageTemplate) — it is the ONLY thing this offer should ever quote.
 *
 * It was hardcoded to 7.00 with the description "Starting from $7" while four
 * pages advertised something else: custom-patches $5, vector-art-conversion $8,
 * applique $8, jacket-back $18. Google reads the structured data, not the page,
 * so those four pages were publishing a price they do not charge. Passing the
 * rendered value through makes the two incapable of disagreeing.
 */
export function ServiceSchema({
  name,
  description,
  url,
  price = 7,
}: {
  name: string;
  description: string;
  url?: string;
  /** Starting price in USD, matching the figure shown on the page. */
  price?: number;
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
      price: price.toFixed(2),
      priceCurrency: "USD",
      description: `Starting from $${price}`,
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** WebSite schema — include on root layout for Google Sitelinks Searchbox */
export function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_INFO.name,
    url: BASE_URL,
    // No aggregateRating here. It previously carried a fabricated 4.9/5 from
    // 500 invented reviews, which is deceptive advertising and a Google
    // structured-data violation that risks a manual action. Only add
    // aggregateRating when the `reviews` table actually has published rows.
    priceRange: "$5-$30",
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/blog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** BreadcrumbList schema — include on every page */
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
