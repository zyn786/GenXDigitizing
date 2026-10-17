/**
 * Portal pages that render PDF previews need `blob:` under both frame-src and
 * object-src: blob documents inherit the embedding page's CSP, and Chromium
 * treats the built-in PDF viewer as plugin content. Public pages keep the
 * stricter policy from the catch-all rule.
 */
const PANEL_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; media-src 'self' https:; connect-src 'self' https: wss:; frame-src 'self' blob:; object-src 'self' blob:; base-uri 'self'; form-action 'self';";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  // pdfkit is a Node.js module — tell webpack not to bundle it for edge/browser
  webpack(config, { isServer }) {
    if (isServer) {
      // PDFKit uses file-system streams; allow it on the server
      config.externals = config.externals || [];
      config.externals.push("pdfkit");
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), accelerometer=(), autoplay=*, clipboard-write=(), display-capture=(), gyroscope=(), magnetometer=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; media-src 'self' https:; connect-src 'self' https: wss:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      {
        // Email panel and order pages render PDF previews through blob URLs.
        // (Next.js: when two rules set the same header, the last one wins.)
        source: "/admin/:path*",
        headers: [{ key: "Content-Security-Policy", value: PANEL_CSP }],
      },
      {
        source: "/client/my-orders/:path*",
        headers: [{ key: "Content-Security-Policy", value: PANEL_CSP }],
      },
      {
        source: "/designer/:path*",
        headers: [{ key: "Content-Security-Policy", value: PANEL_CSP }],
      },
    ];
  },

  // NOTE: no `/home` -> `/` redirect here. app/page.tsx redirects anonymous
  // visitors to /home, and middleware rewrites `/` -> `/home` when there is no
  // session cookie. A permanent /home -> / redirect closes that into a loop
  // (ERR_TOO_MANY_REDIRECTS) whenever a stale `sb-*` cookie is present.
  // Canonical URL is declared by metadata in app/(marketing)/home/page.tsx.
};

export default nextConfig;
