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
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  internalLinks: { text: string; href: string }[];
  cta: { text: string; href: string; label: string };
}

// Empty — all blog content managed via admin panel /admin/blog
export const STATIC_POSTS: BlogPost[] = [];

// Server-side fetch from DB
export async function fetchBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/admin/blog${publishedOnly ? "?published=true" : ""}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
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
