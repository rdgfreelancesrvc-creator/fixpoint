import { test, expect } from "@playwright/test";

async function submitRequest(page: import("@playwright/test").Page, phone: string) {
  await page.goto("/request");
  await page.getByLabel(/Full Name/).fill("Tracking Customer");
  await page.getByLabel(/Mobile Number/).fill(phone);
  await page.getByLabel(/Email Address/).fill("tracking@example.com");
  await page.getByRole("group", { name: "Preferred Contact Method" }).getByRole("radio", { name: "Email" }).check();
  await page.getByLabel(/Device Type/).selectOption({ label: "Laptop" });
  await page.getByLabel(/Brand/).fill("Lenovo");
  await page.getByLabel(/Service Needed/).selectOption({ label: "Laptop Diagnostic" });
  await page.getByLabel(/Describe the Problem/).fill("The laptop is running slowly.");
  await page.getByRole("group", { name: "Preferred service contact" }).getByRole("radio", { name: "Email" }).check();
  await page.getByRole("button", { name: "Submit Repair Request" }).click();
  await expect(page.getByRole("heading", { name: "Request Received" })).toBeVisible();
  return (await page.getByText(/^SR-\d{4}-\d{6}$/).textContent()) ?? "";
}

test("customer can track a real request and sees quotation pending", async ({ page }) => {
  const requestNumber = await submitRequest(page, "555-0110");
  await page.locator("main").getByRole("link", { name: "Track My Repair" }).click();

  await page.getByLabel("Mobile Number").fill("555-0199");
  await page.getByRole("button", { name: "Track Repair" }).click();
  await expect(page.getByRole("heading", { name: "Repair Not Found" })).toBeVisible();

  await page.getByLabel("Mobile Number").fill("555-0110");
  await page.getByRole("button", { name: "Track Repair" }).click();
  await expect(page.getByRole("heading", { name: requestNumber })).toBeVisible();
  await expect(page.getByText("Received", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quotation pending" })).toBeVisible();
  await expect(page.getByText("Repair Quotation")).not.toBeVisible();
  await expect(page.getByText("Diagnosis", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Internal Notes", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Parts & Materials", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Labor", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Estimated Repair Cost", { exact: true })).not.toBeVisible();
});

test("customer sees a helpful message for an invalid repair lookup", async ({ page }) => {
  await page.goto("/track");

  await page.getByLabel("Service Request Number").fill("SR-2026-999999");
  await page.getByLabel("Mobile Number").fill("09170000000");
  await page.getByRole("button", { name: "Track Repair" }).click();

  await expect(page.getByRole("heading", { name: "Repair Not Found" })).toBeVisible();
  await expect(page.getByText("Need Help? Contact FixPoint")).toBeVisible();
});
