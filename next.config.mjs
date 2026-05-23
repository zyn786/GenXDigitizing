
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http",  hostname: "localhost" },
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
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",        value: "DENY" },
        { key: "X-Content-Type-Options",  value: "nosniff" },
        { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control",  value: "on" },
        { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },

  async redirects() { return []; },
};

export default nextConfig;
