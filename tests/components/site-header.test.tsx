import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/layout/site-header";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("SiteHeader", () => {
  it("renders all primary navigation links", () => {
    render(<SiteHeader />);

    // Nav links appear in both desktop and mobile nav — just confirm they exist
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Services" })[0]).toHaveAttribute("href", "/services");
    expect(screen.getAllByRole("link", { name: "Pricing" })[0]).toHaveAttribute("href", "/pricing");
    expect(screen.getAllByRole("link", { name: "Portfolio" })[0]).toHaveAttribute("href", "/portfolio");
    expect(screen.getAllByRole("link", { name: "Contact" })[0]).toHaveAttribute("href", "/contact");
  });
});
