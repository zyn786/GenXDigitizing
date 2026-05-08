/**
 * Canonical base URL for metadata, sitemaps, emails, and Open Graph.
 *
 * In production, NEXT_PUBLIC_APP_URL must be set.
 * In development, falls back to http://localhost:3000.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Production builds require this environment variable.",
    );
  }

  return "http://localhost:3000";
}
