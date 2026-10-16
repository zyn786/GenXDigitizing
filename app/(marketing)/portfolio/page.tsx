// @ts-nocheck
import { Suspense } from "react";
import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { PortfolioClient } from "./PortfolioClient";
import { SITE_OG_IMAGE } from "@/lib/site-config";

/** Always present, whatever the projects say. */
const BASE_KEYWORDS = [
  "embroidery digitizing portfolio",
  "embroidery digitizing examples",
  "embroidery sew-out samples",
  "real sewout photos",
  "cap digitizing samples",
  "left chest logo digitizing",
  "puff embroidery samples",
  "jacket back digitizing",
  "vector art examples",
  "custom patch samples",
];

/**
 * Per-project keywords, merged behind the page's own.
 *
 * The admin has collected these for a while without anywhere to put them; with
 * migration 066 they store, and this is what makes storing them worth doing —
 * a field that saves but changes nothing is the same bug wearing a hat.
 *
 * Fail-soft and bounded: this runs at build time as well as request time, and
 * `createAdminClient()` throws when its env is absent (CI supplies
 * placeholders). A metadata fetch must never be the reason a page fails to
 * build, so any failure falls back to the static list. Capped at 30 so one
 * over-eager project cannot bloat the tag.
 */
async function projectKeywords(): Promise<string[]> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const { getPublicPortfolio } = await import("@/lib/supabase/portfolio-queries");

    const projects = await getPublicPortfolio(undefined, false, createAdminClient());
    const out: string[] = [];
    for (const project of projects ?? []) {
      for (const keyword of (project as { keywords?: string[] }).keywords ?? []) {
        const k = String(keyword).trim();
        if (k && !out.includes(k)) out.push(k);
        if (out.length >= 30) return out;
      }
    }
    return out;
  } catch {
    // No projects, no database, no env — the page still needs its metadata.
    return [];
  }
}

/**
 * Regenerate periodically so a keyword saved in the admin reaches the page
 * within minutes instead of at the next deployment. Without this the metadata
 * is baked at build time, and the field would look like it was still not
 * saving.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const merged = [...BASE_KEYWORDS, ...(await projectKeywords())];

  return {
    alternates: { canonical: "/portfolio" },
    title: "Portfolio — genxdigitizing Embroidery Work Samples",
    description:
      "Real stitch quality and clean vector artwork. Browse embroidery digitizing, vector art, and custom patch samples — plus real sew-out photos from production runs.",
    keywords: merged,
    openGraph: {
      images: [SITE_OG_IMAGE],
      title: "Our Work — genxdigitizing Portfolio",
      description:
        "See the quality of our embroidery digitizing, vector art, and custom patches — real production files.",
      type: "website",
    },
  };
}

export default function PortfolioPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Portfolio", url: "/portfolio" },
        ]}
      />
      <Suspense fallback={<div className="py-16" />}>
        <PortfolioClient />
      </Suspense>
    </>
  );
}
