import { test, expect } from "@playwright/test";

test("portfolio and contact routes render from primary public CTAs", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("link", { name: "View Portfolio", exact: true })
    .first()
    .click();

  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.locator("h1").first()).toBeVisible();

  await page.goto("/");

  await page
    .getByLabel("Primary")
    .getByRole("link", { name: "Contact" })
    .click();

  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("h1").first()).toBeVisible();
});