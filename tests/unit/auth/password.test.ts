import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Client123!");
    expect(hash).not.toBe("Client123!");
    await expect(verifyPassword("Client123!", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrong123!", hash)).resolves.toBe(false);
  });
});
