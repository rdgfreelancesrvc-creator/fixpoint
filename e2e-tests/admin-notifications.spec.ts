import { test, expect } from "@playwright/test";

test.describe("notification administration", () => {
  test("protects notification logs from signed-out visitors", async ({ page }) => {
    await page.goto("/app/admin/notifications");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("protects notification settings from signed-out visitors", async ({ page }) => {
    await page.goto("/app/admin/settings");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
