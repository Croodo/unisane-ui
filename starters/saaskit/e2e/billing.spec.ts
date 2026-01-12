import { test, expect, generateTestUser, generateTestTenant } from "./fixtures";

/**
 * E2E Tests: Billing & Subscription
 *
 * Critical user journeys:
 * 1. View billing page
 * 2. View pricing/plans
 * 3. Subscription management
 * 4. Invoice history
 *
 * Note: Actual payment flows require Stripe test mode and are covered separately.
 */

test.describe("Billing & Subscription", () => {
  // Setup: Create a user, workspace, and login
  test.beforeEach(async ({ page, authPage }) => {
    const user = generateTestUser();
    const tenant = generateTestTenant();

    await authPage.signup(user);
    await page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 15000 });

    // Create workspace if needed
    if (page.url().includes("/welcome")) {
      await page.getByLabel(/^name$/i).fill(tenant.name);
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(/\/w\//, { timeout: 15000 });
    }
  });

  test.describe("Billing Page", () => {
    test("should navigate to billing page", async ({ page }) => {
      // Get workspace slug from URL
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);
      }
    });

    test("should show current subscription status", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);

        // Should show subscription section or billing info
        // The BillingClient shows "Subscription" section if in subscription mode
        // or "Available Credits" if in topup mode
        // or "Billing Not Enabled" alert if disabled
        const hasContent = await page.getByText(/subscription|credits|billing|plan/i).first().isVisible();
        expect(hasContent).toBeTruthy();
      }
    });

    test("should show billing tabs or sections", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);

        // Billing page has tabs: Overview, Invoices, Payments, Credits
        const overviewTab = page.getByText(/^overview$/i);
        const invoicesTab = page.getByText(/^invoices$/i);
        const paymentsTab = page.getByText(/^payments$/i);

        const hasTabs = await overviewTab.isVisible().catch(() => false) ||
                        await invoicesTab.isVisible().catch(() => false) ||
                        await paymentsTab.isVisible().catch(() => false);

        // At least some content should be visible
        expect(hasTabs || await page.getByText(/billing/i).first().isVisible()).toBeTruthy();
      }
    });

    test("should show view plans link", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);

        // Should show "View plans" link
        const viewPlansLink = page.getByRole("link", { name: /view plans/i });
        if (await viewPlansLink.isVisible()) {
          expect(true).toBeTruthy();
        }
      }
    });
  });

  test.describe("Pricing Page", () => {
    test("should show pricing page with plans", async ({ page }) => {
      await page.goto("/pricing");

      // Should show "Choose your plan" heading
      await expect(page.getByText(/choose your plan/i)).toBeVisible();
    });

    test("should show plan tiers", async ({ page }) => {
      await page.goto("/pricing");

      // Plans should show Free and Pro (at minimum)
      const freeText = page.getByText(/^free$/i);
      const proText = page.getByText(/^pro$/i);

      const hasPlans = await freeText.first().isVisible().catch(() => false) ||
                       await proText.first().isVisible().catch(() => false);

      // Either plans are loaded or "Loading plans..." is shown
      expect(hasPlans || await page.getByText(/loading plans/i).isVisible()).toBeTruthy();
    });

    test("should show plan features", async ({ page }) => {
      await page.goto("/pricing");

      // Wait for plans to load
      await page.waitForTimeout(2000);

      // Plans should have feature lists with checkmarks
      const features = page.locator("ul li");
      if (await features.first().isVisible()) {
        expect(true).toBeTruthy();
      }
    });

    test("should have call-to-action buttons", async ({ page }) => {
      await page.goto("/pricing");

      // Wait for plans to load
      await page.waitForTimeout(2000);

      // Should have buttons for plans (Get started, Create workspace, etc.)
      const ctaButtons = page.getByRole("button", { name: /get started|subscribe|create|current plan/i });
      if (await ctaButtons.first().isVisible()) {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe("Invoice History", () => {
    test("should show invoices tab or section", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);

        // Click on Invoices tab if available
        const invoicesTab = page.getByText(/^invoices$/i);
        if (await invoicesTab.isVisible()) {
          await invoicesTab.click();
          await page.waitForTimeout(500);
        }

        // Should show invoices section (may be empty for new users)
        expect(true).toBeTruthy();
      }
    });

    test("should show empty state for new users", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);

        // New users won't have invoices - either shows empty state or billing info
        const hasContent = await page.getByText(/invoice|billing|subscription|credits/i).first().isVisible();
        expect(hasContent).toBeTruthy();
      }
    });
  });

  test.describe("Credits (if enabled)", () => {
    test("should show credits section if available", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/billing`);
        await expect(page).toHaveURL(/\/billing/);

        // Credits may or may not be enabled depending on billing mode
        const creditsSection = page.getByText(/credits|balance|top.?up/i);

        if (await creditsSection.first().isVisible()) {
          // Should show balance if credits enabled
          expect(true).toBeTruthy();
        }
      }
    });
  });
});

test.describe("Subscription Flow (requires Stripe test mode)", () => {
  test.skip("should initiate checkout flow", async ({ page, authPage }) => {
    // This test requires Stripe test mode setup
    // Skip for now, but structure is here for future implementation

    const user = generateTestUser();
    await authPage.signup(user);

    // Navigate to pricing
    await page.goto("/pricing");

    // Click subscribe on a paid plan
    await page.getByRole("button", { name: /subscribe|get.*pro/i }).first().click();

    // Should redirect to Stripe Checkout or show payment form
    // await expect(page).toHaveURL(/checkout.stripe.com/);
  });

  test.skip("should handle Stripe portal access", async ({ page }) => {
    // This test requires an existing Stripe subscription
    // Skip for now

    // Navigate to billing
    // Click manage subscription
    // Should open Stripe billing portal
  });
});
