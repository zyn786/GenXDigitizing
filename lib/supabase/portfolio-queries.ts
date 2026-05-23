// @ts-nocheck
import { createClient } from "./server";
import { createAdminClient } from "./server";

// ── Helpers ─────────────────────────────────────────────────
function normalizeImages(images: any[]) {
  if (!images) return [];
  return images
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((img: any) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnail_url,
      blurhash: img.blurhash,
      alt: img.alt,
      width: img.width,
      height: img.height,
      sortOrder: img.sort_order,
      isBefore: img.is_before,
      isThumbnail: img.sort_order === -1,
    }));
}

function normalizeItem(item: any) {
  if (!item) return item;
  const cat = item.categories ? {
    id: item.categories.id,
    name: item.categories.name,
    slug: item.categories.slug,
    emoji: item.categories.emoji,
    color: item.categories.color,
    sortOrder: item.categories.sort_order,
  } : null;

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    clientName: item.client_name,
    categoryId: item.category_id,
    category: cat,
    stitches: item.stitches,
    colors: item.colors,
    outputFormat: item.output_format,
    turnaround: item.turnaround,
    designSize: item.design_size,
    accent: item.accent,
    featured: item.featured,
    visible: item.visible,
    sortOrder: item.sort_order,
    tags: item.tags || [],
    images: item.portfolio_images ? normalizeImages(item.portfolio_images) : [],
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

// ── Public: Get visible portfolios ──────────────────────────
export async function getPublicPortfolio(categorySlug?: string, featuredOnly = false) {
  const supabase = createClient();

  let query = supabase
    .from("portfolios")
    .select("*, categories(*), portfolio_images(*)")
    .eq("visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (featuredOnly) query = query.eq("featured", true);

  const { data: items, error } = await query;
  if (error) throw error;

  let filtered = (items ?? []).map(normalizeItem);
  if (categorySlug && categorySlug !== "all") {
    filtered = filtered.filter((item: any) => item.category?.slug === categorySlug);
  }

  return filtered;
}

// ── Public: Get categories with counts ──────────────────────
export async function getCategoriesWithCounts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const { data: counts } = await supabase
    .from("portfolios")
    .select("category_id")
    .eq("visible", true);

  const countMap: Record<string, number> = {};
  for (const p of counts ?? []) {
    countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  }

  return (data ?? []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    emoji: cat.emoji,
    color: cat.color,
    sortOrder: cat.sort_order,
    count: countMap[cat.id] || 0,
  }));
}

// ── Admin: Get all portfolios (service role — bypasses RLS) ─
export async function getAdminPortfolios() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*, categories(*), portfolio_images(*)")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(normalizeItem);
}

// ── Admin: Create portfolio ─────────────────────────────────
export async function createPortfolio(data: any, images?: any[]) {
  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from("portfolios")
    .insert(data)
    .select("*, categories(*), portfolio_images(*)")
    .single();

  if (error) throw error;

  if (images?.length && item) {
    const imageRows = images.map((img: any, idx: number) => ({
      portfolio_id: item.id,
      url: img.url,
      thumbnail_url: img.thumbnailUrl || null,
      blurhash: img.blurhash || null,
      alt: img.alt || null,
      width: img.width || null,
      height: img.height || null,
      sort_order: img.isThumbnail ? -1 : idx,
      is_before: img.isBefore || false,
    }));

    const { data: insertedImages } = await supabase
      .from("portfolio_images")
      .insert(imageRows)
      .select("*");

    item.portfolio_images = insertedImages ?? [];
  }

  return normalizeItem(item);
}

// ── Admin: Update portfolio ─────────────────────────────────
export async function updatePortfolio(id: string, data: any, images?: any[]) {
  const supabase = createAdminClient();

  if (Object.keys(data).length > 0) {
    const { error } = await supabase
      .from("portfolios")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  }

  if (images !== undefined) {
    await supabase.from("portfolio_images").delete().eq("portfolio_id", id);

    if (images.length > 0) {
      const imageRows = images.map((img: any, idx: number) => ({
        portfolio_id: id,
        url: img.url,
        thumbnail_url: img.thumbnailUrl || null,
        blurhash: img.blurhash || null,
        alt: img.alt || null,
        width: img.width || null,
        height: img.height || null,
        sort_order: img.isThumbnail ? -1 : idx,
        is_before: img.isBefore || false,
      }));

      await supabase.from("portfolio_images").insert(imageRows);
    }
  }

  const { data: item, error: fetchErr } = await supabase
    .from("portfolios")
    .select("*, categories(*), portfolio_images(*)")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  return normalizeItem(item);
}

// ── Admin: Delete portfolio ─────────────────────────────────
export async function deletePortfolio(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("portfolios").delete().eq("id", id);
  if (error) throw error;
}

// ── Admin: Reorder portfolios ───────────────────────────────
export async function reorderPortfolios(orderedIds: string[]) {
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("portfolios").update({ sort_order: idx }).eq("id", id)
    )
  );
}

// ── Admin: Categories CRUD ──────────────────────────────────
export async function getAdminCategories() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    emoji: cat.emoji,
    color: cat.color,
    sortOrder: cat.sort_order,
  }));
}

export async function createCategory(data: any) {
  const supabase = createAdminClient();
  const { data: cat, error } = await supabase
    .from("categories")
    .insert(data)
    .select("*")
    .single();
  if (error) throw error;
  return cat;
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCategory(id: string, data: any) {
  const supabase = createAdminClient();
  const { data: cat, error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return cat;
}
