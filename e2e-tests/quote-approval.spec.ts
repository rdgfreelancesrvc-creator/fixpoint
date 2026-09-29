import { test, expect } from "@playwright/test";

test.describe("secure customer quotations", () => {
  test("does not expose quotation data without a secure token", async ({ page }) => {
    await page.goto("/quote");

    await expect(page.getByRole("heading", { name: "Quotation unavailable" })).toBeVisible();
    await expect(page.getByText("This quotation link is incomplete or invalid.")).toBeVisible();
    await expect(page.getByText("SR-2026-000123")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve Repair" })).toHaveCount(0);
  });

  test("shows the unavailable state for an invalid quotation token", async ({ page }) => {
    await page.goto("/quote?token=not-a-real-token");

    await expect(page.getByRole("heading", { name: "Quotation unavailable" })).toBeVisible();
    await expect(page.getByText("This quotation link is invalid or no longer available.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline Quotation" })).toHaveCount(0);
  });
});
