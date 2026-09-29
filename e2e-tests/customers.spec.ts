import { test, expect } from "@playwright/test";

test("redirects unauthenticated users away from the customer workspace", async ({ page }) => {
  await page.goto("/app/customers");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("redirects unauthenticated users away from customer details", async ({ page }) => {
  await page.goto("/app/customers/not-a-customer");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
