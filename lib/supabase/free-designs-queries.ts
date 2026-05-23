// @ts-nocheck
import { createAdminClient } from "./server";

function normalizeImages(images: any[]) {
  if (!images) return [];
  return images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnail_url,
      blurhash: img.blurhash,
      alt: img.alt,
      width: img.width,
      height: img.height,
      sortOrder: img.sort_order,
    }));
}

function normalizeDesign(item: any) {
  if (!item) return item;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    stitchCount: item.stitch_count,
    colors: item.colors,
    designSize: item.design_size,
    formats: item.formats || [],
    machines: item.machines || [],
    downloadUrl: item.download_url,
    downloadCount: item.download_count,
    featured: item.featured,
    visible: item.visible,
    sortOrder: item.sort_order,
    images: item.free_design_images ? normalizeImages(item.free_design_images) : [],
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

// ── Public: Get visible free designs ──────────────────────────
export async function getPublicFreeDesigns(featuredOnly = false) {
  const admin = createAdminClient();
  let query = admin
    .from("free_designs")
    .select("*, free_design_images(*)")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (featuredOnly) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(normalizeDesign);
}

// ── Admin: Get all free designs ───────────────────────────────
export async function getAllFreeDesigns() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("free_designs")
    .select("*, free_design_images(*)")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeDesign);
}

// ── Admin: Get single free design ─────────────────────────────
export async function getFreeDesignById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("free_designs")
    .select("*, free_design_images(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return normalizeDesign(data);
}

// ── Admin: Create free design ─────────────────────────────────
export async function createFreeDesign(payload: {
  title: string;
  slug: string;
  description?: string;
  stitchCount: number;
  colors: number;
  designSize: string;
  formats: string[];
  machines: string[];
  downloadUrl?: string;
  featured?: boolean;
  visible?: boolean;
  sortOrder?: number;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("free_designs")
    .insert({
      title: payload.title,
      slug: payload.slug,
      description: payload.description || "",
      stitch_count: payload.stitchCount,
      colors: payload.colors,
      design_size: payload.designSize,
      formats: payload.formats,
      machines: payload.machines,
      download_url: payload.downloadUrl || null,
      featured: payload.featured ?? false,
      visible: payload.visible ?? true,
      sort_order: payload.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return normalizeDesign(data);
}

// ── Admin: Update free design ─────────────────────────────────
export async function updateFreeDesign(
  id: string,
  payload: Partial<{
    title: string;
    slug: string;
    description: string;
    stitchCount: number;
    colors: number;
    designSize: string;
    formats: string[];
    machines: string[];
    downloadUrl: string;
    featured: boolean;
    visible: boolean;
    sortOrder: number;
  }>
) {
  const admin = createAdminClient();
  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.slug !== undefined) updateData.slug = payload.slug;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.stitchCount !== undefined) updateData.stitch_count = payload.stitchCount;
  if (payload.colors !== undefined) updateData.colors = payload.colors;
  if (payload.designSize !== undefined) updateData.design_size = payload.designSize;
  if (payload.formats !== undefined) updateData.formats = payload.formats;
  if (payload.machines !== undefined) updateData.machines = payload.machines;
  if (payload.downloadUrl !== undefined) updateData.download_url = payload.downloadUrl;
  if (payload.featured !== undefined) updateData.featured = payload.featured;
  if (payload.visible !== undefined) updateData.visible = payload.visible;
  if (payload.sortOrder !== undefined) updateData.sort_order = payload.sortOrder;

  const { data, error } = await admin
    .from("free_designs")
    .update(updateData)
    .eq("id", id)
    .select("*, free_design_images(*)")
    .single();

  if (error) throw new Error(error.message);
  return normalizeDesign(data);
}

// ── Admin: Delete free design ─────────────────────────────────
export async function deleteFreeDesign(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("free_designs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Admin: Add image to free design ───────────────────────────
export async function addFreeDesignImage(designId: string, image: {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  sortOrder?: number;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("free_design_images")
    .insert({
      design_id: designId,
      url: image.url,
      thumbnail_url: image.thumbnailUrl || null,
      alt: image.alt || null,
      width: image.width || null,
      height: image.height || null,
      sort_order: image.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Admin: Remove image from free design ──────────────────────
export async function removeFreeDesignImage(imageId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("free_design_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
}

// ── Track download ─────────────────────────────────────────
export async function incrementDownloadCount(id: string) {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("free_designs")
    .select("download_count")
    .eq("id", id)
    .single();

  const newCount = (current?.download_count || 0) + 1;
  const { error } = await admin
    .from("free_designs")
    .update({ download_count: newCount })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return newCount;
}
