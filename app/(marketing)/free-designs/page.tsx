import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { FreeDesignsClient } from "./FreeDesignsClient";

export const metadata: Metadata = {
  title: "Free Sample Digitizing — Download & Test Our Quality — genxdigitizing",
  description:
    "Download free embroidery digitizing samples. Test our stitch quality on your machine before ordering. DST, PES, EMB formats. Compatible with Brother, Tajima, Janome.",
  keywords: "free sample digitizing, free embroidery designs, embroidery download, DST files, PES files, free embroidery samples, digitizing samples",
  openGraph: {
    title: "Free Sample Digitizing — genxdigitizing",
    description: "Download free digitized sample files and preview our stitch quality before placing your order.",
    type: "website",
  },
};

export default function FreeDesignsPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Free Sample Digitizing", url: "/free-designs" }]} />
      <FreeDesignsClient />
    </>
  );
}
