import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import UploadPageClient from "./UploadPageClient";

export const metadata: Metadata = {
  title: "Upload Your Design — GenX Digitizing",
  description:
    "Upload your artwork for a GenX Digitizing quote. No account required. We review the design before confirming price and turnaround.",
};

export default function UploadPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Upload Design", url: "/upload" },
        ]}
      />
      <UploadPageClient />
    </>
  );
}
