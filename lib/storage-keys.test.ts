import { describe, it, expect } from "vitest";
import { isServableKey, isSafeStoragePath, stripLegacyPrefix } from "./storage-keys";

// The only remaining consumer is /api/chat/upload — keep in sync with its
// ALLOWED_PREFIXES.
const CHAT = ["chat/", "guest-uploads/", "requests/"];

describe("isSafeStoragePath", () => {
  it("accepts an ordinary key", () => {
    expect(isSafeStoragePath("chat/1699999999-abc-logo.png")).toBe(true);
  });

  it("rejects empty and nullish", () => {
    expect(isSafeStoragePath("")).toBe(false);
    expect(isSafeStoragePath(null)).toBe(false);
    expect(isSafeStoragePath(undefined)).toBe(false);
  });

  it("rejects traversal, absolute, backslash and NUL", () => {
    expect(isSafeStoragePath("chat/../orders/x/output/y")).toBe(false);
    expect(isSafeStoragePath("..%2Forders")).toBe(false);
    expect(isSafeStoragePath("/etc/passwd")).toBe(false);
    expect(isSafeStoragePath("chat\\..\\x")).toBe(false);
    expect(isSafeStoragePath("chat/a\0b")).toBe(false);
  });

  it("rejects absurdly long keys", () => {
    expect(isSafeStoragePath("chat/" + "a".repeat(600))).toBe(false);
  });
});

describe("isServableKey — allowlist is the security boundary", () => {
  it("allows only the permitted prefixes", () => {
    expect(isServableKey("chat/1699999999-a-b.png", CHAT)).toBe(true);
    expect(isServableKey("guest-uploads/1699999999-a-logo.ai", CHAT)).toBe(true);
    expect(isServableKey("requests/1699999999-a-art.pdf", CHAT)).toBe(true);
  });

  it("blocks the buckets that caused the original vulnerability", () => {
    // Paid deliverables, customer artwork, and internal admin mail must never be
    // signable from a route whose key comes from a query parameter.
    const exposed = [
      "orders/8f1c/output/final.dst",
      "orders/8f1c/artwork/logo.ai",
      "email-attachments/invoice-42.pdf",
    ];
    for (const key of exposed) {
      expect(isServableKey(key, CHAT)).toBe(false);
    }
  });

  it("does not let a prefix match across a path-segment boundary", () => {
    // "chatter/" must not satisfy the "chat/" allowlist.
    expect(isServableKey("chatter/x", CHAT)).toBe(false);
    expect(isServableKey("chat-evil/x", CHAT)).toBe(false);
    expect(isServableKey("guest-uploads-evil/x", CHAT)).toBe(false);
  });

  it("still rejects traversal even under a permitted prefix", () => {
    expect(isServableKey("chat/../../email-attachments/x.pdf", CHAT)).toBe(false);
    expect(isServableKey("chat/../orders/8f1c/output/final.dst", CHAT)).toBe(false);
  });

  it("rejects a full URL — normalisation must not be reachable from here", () => {
    const url = "https://abcdefg.supabase.co/storage/v1/object/sign/outputs/orders/8f1c/output/final.dst?token=x";
    expect(isServableKey(url, CHAT)).toBe(false);
  });

  it("rejects an empty allowlist", () => {
    expect(isServableKey("chat/x", [])).toBe(false);
  });

  it("tolerates the legacy s3:: marker without letting it escape the allowlist", () => {
    expect(isServableKey("s3::chat/1699999999-a-b.png", CHAT)).toBe(true);
    // the marker must not be a bypass for other buckets
    expect(isServableKey("s3::orders/8f1c/output/final.dst", CHAT)).toBe(false);
    expect(isServableKey("s3::email-attachments/invoice.pdf", CHAT)).toBe(false);
    expect(isServableKey("s3::chat/../orders/8f1c/output/final.dst", CHAT)).toBe(false);
  });
});

describe("stripLegacyPrefix", () => {
  it("removes only a leading s3:: marker", () => {
    expect(stripLegacyPrefix("s3::chat/x")).toBe("chat/x");
    expect(stripLegacyPrefix("chat/x")).toBe("chat/x");
    expect(stripLegacyPrefix("chat/s3::x")).toBe("chat/s3::x");
  });
});
