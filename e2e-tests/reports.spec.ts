import { test, expect } from "@playwright/test";

test("redirects unauthenticated users away from reports", async ({ page }) => {
  await page.goto("/app/reports");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
