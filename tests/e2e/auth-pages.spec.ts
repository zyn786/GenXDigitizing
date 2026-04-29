import { test, expect } from "@playwright/test";

test("login shell renders email and Google sign-in options", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /^sign in$/i })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: /create account/i }).first()
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Email", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Password", { exact: true }).first()
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /^sign in$/i }).last()
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /continue with google/i })
  ).toBeVisible();
});

test("register mode renders the onboarding form on the same auth page", async ({ page }) => {
  await page.goto("/login?mode=register");

  await expect(
    page.getByRole("heading", { name: /create account/i })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Name", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Email", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Company Name (optional)")
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Password", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /create account/i }).last()
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /continue with google/i })
  ).toBeVisible();
});

test("register route redirects to login register mode", async ({ page }) => {
  await page.goto("/register");
  await expect(page).toHaveURL(/\/login\?mode=register$/);
  await expect(
    page.getByRole("heading", { name: /create account/i })
  ).toBeVisible();
});