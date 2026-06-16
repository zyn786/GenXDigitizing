import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { FreeDesignsClient } from "./FreeDesignsClient";

export const metadata: Metadata = {
  title: "Free Embroidery Designs — Download Sample Files — genxdigitizing",
  description:
    "Download free embroidery design samples. Preview our digitizing quality before you order. DST, PES, EMB formats available. Compatible with Brother, Tajima, Janome machines.",
  keywords: "free embroidery designs, embroidery download, DST files, PES files, free embroidery samples, digitizing samples",
  openGraph: {
    title: "Free Embroidery Designs — genxdigitizing",
    description: "Download high-quality embroidery sample files and preview our digitizing quality before placing your order.",
    type: "website",
  },
};

export default function FreeDesignsPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Free Designs", url: "/free-designs" }]} />
      <FreeDesignsClient />
    </>
  );
}
