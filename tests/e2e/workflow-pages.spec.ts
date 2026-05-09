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
  next = "/post-login"
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

test("client login redirects to client orders", async ({ page }) => {
  const clientEmail = requireEnv("E2E_CLIENT_EMAIL");
  const clientPassword = requireEnv("E2E_CLIENT_PASSWORD");

  await signInWithPassword(page, clientEmail, clientPassword, "/post-login");

  await expect(page).toHaveURL(/\/client\/orders$/, { timeout: 15000 });

  await expect(
    page.getByRole("heading", {
      name: /your orders/i,
    })
  ).toBeVisible();
});

test("manager login redirects to admin orders", async ({ page }) => {
  const adminEmail = requireEnv("E2E_ADMIN_EMAIL");
  const adminPassword = requireEnv("E2E_ADMIN_PASSWORD");

  await signInWithPassword(page, adminEmail, adminPassword, "/post-login");

  await expect(page).toHaveURL(/\/admin\/orders$/, { timeout: 15000 });

  await expect(
    page.getByRole("heading", {
      name: /order queue/i,
    })
  ).toBeVisible();
});

test("client can view order status page without login", async ({ page }) => {
  await page.goto("/order-status");
  await expect(
    page.getByRole("heading", { name: /track your order/i })
  ).toBeVisible();
});

test("unauthenticated access to /client/orders redirects to login", async ({
  page,
}) => {
  await page.goto("/client/orders");
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});

test("unauthenticated access to /admin redirects to login", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});

test("unauthenticated API call to /api/admin/staff returns 401", async ({
  request,
}) => {
  const response = await request.get("/api/admin/staff");
  expect(response.status()).toBe(401);
});

test("unauthenticated API call to /api/client/orders returns 401", async ({
  request,
}) => {
  const response = await request.get("/api/client/orders");
  expect(response.status()).toBe(401);
});