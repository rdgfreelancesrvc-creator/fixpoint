import { test, expect } from "@playwright/test";

test("desktop homepage navigation reaches the public destinations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your Device\. Fixed Right\./ })).toBeVisible();

  await page.getByRole("link", { name: "Learn more" }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /A clearer way to get your device/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });

  await primaryNavigation.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/#services$/);
  await expect(page.getByRole("heading", { name: /Reliable solutions for the devices/ })).toBeVisible();

  await primaryNavigation.getByRole("link", { name: "How It Works" }).click();
  await expect(page).toHaveURL(/\/#how-it-works$/);
  await expect(page.getByRole("heading", { name: /A clear path from/ })).toBeVisible();

  await primaryNavigation.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /A clearer way to get your device/ })).toBeVisible();

  await primaryNavigation.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.getByRole("heading", { name: /Have a question/ })).toBeVisible();

  await page.getByRole("link", { name: "Track My Repair" }).first().click();
  await expect(page).toHaveURL(/\/track$/);
  await expect(page.getByRole("heading", { name: /Track My Repair/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/#contact$/);

  await page.getByRole("link", { name: "Staff Login" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/#contact$/);

  await page.getByRole("link", { name: "Request a Repair" }).first().click();
  await expect(page).toHaveURL(/\/request$/);
  await expect(page.getByRole("heading", { name: /Request a Repair/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/#contact$/);

  await page.getByRole("link", { name: "FixPoint home" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Your Device\. Fixed Right\./ })).toBeVisible();

  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/#services$/);
  await footer.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: /A clearer way to get your device/ })).toBeVisible();
  await footer.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/#contact$/);
  await footer.getByRole("link", { name: /Staff Login/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/#contact$/);
  await footer.getByRole("link", { name: "FixPoint home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("mobile homepage menu reaches its public destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/#services$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Track My Repair" }).click();
  await expect(page).toHaveURL(/\/track$/);
  await expect(page.getByRole("heading", { name: /Track My Repair/ })).toBeVisible();
  await page.goBack();

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Staff Login" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goBack();

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Request a Repair" }).click();
  await expect(page).toHaveURL(/\/request$/);
  await expect(page.getByRole("heading", { name: /Request a Repair/ })).toBeVisible();
});
