import crypto from "node:crypto";

const DEFAULT_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 10);

export function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtpCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function buildOtpExpiry(minutes = DEFAULT_TTL_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function verifyOtpCode(rawCode: string, hash: string) {
  return hashOtpCode(rawCode) === hash;
}
