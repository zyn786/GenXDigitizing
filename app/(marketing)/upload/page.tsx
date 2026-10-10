import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { UploadWizard } from "./UploadWizard";

export const metadata: Metadata = {
  alternates: { canonical: "/upload" },
  title: "Upload Design — Free Quote — genxdigitizing",
  description:
    "Upload your design for a free embroidery digitizing quote. Instant pricing, 3–24h turnaround, free revisions. No account required.",
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
      <UploadWizard />
    </>
  );
}
