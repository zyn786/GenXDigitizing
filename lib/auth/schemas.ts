import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(24).optional().or(z.literal("")),
  password: z.string().min(8).max(128),
  companyName: z.string().max(120).optional().or(z.literal("")),
});

export const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  redirectTo: z.string().optional(),
});

export const requestOtpSchema = z.object({
  phone: z.string().min(8).max(24),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(24),
  code: z.string().length(6),
  redirectTo: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
