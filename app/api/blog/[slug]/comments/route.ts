// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

// GET — fetch approved comments for a blog post
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createAdminClient();

  // Resolve slug → post_id
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!post) return NextResponse.json({ comments: [] });

  // Column list is explicit on purpose. This route uses the service-role client,
  // which bypasses RLS, so a `select("*")` here publishes every commenter's
  // email address to anyone who calls the endpoint — no database policy can
  // catch it. Never widen this to * or add author_email.
  const { data, error } = await supabase
    .from("blog_comments")
    .select("id, post_id, author_name, content, created_at")
    .eq("post_id", post.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

// POST — submit a new comment (goes to pending until approved)
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  // Rate limit: 3 comments per IP per 15 minutes
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit("blog-comments", ip, 3)) {
    return NextResponse.json(
      { error: "Too many comments. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await req.json();
  const { author_name, content, author_email } = body || {};

  if (!author_name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_comments")
    .insert({
      post_id: post.id,
      author_name: author_name.trim(),
      author_email: (author_email || "").trim(),
      content: content.trim(),
      is_approved: false,
    })
    // Echo back only what the submitter already typed — not the stored row.
    .select("id, post_id, author_name, content, created_at, is_approved")
    .single();

  if (error) return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  return NextResponse.json(
    { comment: data, message: "Comment submitted for review" },
    { status: 201 }
  );
}
