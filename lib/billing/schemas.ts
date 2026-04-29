import { z } from "zod";

export const currencyCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(8);

export const paymentMethodSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim().toUpperCase();
}, z.enum(["BANK_TRANSFER", "CASH", "CARD", "PAYPAL", "OTHER"]));

const emailField = z.string().trim().email();

const optionalIsoDateSchema = z
  .union([z.string().trim().min(1), z.date()])
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    return value;
  });

export const paymentInputSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: currencyCodeSchema,
  method: paymentMethodSchema,
  reference: z.string().trim().max(120).optional().nullable(),
  clientEmail: emailField.optional().default("client@example.com"),
  backupEmail: emailField.optional().nullable(),
  receivedAt: optionalIsoDateSchema,
  note: z.string().trim().max(1000).optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const invoiceSendPayloadSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
  clientEmail: emailField.optional(),
  backupEmail: emailField.optional().nullable(),
});

export const auditCodeInputSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
});

export const paymentSchema = paymentInputSchema;
export const invoiceSendSchema = invoiceSendPayloadSchema;
export const auditCodeSchema = auditCodeInputSchema;

export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type InvoiceSendPayload = z.infer<typeof invoiceSendPayloadSchema>;
export type AuditCodeInput = z.infer<typeof auditCodeInputSchema>;