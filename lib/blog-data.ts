export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  description: string;
  date?: string;
  category: string;
  readTime?: string;
  keywords: string[];
  hero: { emoji: string; color: string; image?: string };
  sections: { heading: string; body: string; image?: string; images?: string[]; layout?: string }[];
  faqs: { q: string; a: string }[];
  internalLinks: { text: string; href: string }[];
  cta: { text: string; href: string; label: string };
}

// Empty — all blog content managed via admin panel /admin/blog
export const STATIC_POSTS: BlogPost[] = [];

function calcReadTime(p: any): string {
  const sections = p.content?.sections || [];
  const bodyText = sections.map((s: any) => (s.body || "") + (s.heading || "")).join(" ");
  const words = bodyText.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function mapPost(p: any): BlogPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.created_at?.split("T")[0],
    category: p.category,
    readTime: calcReadTime(p),
    keywords: p.keywords || [],
    hero: { emoji: p.emoji || "📝", color: p.accent_color || "#2563EB", image: p.hero_image || undefined },
    sections: p.content?.sections || [],
    faqs: p.content?.faqs || [],
    internalLinks: p.content?.internalLinks || [],
    cta: p.content?.cta || { text: "Get a Free Quote", href: "/contact", label: "Upload Design" },
  };
}

// Server-side — direct DB query (no HTTP round-trip, no middleware auth block)
export async function fetchBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();
    let query = supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (publishedOnly) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapPost);
  } catch {}
  return [];
}

// Client-side fetch
export async function fetchBlogPostsClient(publishedOnly = true): Promise<BlogPost[]> {
  try {
    const params = publishedOnly ? "?published=true" : "";
    const res = await fetch(`/api/admin/blog${params}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    if (data.posts && data.posts.length > 0) {
      return data.posts.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        date: p.created_at?.split("T")[0],
        category: p.category,
        readTime: "6 min read",
        keywords: p.keywords || [],
        hero: { emoji: p.emoji || "📝", color: p.accent_color || "#2563EB", image: p.hero_image || undefined },
        sections: p.content?.sections || [],
        faqs: p.content?.faqs || [],
        internalLinks: p.content?.internalLinks || [],
        cta: p.content?.cta || { text: "Get a Free Quote", href: "/contact", label: "Upload Design" },
      }));
    }
  } catch {}
  return [];
}

// For client components that import BLOG_POSTS directly
export const BLOG_POSTS: BlogPost[] = [];
