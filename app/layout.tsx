import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { LiveOrderProvider } from "@/components/social-proof/LiveOrderProvider";
import { PageTransition } from "@/components/shared/PageTransition";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
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
    default:  "GenX Digitizing — Premium Embroidery Digitizing from $7",
    template: "%s | GenX Digitizing",
  },
  description:
    "Production-ready embroidery digitizing, vector art conversion, and custom patches from $7. Clean proofs, 12hr turnaround, free unlimited revisions.",
  keywords: [
    "embroidery digitizing",
    "DST files",
    "PES files",
    "EMB files",
    "cap logo digitizing",
    "embroidery file conversion",
    "vector art conversion",
    "custom patches",
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
    title:       "GenX Digitizing — Production-Ready Embroidery Files",
    description: "Professional embroidery digitizing from $7. Free revisions. 12-hour delivery. 1,200+ orders completed.",
  },
  twitter: {
    card:  "summary_large_image",
    title: "GenX Digitizing — Production-Ready Embroidery Files",
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
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
      className={`${syne.variable} ${inter.variable}`}
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
