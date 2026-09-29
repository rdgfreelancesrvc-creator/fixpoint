import { test, expect } from "@playwright/test";

test("exposes only the one-time initial admin setup flow", async ({ page }) => {
  await page.goto("/setup");

  await expect(page.getByRole("heading", { name: /Create the first Owner\/Admin account|Setup Already Complete/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Up" })).toHaveCount(0);

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign Up" })).toHaveCount(0);

  await page.goto("/request");
  await expect(page).toHaveURL(/\/request$/);
});
