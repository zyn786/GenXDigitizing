export interface PortfolioImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  blurhash?: string;
  alt?: string;
  width?: number;
  height?: number;
  sortOrder: number;
  isBefore: boolean;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  sortOrder: number;
  count?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  clientName?: string;
  categoryId: string;
  category?: PortfolioCategory;
  stitches?: number;
  colors: number;
  outputFormat: string;
  turnaround: string;
  designSize: string;
  accent: string;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  tags: string[];
  images: PortfolioImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioResponse {
  items: PortfolioItem[];
  categories: PortfolioCategory[];
}

// Generate blur placeholder — use Cloudinary blurhash if available, fallback to inline SVG
export function generateBlurPlaceholder(color: string, blurhash?: string): string {
  if (blurhash) return blurhash;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${encodeURIComponent(color)}" opacity="0.3"/></svg>`;
  if (typeof window !== "undefined") {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Default categories (fallback when DB empty)
export const DEFAULT_CATEGORIES: PortfolioCategory[] = [
  { id: "all",         name: "All Work",              slug: "all",        emoji: "✦",  color: "#2563EB", sortOrder: 0 },
  { id: "digitizing",  name: "Embroidery Digitizing", slug: "digitizing", emoji: "🧵", color: "#2563EB", sortOrder: 1 },
  { id: "vector",      name: "Vector Art",            slug: "vector",     emoji: "✏️", color: "#F97316", sortOrder: 2 },
  { id: "patches",     name: "Patch Design",          slug: "patches",    emoji: "🏷️", color: "#16A34A", sortOrder: 3 },
];

// Sub-categories (tags for admin to assign per project)
export const SUB_CATEGORIES: Record<string, string[]> = {
  digitizing: ["Left Chest", "Cap", "Jacket Back", "Sleeve", "Puff 3D", "Flat", "Applique", "Full Back"],
  vector: ["Logo", "Mascot", "Illustration", "Typography", "Print-Ready"],
  patches: ["Merit Badge", "Tactical", "PVC-Style", "Name Patch", "Club Patch", "Event Patch"],
};

// Default placeholder colors by category
export const CATEGORY_ACCENTS: Record<string, string> = {
  digitizing: "#2563EB",
  vector: "#F97316",
  patches: "#16A34A",
  cap: "#2563EB",
  jacket: "#F97316",
};

// Fetch portfolio data from API
export async function fetchPortfolio(category?: string, featured?: boolean) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (featured) params.set("featured", "true");

  const url = `/api/portfolio${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json() as Promise<PortfolioResponse>;
}

// For server components
export async function fetchPortfolioServer(category?: string, featured?: boolean) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (featured) params.set("featured", "true");

  const url = `${baseUrl}/api/portfolio${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json() as Promise<PortfolioResponse>;
}
