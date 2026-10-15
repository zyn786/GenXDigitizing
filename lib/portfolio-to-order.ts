/**
 * "Make something like this" — turn a portfolio item into pre-filled settings
 * for the /upload wizard.
 *
 * Pure and dependency-free so it is unit-testable under the repo's node-env
 * vitest config, and so the mapping table can be read in one place.
 *
 * The wizard owns the vocabulary (`GARMENTS`, `PLACEMENT_LABELS`, `FABRICS`,
 * `SPEEDS`, `FORMATS` in app/(marketing)/upload/UploadWizard.tsx). This module
 * deliberately does NOT duplicate those lists as the source of truth — it
 * returns plain strings and the wizard validates them against its own consts.
 * That way a value added to the wizard cannot silently drift out of sync here.
 */

export interface UploadPrefill {
  garment: string;
  placement: string;
  fabric: string;
  format: string;
  speed: string;
  width: string;
  height: string;
  colors: string;
  notes: string;
}

/** Everything the mapping needs — a structural subset of PortfolioItem. */
export interface PrefillSource {
  title: string;
  slug: string;
  tags?: string[];
  designSize?: string;
  colors?: number;
  outputFormat?: string;
  turnaround?: string;
  category?: { slug?: string; name?: string } | null;
}

/**
 * Portfolio tag -> (garment, placement) in the wizard's vocabulary.
 *
 * Keys are lowercased; lookups lowercase the tag first. Order matters only in
 * that the first matching tag wins, so more specific entries ("cap front")
 * are harmless next to general ones ("cap").
 */
const TAG_PLACEMENTS: Record<string, { garment: string; placement: string }> = {
  "left chest": { garment: "polo", placement: "left_chest" },
  "right chest": { garment: "polo", placement: "right_chest" },
  "center chest": { garment: "hoodie", placement: "center_chest" },
  "full front": { garment: "polo", placement: "full_front" },
  "full back": { garment: "jacket", placement: "jacket_back" },
  "jacket back": { garment: "jacket", placement: "jacket_back" },
  "cap front": { garment: "cap", placement: "cap_front" },
  "cap side": { garment: "cap", placement: "cap_side" },
  "cap back": { garment: "cap", placement: "cap_back" },
  cap: { garment: "cap", placement: "cap_front" },
  beanie: { garment: "cap", placement: "cap_front" },
  sleeve: { garment: "jacket", placement: "sleeve_left" },
  "puff 3d": { garment: "cap", placement: "cap_front" },
  hood: { garment: "hoodie", placement: "hood" },
  hoodie: { garment: "hoodie", placement: "center_chest" },
  towel: { garment: "towel", placement: "towel_corner" },
  bag: { garment: "bag", placement: "bag_front" },
  backpack: { garment: "bag", placement: "bag_front" },
  applique: { garment: "other", placement: "other" },
  flat: { garment: "other", placement: "other" },
  // Patch lines all land on the single patch placement the wizard offers.
  patch: { garment: "patch", placement: "patch_standard" },
  "merit badge": { garment: "patch", placement: "patch_standard" },
  tactical: { garment: "patch", placement: "patch_standard" },
  "pvc-style": { garment: "patch", placement: "patch_standard" },
  "name patch": { garment: "patch", placement: "patch_standard" },
  "club patch": { garment: "patch", placement: "patch_standard" },
  "event patch": { garment: "patch", placement: "patch_standard" },
};

/** Category fallback when no tag matches. Vector art has no garment, so it
 *  intentionally maps to nothing rather than to a wrong guess. */
const CATEGORY_PLACEMENTS: Record<string, { garment: string; placement: string }> = {
  patches: { garment: "patch", placement: "patch_standard" },
  sewouts: { garment: "other", placement: "other" },
};

const KNOWN_FORMATS = ["DST", "PES", "EMB", "EXP", "JEF"];

export const EMPTY_PREFILL: UploadPrefill = {
  garment: "",
  placement: "",
  fabric: "",
  format: "",
  speed: "",
  width: "",
  height: "",
  colors: "",
  notes: "",
};

function placementFor(source: PrefillSource) {
  for (const tag of source.tags ?? []) {
    const hit = TAG_PLACEMENTS[tag.trim().toLowerCase()];
    if (hit) return hit;
  }
  const slug = source.category?.slug?.toLowerCase();
  return slug ? (CATEGORY_PLACEMENTS[slug] ?? null) : null;
}

/**
 * `outputFormat` is free text an admin typed — "DST · PES", "DST/PES", "pes".
 * Take the first token that is a format we actually offer.
 */
export function parseFormat(raw?: string): string {
  if (!raw) return "";
  const tokens = raw.toUpperCase().split(/[^A-Z0-9]+/);
  return tokens.find((t) => KNOWN_FORMATS.includes(t)) ?? "";
}

export function parseSpeed(raw?: string): string {
  if (!raw) return "";
  const s = raw.toLowerCase();
  if (s.includes("urgent") || s.includes("emergency")) return "urgent";
  if (s.includes("rush") || s.includes("priority")) return "rush";
  if (s.includes("standard")) return "standard";
  return "";
}

/**
 * `designSize` is free text: `4"`, `3.5"`, `10" x 4"`, `3.5"–4.5" wide`.
 *
 * The range case is the trap — `3.5"–4.5"` is a span of *widths*, not a width
 * and a height, and reading it as 3.5 x 4.5 would silently produce a square
 * design. So a dash or "to" means "first number is the width, height unknown".
 */
export function parseSize(raw?: string): { width: string; height: string } {
  if (!raw) return { width: "", height: "" };
  const nums = raw.match(/\d+(?:\.\d+)?/g) ?? [];
  if (nums.length === 0) return { width: "", height: "" };
  const isRange = /[-–—]|\bto\b/i.test(raw);
  return { width: nums[0] ?? "", height: isRange ? "" : (nums[1] ?? "") };
}

export function buildUploadPrefill(source: PrefillSource): UploadPrefill {
  const place = placementFor(source);
  const size = parseSize(source.designSize);

  return {
    garment: place?.garment ?? "",
    placement: place?.placement ?? "",
    fabric: "",
    format: parseFormat(source.outputFormat),
    speed: parseSpeed(source.turnaround),
    width: size.width,
    height: size.height,
    colors: source.colors && source.colors > 0 ? String(source.colors) : "",
    // Surfaced in the customer's own notes box, which they can edit before
    // submitting. It tells the digitiser which sample the customer pointed at.
    notes: `Reference: our "${source.title}" sample (portfolio/${source.slug}).`,
  };
}

/** `/upload` with only the non-empty settings, or bare `/upload`. */
export function buildUploadHref(source: PrefillSource): string {
  const prefill = buildUploadPrefill(source);
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(prefill)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/upload?${query}` : "/upload";
}

/**
 * Read settings back off a URL. Returns raw strings — the wizard validates
 * each one against its own option lists, so a hand-edited or hostile URL can
 * only ever select an option that genuinely exists, or be ignored.
 */
export function readUploadPrefill(search: string): Partial<UploadPrefill> {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const out: Partial<UploadPrefill> = {};

  for (const key of Object.keys(EMPTY_PREFILL) as (keyof UploadPrefill)[]) {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 300);
  }

  return out;
}
