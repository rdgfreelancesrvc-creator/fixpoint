import { test, expect } from "@playwright/test";

async function fillRequestForm(page: import("@playwright/test").Page, phone: string) {
  await page.goto("/request");

  await page.getByLabel(/Full Name/).fill("Jordan Lee");
  await page.getByLabel(/Mobile Number/).fill(phone);
  await page.getByLabel(/Email Address/).fill("jordan@example.com");
  await page.getByRole("group", { name: "Preferred Contact Method" }).getByRole("radio", { name: "Email" }).check();
  await page.getByLabel(/Device Type/).selectOption({ label: "Laptop" });
  await page.getByLabel(/Brand/).fill("Lenovo");
  await page.getByLabel(/Service Needed/).selectOption({ label: "Laptop Diagnostic" });
  await page.getByLabel(/Describe the Problem/).fill("The laptop has become very slow and sometimes freezes.");
  await page.getByRole("group", { name: "Preferred service contact" }).getByRole("radio", { name: "Email" }).check();
}

test("customer can submit a real repair request", async ({ page }) => {
  await fillRequestForm(page, "555-0100");
  await page.getByRole("button", { name: "Submit Repair Request" }).click();

  await expect(page.getByRole("heading", { name: "Request Received" })).toBeVisible();
  await expect(page.getByText(/^SR-\d{4}-\d{6}$/)).toBeVisible();
  await expect(page.getByText("Your repair request has been submitted successfully.")).toBeVisible();
});

test("customer can submit a repair request with an attachment", async ({ page }) => {
  await fillRequestForm(page, "09171234567");
  await page.locator("#files").setInputFiles({
    name: "device-photo.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixpoint-test-attachment"),
  });
  await expect(page.getByText("device-photo.png")).toBeVisible();
  await page.getByRole("button", { name: "Submit Repair Request" }).click();

  await expect(page.getByRole("heading", { name: "Request Received" })).toBeVisible();
  await expect(page.getByText(/^SR-\d{4}-\d{6}$/)).toBeVisible();
  await expect(page.getByText(/attachments could not be uploaded/i)).not.toBeVisible();
});
