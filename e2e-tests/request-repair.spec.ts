import { test, expect } from "@playwright/test";

test("customer can submit a repair request prototype", async ({ page }) => {
  await page.goto("/request");

  await page.getByLabel(/Full Name/).fill("Jordan Lee");
  await page.getByLabel(/Mobile Number/).fill("555-0100");
  await page.getByLabel(/Email Address/).fill("jordan@example.com");
  await page.getByRole("group", { name: "Preferred Contact Method" }).getByRole("radio", { name: "Email" }).check();
  await page.getByLabel(/Device Type/).selectOption({ label: "Laptop" });
  await page.getByLabel(/Brand/).fill("Lenovo");
  await page.getByLabel(/Service Needed/).selectOption({ label: "Diagnostics" });
  await page.getByLabel(/Describe the Problem/).fill("The laptop has become very slow and sometimes freezes.");
  await page.getByRole("group", { name: "Preferred service contact" }).getByRole("radio", { name: "Email" }).check();
  await page.getByRole("button", { name: "Submit Repair Request" }).click();

  await expect(page.getByRole("heading", { name: "Request Received" })).toBeVisible();
  await expect(page.getByText("SR-2026-000123")).toBeVisible();
});
