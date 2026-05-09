import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/marketing/hero-section";

// Mock framer-motion to avoid animation test complexity
vi.mock("framer-motion", () => ({
  motion: {
    h1: ({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className={className}>{children}</h1>,
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    p: ({ children, className }: React.HTMLAttributes<HTMLParagraphElement>) => <p className={className}>{children}</p>,
  },
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("HeroSection", () => {
  it("renders the homepage hero heading and CTA links", () => {
    render(<HeroSection />);

    // h1 is rendered — just verify it exists
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBeTruthy();

    // Contact CTA link exists
    const contactLinks = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("href") === "/contact"
    );
    expect(contactLinks.length).toBeGreaterThan(0);
  });
});
