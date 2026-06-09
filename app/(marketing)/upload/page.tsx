import type { Metadata } from "next";
import { UploadWizard } from "./UploadWizard";

export const metadata: Metadata = {
  title: "Upload Design — Free Quote | genxdigitizing",
  description: "Upload your design for a free embroidery digitizing quote. Instant pricing, 12-hour turnaround, free revisions. No account required.",
};

export default function UploadPage() {
  return <UploadWizard />;
}
