import { expect, test } from "@playwright/test";

test("homepage renders and primary navigation works", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /precision artwork delivery/i,
    }),
  ).toBeVisible();

  await page
    .getByLabel("Primary")
    .getByRole("link", { name: "Services" })
    .click();

  await expect(page).toHaveURL(/\/services$/);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /service architecture by niche and workflow complexity/i,
    }),
  ).toBeVisible();
});
