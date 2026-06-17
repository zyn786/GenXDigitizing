// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET — list all comments (with post title)
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id");

  let query = supabase
    .from("blog_comments")
    .select("*, blog_posts!inner(title, slug)")
    .order("created_at", { ascending: false });

  if (postId) query = query.eq("post_id", postId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

// PUT — approve / unapprove
export async function PUT(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("blog_comments")
    .update({ is_approved: body.is_approved })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ comment: data });
}

// DELETE — remove comment
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("blog_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
