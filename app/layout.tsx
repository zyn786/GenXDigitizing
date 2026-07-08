import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import { SITE_STATS } from "@/lib/site-config";
import { Toaster } from "sonner";
import Script from "next/script";
import { LiveOrderProvider } from "@/components/social-proof/LiveOrderProvider";
import { OrganizationSchema, WebSiteSchema } from "@/components/shared/StructuredData";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700"],
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
  title: "genxdigitizing — Premium Embroidery Digitizing from $7",
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
  authors: [{ name: "genxdigitizing" }],
  creator: "genxdigitizing",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.genxdigitizing.com"
  ),
  openGraph: {
    type:        "website",
    locale:      "en_US",
    siteName:    "genxdigitizing",
    title:       "genxdigitizing — Production-Ready Embroidery Files",
    description: `Professional embroidery digitizing from $7. Free revisions. 12-hour delivery. ${SITE_STATS.ordersCompleted.toLocaleString()}+ orders completed.`,
    images: [
      {
        url:    "/images/black_logo.png",
        width:  1200,
        height: 630,
        alt:    "genxdigitizing — Professional Embroidery Digitizing",
      },
    ],
  },
  twitter: {
    card:     "summary_large_image",
    title:    "genxdigitizing — Production-Ready Embroidery Files",
    images:   ["/images/black_logo.png"],
  },
  robots: {
    index:  true,
    follow: true,
  },
  // Per-page canonical set individually. No global default — wrong default
  // tells Google every page is a duplicate of the homepage.
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
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Google Analytics — deferred to idle to keep critical path clear */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GMTE7KLBJH"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GMTE7KLBJH');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <OrganizationSchema />
        <WebSiteSchema />
        {/* Register Service Worker for push notifications */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function(err){
                  console.error('[SW] Registration failed:', err);
                });
              }
            `,
          }}
        />
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999]
            focus:px-4 focus:py-2 focus:bg-[#2563EB] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold
            focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          Skip to content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
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
