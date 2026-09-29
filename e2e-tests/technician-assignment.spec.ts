import { test, expect } from "@playwright/test";

test.describe("technician assignment workspaces", () => {
  test("protects the technician dashboard from signed-out visitors", async ({ page }) => {
    await page.goto("/app/technician");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("protects the assigned repair queue from signed-out visitors", async ({ page }) => {
    await page.goto("/app/my-repairs");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("protects the internal technician workload view from signed-out visitors", async ({ page }) => {
    await page.goto("/app/technicians");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
