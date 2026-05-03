import { z } from "zod";

export const LEAD_SOURCES = [
  "WEBSITE", "FACEBOOK", "INSTAGRAM", "GOOGLE",
  "REFERRAL", "WHATSAPP", "DIRECT_VISIT", "CAMPAIGN", "MANUAL", "UNKNOWN",
] as const;

export const FILE_FORMATS = [
  "DST", "PES", "EMB", "EXP", "JEF", "VP3", "XXX", "HUS", "SEW",
  "PDF", "SVG", "AI", "PNG",
] as const;

export const quoteOrderSchema = z.object({
  mode: z.enum(["quote", "order"]),
  serviceType: z.enum([
    "EMBROIDERY_DIGITIZING",
    "VECTOR_ART",
    "COLOR_SEPARATION_DTF",
    "CUSTOM_PATCHES",
  ]),
  nicheSlug: z.string().min(1),
  turnaround: z.enum(["STANDARD", "URGENT", "SAME_DAY"]),
  customerName: z.string().min(2),
  email: z.email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  companyName: z.string().trim().optional().or(z.literal("")),
  designTitle: z.string().min(2),
  notes: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(5000).default(1),

  // Existing size/color/complexity fields
  sizeInches: z.coerce.number().min(0.5).max(24).default(4),
  colorCount: z.coerce.number().int().min(1).max(16).default(4),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),

  // Addons
  sourceCleanup: z.coerce.boolean().default(false),
  smallText: z.coerce.boolean().default(false),
  threeDPuff: z.coerce.boolean().default(false),

  // Production fields
  placement: z.string().optional().or(z.literal("")),
  designHeightIn: z.coerce.number().min(0).max(24).optional(),
  designWidthIn: z.coerce.number().min(0).max(24).optional(),
  fabricType: z.string().optional().or(z.literal("")),
  is3dPuffJacketBack: z.coerce.boolean().default(false),
  trims: z.string().optional().or(z.literal("")),
  threadBrand: z.string().optional().or(z.literal("")),
  colorDetails: z.string().optional().or(z.literal("")),
  colorQuantity: z.coerce.number().int().min(0).max(50).optional(),
  fileFormats: z.array(z.enum(FILE_FORMATS)).default([]),
  stitchCount: z.coerce.number().int().min(0).optional(),
  specialInstructions: z.string().optional().or(z.literal("")),

  // Lead source (optionally passed from referral context)
  leadSource: z.enum(LEAD_SOURCES).optional(),
});

export type QuoteOrderInput = z.infer<typeof quoteOrderSchema>;
