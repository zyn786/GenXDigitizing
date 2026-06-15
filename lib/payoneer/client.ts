import crypto from "crypto";

export function verifyPayoneerWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.PAYONEER_WEBHOOK_SECRET;
  if (secret && signature) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature.replace("sha256=", ""), "hex")
    );
  }
  return process.env.NODE_ENV !== "production";
}
