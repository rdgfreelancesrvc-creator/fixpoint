import { test, expect } from "@playwright/test";

test("customer can approve a repair quotation and return to tracking", async ({ page }) => {
  await page.goto("/quote");

  await expect(page.getByRole("heading", { name: "Review Your Repair Quotation" })).toBeVisible();
  await expect(page.getByText("What We Found")).toBeVisible();
  await expect(page.getByText("₱3,000").first()).toBeVisible();

  await page.getByRole("button", { name: "Approve Repair — ₱3,000" }).click();

  await expect(page.getByRole("heading", { name: "Repair Approved" })).toBeVisible();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await page.locator("main").getByRole("link", { name: "Track My Repair" }).click();
  await expect(page).toHaveURL(/\/track$/);
  await expect(page.getByRole("heading", { name: "Track My Repair" })).toBeVisible();
});

test("customer can confirm declining a repair quotation", async ({ page }) => {
  await page.goto("/quote");

  await page.getByRole("button", { name: "Decline Quotation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decline This Quotation?" })).toBeVisible();

  await page.getByRole("button", { name: "Go Back" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: "Decline Quotation" }).click();
  await page.getByRole("button", { name: "Yes, Decline" }).click();

  await expect(page.getByRole("heading", { name: "Quotation Declined" })).toBeVisible();
  await expect(page.locator("main").getByText("Quotation Declined", { exact: true }).last()).toBeVisible();
  await page.getByRole("link", { name: "Return to Repair Tracking" }).click();
  await expect(page).toHaveURL(/\/track$/);
});
