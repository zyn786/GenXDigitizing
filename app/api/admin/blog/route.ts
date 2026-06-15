// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET — list all posts (including unpublished for admin)
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const publishedOnly = searchParams.get("published") === "true";

  let query = supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);

  const { data, error } = await query;
  if (error) { console.error("[admin/blog] error:", error); return NextResponse.json({ error: "Request failed" }, { status: 500 }); }
  return NextResponse.json({ posts: data || [] });
}

// POST — create new post
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug: body.slug,
      title: body.title,
      description: body.description || "",
      content: body.content || {},
      category: body.category || "General",
      keywords: body.keywords || [],
      emoji: body.emoji || "📝",
      accent_color: body.accentColor || "#2563EB",
      hero_image: body.heroImage || null,
      published: body.published ?? false,
    })
    .select()
    .single();

  if (error) { console.error("[admin/blog] error:", error); return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  return NextResponse.json({ post: data }, { status: 201 });
}

// PUT — update existing post
export async function PUT(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.accentColor !== undefined && { accent_color: body.accentColor }),
      ...(body.heroImage !== undefined && { hero_image: body.heroImage }),
      ...(body.published !== undefined && { published: body.published }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) { console.error("[admin/blog] error:", error); return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  return NextResponse.json({ post: data });
}

// DELETE — remove post
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) { console.error("[admin/blog] error:", error); return NextResponse.json({ error: "Request failed" }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
