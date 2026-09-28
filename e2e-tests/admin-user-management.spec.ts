import { test, expect } from "@playwright/test";

test("redirects unauthenticated users away from admin user management", async ({ page }) => {
  await page.goto("/app/admin/users");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
