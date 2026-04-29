import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "@/components/marketing/hero-section";

describe("HeroSection", () => {
  it("renders the premium homepage headline and CTAs", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /precision artwork delivery/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /get quote/i }),
    ).toHaveAttribute("href", "/contact");

    expect(
      screen.getByRole("link", { name: /view portfolio/i }),
    ).toHaveAttribute("href", "/portfolio");
  });
});
