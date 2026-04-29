import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function signInWithPassword(
  page: Page,
  email: string,
  password: string,
  next: string
) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);

  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page
    .getByPlaceholder("Password", { exact: true })
    .first()
    .fill(password);

  await Promise.all([
    page.waitForURL((url) => !url.toString().includes("/login"), {
      timeout: 15000,
    }),
    page.getByRole("button", { name: /^sign in$/i }).last().click(),
  ]);
}

test("client invoices page renders", async ({ page }) => {
  const clientEmail = requireEnv("E2E_CLIENT_EMAIL");
  const clientPassword = requireEnv("E2E_CLIENT_PASSWORD");

  await signInWithPassword(
    page,
    clientEmail,
    clientPassword,
    "/client/invoices"
  );

  await expect(page).toHaveURL(/\/client\/invoices$/, { timeout: 15000 });

  await expect(
    page.getByRole("heading", {
      name: /invoices & billing/i,
    })
  ).toBeVisible();
});

test("admin invoices page renders", async ({ page }) => {
  const adminEmail = requireEnv("E2E_ADMIN_EMAIL");
  const adminPassword = requireEnv("E2E_ADMIN_PASSWORD");

  await signInWithPassword(
    page,
    adminEmail,
    adminPassword,
    "/admin/invoices"
  );

  await expect(page).toHaveURL(/\/admin\/invoices$/, { timeout: 15000 });

  await expect(
    page.getByRole("heading", {
      name: /^invoices$/i,
    })
  ).toBeVisible();
});