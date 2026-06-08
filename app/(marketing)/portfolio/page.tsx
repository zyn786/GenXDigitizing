// @ts-nocheck
import type { Metadata } from "next";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { PortfolioClient } from "./PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio — GenX Digitizing Embroidery Work Samples",
  description:
    "Real stitch quality and clean vector artwork. Browse embroidery digitizing, vector art, and custom patch samples from our production workflow.",
  keywords: [
    "embroidery digitizing portfolio","embroidery digitizing examples",
    "cap digitizing samples","left chest logo digitizing",
    "puff embroidery samples","jacket back digitizing","vector art examples","custom patch samples",
  ],
  openGraph: {
    title: "Our Work — GenX Digitizing Portfolio",
    description: `${fmtPlus(SITE_STATS.ordersCompleted)} orders completed. See the quality of our embroidery digitizing, vector art, and custom patches.`,
    type: "website",
  },
};

export default function PortfolioPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Portfolio", url: "/portfolio" }]} />
      <PortfolioClient />
    </>
  );
}
