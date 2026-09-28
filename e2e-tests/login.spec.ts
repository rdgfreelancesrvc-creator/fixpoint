import { test, expect } from "@playwright/test";

const demoLogins = [
  { label: "admin", email: "admin@fixpoint.test", password: "Admin123!", destination: "/app/admin", workspace: "Admin workspace" },
  { label: "staff", email: "staff@fixpoint.test", password: "Staff123!", destination: "/app/staff", workspace: "Staff workspace" },
  { label: "technician", email: "tech@fixpoint.test", password: "Tech123!", destination: "/app/technician", workspace: "Technician workspace" },
];

for (const login of demoLogins) {
  test(`${login.label} can sign in to the correct workspace`, async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(login.email);
    await page.getByRole("textbox", { name: "Password" }).fill(login.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    await expect(page).toHaveURL(new RegExp(`${login.destination}$`));
    await expect(page.getByRole("complementary").getByText(login.workspace, { exact: true })).toBeVisible();
  });
}

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
