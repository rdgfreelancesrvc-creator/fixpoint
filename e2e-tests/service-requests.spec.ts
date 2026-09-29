import { test, expect } from "@playwright/test";

test("redirects unauthenticated users away from service request management", async ({ page }) => {
  await page.goto("/app/requests");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("redirects unauthenticated users away from request details", async ({ page }) => {
  await page.goto("/app/requests/not-a-request");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
