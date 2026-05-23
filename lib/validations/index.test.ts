import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createOrderSchema,
  assignDesignerSchema,
  uploadOutputSchema,
  submitReviewSchema,
  sendMessageSchema,
  updatePriceSchema,
  createLeadSchema,
  updateProfileSchema,
} from "./index";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validInput = {
    full_name: "John Doe",
    email: "john@example.com",
    password: "Password1",
    confirm_password: "Password1",
    company_name: "Acme Corp",
    country: "US",
    agreed_terms: true as const,
  };

  it("accepts valid registration", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...validInput, confirm_password: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const path = result.error.issues[0].path[0];
      expect(path).toBe("confirm_password");
    }
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "lowercase1", confirm_password: "lowercase1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "OnlyLetters", confirm_password: "OnlyLetters" });
    expect(result.success).toBe(false);
  });

  it("rejects short full_name", () => {
    const result = registerSchema.safeParse({ ...validInput, full_name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects empty company_name", () => {
    const result = registerSchema.safeParse({ ...validInput, company_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects false agreed_terms", () => {
    const result = registerSchema.safeParse({ ...validInput, agreed_terms: false });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "NewPass1", confirm_password: "NewPass1" });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "NewPass1", confirm_password: "WrongPass1" });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  const validOrder = {
    service_tier_id: "digitizing_standard",
    output_format: "DST" as const,
    turnaround: "standard" as const,
  };

  it("accepts valid order", () => {
    const result = createOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it("accepts all output formats", () => {
    const formats = ["DST", "PES", "EMB", "JEF", "XXX", "VIP", "HUS", "EXP", "VP3", "SEW", "AI", "SVG", "EPS", "PDF"];
    for (const fmt of formats) {
      const result = createOrderSchema.safeParse({ ...validOrder, output_format: fmt });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid output_format", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, output_format: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects empty service_tier_id", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, service_tier_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid turnaround", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, turnaround: "instant" });
    expect(result.success).toBe(false);
  });

  it("rejects negative width_inches", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, width_inches: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects width > 30", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, width_inches: 35 });
    expect(result.success).toBe(false);
  });

  it("rejects placement_notes > 500 chars", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, placement_notes: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("assignDesignerSchema", () => {
  it("accepts valid designer ID", () => {
    const result = assignDesignerSchema.safeParse({ designer_id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID designer_id", () => {
    const result = assignDesignerSchema.safeParse({ designer_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = assignDesignerSchema.safeParse({
      designer_id: "550e8400-e29b-41d4-a716-446655440000",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });
});

describe("uploadOutputSchema", () => {
  it("accepts valid upload data", () => {
    const result = uploadOutputSchema.safeParse({ stitch_count: 5000, format: "DST" });
    expect(result.success).toBe(true);
  });

  it("rejects zero stitch count", () => {
    const result = uploadOutputSchema.safeParse({ stitch_count: 0, format: "DST" });
    expect(result.success).toBe(false);
  });

  it("rejects excessive stitch count", () => {
    const result = uploadOutputSchema.safeParse({ stitch_count: 600000, format: "DST" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format for output", () => {
    const result = uploadOutputSchema.safeParse({ stitch_count: 5000, format: "PDF" });
    expect(result.success).toBe(false);
  });
});

describe("submitReviewSchema", () => {
  it("accepts valid review", () => {
    const result = submitReviewSchema.safeParse({ stars: 5, text: "Great work, very happy!" });
    expect(result.success).toBe(true);
  });

  it("rejects stars out of range", () => {
    expect(submitReviewSchema.safeParse({ stars: 0 }).success).toBe(false);
    expect(submitReviewSchema.safeParse({ stars: 6 }).success).toBe(false);
  });

  it("rejects non-integer stars", () => {
    const result = submitReviewSchema.safeParse({ stars: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects too short review text", () => {
    const result = submitReviewSchema.safeParse({ stars: 4, text: "Too short" });
    expect(result.success).toBe(false);
  });
});

describe("sendMessageSchema", () => {
  it("accepts valid message", () => {
    const result = sendMessageSchema.safeParse({ body: "Hello!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = sendMessageSchema.safeParse({ body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects body > 2000 chars", () => {
    const result = sendMessageSchema.safeParse({ body: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("updatePriceSchema", () => {
  it("accepts valid price", () => {
    const result = updatePriceSchema.safeParse({ price: 25.99 });
    expect(result.success).toBe(true);
  });

  it("rejects zero price", () => {
    const result = updatePriceSchema.safeParse({ price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = updatePriceSchema.safeParse({ price: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects price > 10000", () => {
    const result = updatePriceSchema.safeParse({ price: 15000 });
    expect(result.success).toBe(false);
  });
});

describe("createLeadSchema", () => {
  it("accepts valid lead", () => {
    const result = createLeadSchema.safeParse({ contact_name: "Jane Doe", email: "jane@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects missing contact_name", () => {
    const result = createLeadSchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createLeadSchema.safeParse({ contact_name: "Jane", email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts valid profile update", () => {
    const result = updateProfileSchema.safeParse({ full_name: "John Smith", country: "US" });
    expect(result.success).toBe(true);
  });

  it("rejects short full_name", () => {
    const result = updateProfileSchema.safeParse({ full_name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects full_name > 80 chars", () => {
    const result = updateProfileSchema.safeParse({ full_name: "A".repeat(81) });
    expect(result.success).toBe(false);
  });
});
