import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret() {
  const s = process.env.AUDIT_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) throw new Error("No secret available for audit token.");
  return s;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAuditToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const sig = sign(payload, getSecret());
  return `${payload}.${sig}`;
}

export function verifyAuditToken(token: string, claimedUserId: string): boolean {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;

    const expectedSig = sign(payload, getSecret());
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; exp: number };
    if (data.userId !== claimedUserId) return false;
    if (Date.now() > data.exp) return false;

    return true;
  } catch {
    return false;
  }
}
