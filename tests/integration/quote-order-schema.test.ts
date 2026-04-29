import { describe, expect, it } from "vitest";
import { quoteOrderSchema } from "@/schemas/quote-order";

describe("quoteOrderSchema", () => {
  it("accepts a valid request", () => {
    const parsed = quoteOrderSchema.safeParse({
      mode: "quote",
      serviceType: "VECTOR_ART",
      nicheSlug: "jpg-to-vector",
      turnaround: "STANDARD",
      customerName: "Avery",
      email: "avery@example.com",
      companyName: "Studio",
      designTitle: "Menu logo redraw",
      notes: "",
      quantity: 1,
      sizeInches: 5,
      colorCount: 5,
      complexity: "LOW",
      sourceCleanup: true,
      smallText: false,
      threeDPuff: false,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email and missing design title", () => {
    const parsed = quoteOrderSchema.safeParse({
      mode: "order",
      serviceType: "VECTOR_ART",
      nicheSlug: "jpg-to-vector",
      turnaround: "SAME_DAY",
      customerName: "Avery",
      email: "not-an-email",
      companyName: "",
      designTitle: "",
      notes: "",
      quantity: 1,
      sizeInches: 5,
      colorCount: 5,
      complexity: "LOW",
      sourceCleanup: false,
      smallText: false,
      threeDPuff: false,
    });

    expect(parsed.success).toBe(false);
  });
});
