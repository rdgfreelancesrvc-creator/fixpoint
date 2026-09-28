import { test, expect } from "@playwright/test";

test("customer can view the prototype repair status", async ({ page }) => {
  await page.goto("/track");

  await page.getByLabel("Service Request Number").fill("SR-2026-000123");
  await page.getByLabel("Mobile Number").fill("09171234567");
  await page.getByRole("button", { name: "Track Repair" }).click();

  await expect(page.getByRole("heading", { name: "SR-2026-000123" })).toBeVisible();
  await expect(page.getByText("Dell Inspiron 15").first()).toBeVisible();
  await expect(page.getByText("Waiting for Customer Approval").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Repair Quotation" })).toBeVisible();
  await expect(page.getByText("₱3,000")).toBeVisible();

  await page.getByRole("link", { name: "Review & Approve Quotation" }).click();
  await expect(page).toHaveURL(/\/quote$/);
  await expect(page.getByRole("heading", { name: "Review Your Repair Quotation" })).toBeVisible();
});

test("customer sees a helpful message for an invalid repair lookup", async ({ page }) => {
  await page.goto("/track");

  await page.getByLabel("Service Request Number").fill("SR-2026-999999");
  await page.getByLabel("Mobile Number").fill("09170000000");
  await page.getByRole("button", { name: "Track Repair" }).click();

  await expect(page.getByRole("heading", { name: "Repair Not Found" })).toBeVisible();
  await expect(page.getByText("Need Help? Contact FixPoint")).toBeVisible();
});