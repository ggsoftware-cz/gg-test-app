import { expect, test } from "@playwright/test";

// Minimal smoke suite — extend per project as real user flows appear
// (login, checkout, form submit...). Keep it fast; it runs on every preview.
test("homepage responds and renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});
