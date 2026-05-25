import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { LiveOrderProvider } from "@/components/social-proof/LiveOrderProvider";
import { PageTransition } from "@/components/shared/PageTransition";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:  "Commercial Embroidery Digitizing Services | Production-Ready Files | GenX Digitizing",
    template: "%s | GenX Digitizing",
  },
  description:
    "Commercial embroidery digitizing services with production-ready accuracy. Machine-tested DST, PES, EMB files. 24-hour turnaround. Vector art conversion and bulk patch digitizing. Trusted by 10,000+ brands.",
  keywords: [
    "commercial embroidery digitizing services",
    "embroidery digitizing",
    "DST files",
    "PES files",
    "vector art conversion company",
    "bulk patch digitizing",
    "custom patches",
    "cap logo digitizing",
  ],
  authors: [{ name: "GenX Digitizing" }],
  creator: "GenX Digitizing",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.genxdigitizing.com"
  ),
  openGraph: {
    type:        "website",
    locale:      "en_US",
    siteName:    "GenX Digitizing",
    title:       "Commercial Embroidery Digitizing Services — Production-Ready Files | GenX Digitizing",
    description: "Production-ready embroidery files with surgical precision. Machine-tested, 24-hour turnaround, zero thread breaks guarantee. Trusted by 10,000+ brands.",
  },
  twitter: {
    card:  "summary_large_image",
    title: "Commercial Embroidery Digitizing Services | GenX Digitizing",
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1E40AF",
  width:      "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <PageTransition />
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize:   "13px",
            },
          }}
        />
        <LiveOrderProvider />
      </body>
    </html>
  );
}
