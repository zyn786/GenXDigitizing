// @ts-nocheck
import { Suspense } from "react";
import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { PortfolioClient } from "./PortfolioClient";
import { SITE_OG_IMAGE } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/portfolio" },
  title: "Portfolio — genxdigitizing Embroidery Work Samples",
  description:
    "Real stitch quality and clean vector artwork. Browse embroidery digitizing, vector art, and custom patch samples from our production workflow.",
  keywords: [
    "embroidery digitizing portfolio",
    "embroidery digitizing examples",
    "cap digitizing samples",
    "left chest logo digitizing",
    "puff embroidery samples",
    "jacket back digitizing",
    "vector art examples",
    "custom patch samples",
  ],
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: "Our Work — genxdigitizing Portfolio",
    description:
      "See the quality of our embroidery digitizing, vector art, and custom patches — real production files.",
    type: "website",
  },
};

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
