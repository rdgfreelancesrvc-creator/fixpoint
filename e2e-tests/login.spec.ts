import { test, expect } from "@playwright/test";

test("redirects unauthenticated users away from the internal workspace", async ({ page }) => {
  await page.goto("/app/admin");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("shows a generic error for invalid credentials", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByRole("textbox", { name: "Password" }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("alert")).toContainText("Invalid email or password");
  await expect(page.getByRole("alert")).toContainText("Please check your credentials and try again.");
  await expect(page).toHaveURL(/\/login$/);
});

test("keeps the login card usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await page.getByRole("textbox", { name: "Password" }).fill("visible-demo-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByRole("textbox", { name: "Password" })).toHaveAttribute("type", "text");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
