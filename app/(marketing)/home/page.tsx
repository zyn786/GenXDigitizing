import type { Metadata } from "next";
import { LandingClient } from "./LandingClient";
import { JsonLd } from "./JsonLd";

export const metadata: Metadata = {
  title: "Commercial Embroidery Digitizing Services | Production-Ready Files | GenX Digitizing",
  description:
    "Commercial embroidery digitizing services with production-ready accuracy. Machine-tested DST, PES, EMB files. 24-hour turnaround. Vector art conversion and bulk patch digitizing. Trusted by 10,000+ brands. Get a free quote.",
  keywords: [
    "commercial embroidery digitizing services",
    "embroidery digitizing",
    "DST file",
    "PES file",
    "vector art conversion company",
    "bulk patch digitizing",
    "custom patches",
    "cap logo digitizing",
    "3D puff digitizing",
    "left chest digitizing",
  ],
  openGraph: {
    title: "Commercial Embroidery Digitizing Services — Production-Ready Files | GenX Digitizing",
    description:
      "Production-ready embroidery files with surgical precision. Machine-tested, 24-hour turnaround, zero thread breaks. Trusted by 10,000+ brands worldwide.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <LandingClient />
    </>
  );
}
