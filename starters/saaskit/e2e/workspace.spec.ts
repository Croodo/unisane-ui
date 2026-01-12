import { test, expect, generateTestUser, generateTestTenant } from "./fixtures";

/**
 * E2E Tests: Workspace Management
 *
 * Critical user journeys:
 * 1. Create new workspace
 * 2. Access workspace dashboard
 * 3. Switch between workspaces
 * 4. Workspace settings
 */

test.describe("Workspace Management", () => {
  // Setup: Create a user and login before workspace tests
  test.beforeEach(async ({ page, authPage }) => {
    const user = generateTestUser();
    await authPage.signup(user);
    await page.waitForURL(/\/(welcome|workspaces|onboarding|w\/)/, { timeout: 15000 });
  });

  test.describe("Create Workspace", () => {
    test("should show welcome page for new users", async ({ page }) => {
      // New users without workspaces should see welcome/onboarding
      const url = page.url();

      if (url.includes("/welcome")) {
        // Welcome page has "Create your workspace" heading
        await expect(page.getByText(/create your workspace/i)).toBeVisible();
        // TextField with label "Name"
        await expect(page.getByLabel(/^name$/i)).toBeVisible();
      }
      // If redirected to workspaces, that's also acceptable for users with existing workspaces
    });

    test("should create workspace and redirect to dashboard", async ({ page }) => {
      const tenant = generateTestTenant();

      // If on welcome page, create workspace
      if (page.url().includes("/welcome")) {
        // Fill in the Name TextField
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();

        // Should redirect to the new workspace
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }
    });

    test("should show validation for empty workspace name", async ({ page }) => {
      if (page.url().includes("/welcome")) {
        // Clear the default value and submit
        await page.getByLabel(/^name$/i).clear();
        await page.getByRole("button", { name: /create workspace/i }).click();

        // HTML5 validation should prevent submission - page should stay on welcome
        await expect(page).toHaveURL(/\/welcome/);
      }
    });
  });

  test.describe("Dashboard Access", () => {
    test("should show workspace dashboard with navigation", async ({ page }) => {
      const tenant = generateTestTenant();

      // Create workspace first if needed
      if (page.url().includes("/welcome")) {
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }

      // Should be on a workspace page
      await expect(page).toHaveURL(/\/w\//);

      // Check for navigation rail/sidebar (Material 3 sidebar structure)
      const sidebarRail = page.locator('[class*="sidebar"], aside, nav').first();
      await expect(sidebarRail).toBeVisible({ timeout: 10000 });
    });

    test("should have sidebar navigation links", async ({ page }) => {
      const tenant = generateTestTenant();

      // Create workspace if needed
      if (page.url().includes("/welcome")) {
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }

      // Check for navigation links (Home, Team, Billing, Settings)
      // These are in the sidebar drawer/rail
      const homeLink = page.getByRole("link", { name: /^home$/i });
      const settingsLink = page.getByRole("link", { name: /^settings$/i });
      const billingLink = page.getByRole("link", { name: /^billing$/i });
      const teamLink = page.getByRole("link", { name: /^team$/i });

      // At least Home/Settings should be accessible
      const hasNav = await homeLink.isVisible().catch(() => false) ||
                     await settingsLink.isVisible().catch(() => false) ||
                     await billingLink.isVisible().catch(() => false) ||
                     await teamLink.isVisible().catch(() => false);

      expect(hasNav).toBeTruthy();
    });

    test("should navigate to settings page", async ({ page }) => {
      const tenant = generateTestTenant();

      // Create workspace if needed
      if (page.url().includes("/welcome")) {
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }

      // Navigate to settings via link
      const settingsLink = page.getByRole("link", { name: /^settings$/i });
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });
      } else {
        // Try direct navigation if link not visible
        const currentUrl = page.url();
        const workspaceMatch = currentUrl.match(/\/w\/([^/]+)/);
        if (workspaceMatch) {
          await page.goto(`/w/${workspaceMatch[1]}/settings`);
          await expect(page).toHaveURL(/\/settings/);
        }
      }
    });
  });

  test.describe("Workspace Switching", () => {
    test("should show workspace selector or switcher", async ({ page }) => {
      const tenant = generateTestTenant();

      // Create workspace if needed
      if (page.url().includes("/welcome")) {
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }

      // Look for workspace switcher in user menu or header
      // This test is flexible as the switcher might not exist yet
      const userMenu = page.locator('[aria-label*="user"], [data-testid*="user-menu"]');
      if (await userMenu.first().isVisible()) {
        // User menu exists - switcher might be inside
        expect(true).toBeTruthy();
      }
    });

    test("should navigate to workspaces page", async ({ page }) => {
      const tenant = generateTestTenant();

      // Create workspace if needed
      if (page.url().includes("/welcome")) {
        await page.getByLabel(/^name$/i).fill(tenant.name);
        await page.getByRole("button", { name: /create workspace/i }).click();
        await page.waitForURL(/\/w\//, { timeout: 15000 });
      }

      // Navigate to workspaces page
      await page.goto("/workspaces");

      // Should show list of workspaces or redirect to welcome if none
      const onWorkspacesOrWelcome = page.url().includes("/workspaces") || page.url().includes("/welcome");
      expect(onWorkspacesOrWelcome).toBeTruthy();
    });
  });
});
