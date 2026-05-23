import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  full_name:    z.string().min(2, "Name must be at least 2 characters").max(80),
  email:        z.string().email("Invalid email address"),
  password:     z.string().min(8, "Password must be at least 8 characters")
                  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
                  .regex(/[0-9]/, "Must contain at least one number"),
  confirm_password: z.string(),
  company_name: z.string().min(1, "Company name is required").max(100),
  country:      z.string().min(2, "Country is required"),
  agreed_terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

// ── Orders ────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  service_tier_id: z.string().min(1, "Please select a service"),
  output_format:   z.enum(["DST","PES","EMB","JEF","XXX","VIP","HUS","EXP","VP3","SEW","AI","SVG","EPS","PDF"]),
  additional_formats: z.array(z.string()).optional(),
  turnaround:      z.enum(["standard", "rush", "urgent"]),
  width_inches:    z.number().positive().max(30).optional(),
  height_inches:   z.number().positive().max(30).optional(),
  color_count:     z.number().int().positive().max(32).optional(),
  placement_notes: z.string().max(500).optional(),
});

export const assignDesignerSchema = z.object({
  designer_id: z.string().uuid("Invalid designer"),
  priority:    z.enum(["low", "medium", "high"]).optional(),
});

export const uploadOutputSchema = z.object({
  stitch_count: z.number().int().positive("Stitch count is required").max(500000),
  format:       z.enum(["DST","PES","EMB","JEF","XXX","VIP","HUS"]),
  notes:        z.string().max(500).optional(),
});

// ── Reviews ───────────────────────────────────────────────────

export const submitReviewSchema = z.object({
  stars: z.number().int().min(1).max(5),
  text:  z.string().min(10, "Please write at least 10 characters").max(500).optional(),
});

// ── Messages ──────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  body:     z.string().min(1, "Message cannot be empty").max(2000),
  order_id: z.string().uuid().optional(),
  subject:  z.string().max(200).optional(),
});

// ── Pricing ───────────────────────────────────────────────────

export const updatePriceSchema = z.object({
  price: z.number().positive("Price must be greater than 0").max(10000),
});

// ── CRM Leads ─────────────────────────────────────────────────

export const createLeadSchema = z.object({
  contact_name: z.string().min(2).max(100),
  email:        z.string().email(),
  company:      z.string().max(100).optional(),
  phone:        z.string().max(30).optional(),
  country:      z.string().max(50).optional(),
  deal_value:   z.number().positive().optional(),
  source:       z.string().max(50).optional(),
  notes:        z.string().max(500).optional(),
});

// ── Profile ───────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  full_name:    z.string().min(2).max(80),
  company_name: z.string().min(1).max(100).optional(),
  phone:        z.string().max(30).optional(),
  country:      z.string().min(2).optional(),
});

// ── Settings ──────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  company_name:   z.string().min(1).max(100),
  support_email:  z.string().email(),
  reply_to_email: z.string().email().optional(),
  timezone:       z.string(),
  default_format: z.enum(["DST","PES","EMB","JEF","XXX","VIP","HUS"]),
});

// ── Type exports ──────────────────────────────────────────────

export type LoginInput            = z.infer<typeof loginSchema>;
export type RegisterInput         = z.infer<typeof registerSchema>;
export type ForgotPasswordInput   = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput    = z.infer<typeof resetPasswordSchema>;
export type CreateOrderInput      = z.infer<typeof createOrderSchema>;
export type AssignDesignerInput   = z.infer<typeof assignDesignerSchema>;
export type UploadOutputInput     = z.infer<typeof uploadOutputSchema>;
export type SubmitReviewInput     = z.infer<typeof submitReviewSchema>;
export type SendMessageInput      = z.infer<typeof sendMessageSchema>;
export type UpdatePriceInput      = z.infer<typeof updatePriceSchema>;
export type CreateLeadInput       = z.infer<typeof createLeadSchema>;
export type UpdateProfileInput    = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput   = z.infer<typeof updateSettingsSchema>;
