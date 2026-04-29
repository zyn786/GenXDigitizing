import { z } from "zod";

export const manualPaymentAccountTypeSchema = z.enum([
  "BANK_ACCOUNT",
  "CASH_APP",
  "PAYPAL",
  "VENMO",
  "WISE",
  "ZELLE",
  "OTHER",
]);

export const createPaymentAccountSchema = z.object({
  type: manualPaymentAccountTypeSchema,
  displayName: z.string().trim().min(1).max(80),
  accountName: z.string().trim().min(1).max(120),
  accountId: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(2000).optional().nullable(),
  paymentLink: z.string().trim().url().max(1000).optional().nullable(),
  currency: z.string().trim().min(3).max(8).default("USD"),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updatePaymentAccountSchema = createPaymentAccountSchema.partial();

export const submitProofSchema = z.object({
  paymentAccountId: z.string().cuid().optional().nullable(),
  proofImageKey: z.string().trim().min(1),
  proofImageBucket: z.string().trim().min(1),
  amountClaimed: z.coerce.number().positive(),
  clientNotes: z.string().trim().max(2000).optional().nullable(),
});

export const reviewProofSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(2000).optional().nullable(),
});

export const orderFileUploadIntentSchema = z.object({
  fileName: z.string().trim().min(1).max(260),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.coerce.number().positive().int().max(500 * 1024 * 1024),
});

export type CreatePaymentAccountInput = z.infer<typeof createPaymentAccountSchema>;
export type UpdatePaymentAccountInput = z.infer<typeof updatePaymentAccountSchema>;
export type SubmitProofInput = z.infer<typeof submitProofSchema>;
export type ReviewProofInput = z.infer<typeof reviewProofSchema>;
