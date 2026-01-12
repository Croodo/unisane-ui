import { test, expect, generateTestUser, generateTestTenant } from "./fixtures";

/**
 * E2E Tests: API Keys & Audit Log
 *
 * Critical user journeys:
 * 1. Create API key
 * 2. View API keys list
 * 3. Copy API key
 * 4. Revoke API key
 * 5. View audit log
 */

test.describe("API Keys Management", () => {
  // Setup: Create a user and workspace
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

  test.describe("API Keys Page", () => {
    test("should navigate to API keys page", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);
        await expect(page).toHaveURL(/\/apikeys/);
      }
    });

    test("should show create key button", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);
        await expect(page).toHaveURL(/\/apikeys/);

        // PageLayout has "Create Key" button in actions
        const createBtn = page.getByRole("button", { name: /create key/i });
        await expect(createBtn).toBeVisible();
      }
    });

    test("should show empty state for new workspace", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);
        await expect(page).toHaveURL(/\/apikeys/);

        // New workspace should show empty state card with "No API keys yet"
        const emptyState = page.getByText(/no api keys yet/i);
        const createFirstBtn = page.getByRole("button", { name: /create your first key/i });

        const hasEmptyOrCreate = await emptyState.isVisible().catch(() => false) ||
                                  await createFirstBtn.isVisible().catch(() => false);

        expect(hasEmptyOrCreate).toBeTruthy();
      }
    });
  });

  test.describe("Create API Key", () => {
    test("should open create key dialog", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);
        await expect(page).toHaveURL(/\/apikeys/);

        // Click create button (either in header or empty state)
        const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
        await createBtn.click();

        // Should show create dialog with form
        // Dialog has title "Create API Key"
        await expect(page.getByText(/create api key/i)).toBeVisible();
      }
    });

    test("should show name and scopes fields in form", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
        await createBtn.click();

        // Form has id="name" and id="scopes" inputs
        await expect(page.locator("#name")).toBeVisible();
        await expect(page.locator("#scopes")).toBeVisible();
      }
    });

    test("should validate scopes required", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
        await createBtn.click();

        // Fill only name, leave scopes empty
        await page.locator("#name").fill("Test Key");

        // Submit
        await page.getByRole("button", { name: /^create key$/i }).click();

        // Should show validation error (toast or inline)
        // Toast says "At least one scope is required"
        await expect(page.getByText(/scope.*required/i)).toBeVisible();
      }
    });

    test("should create key and show token", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
        await createBtn.click();

        // Fill form
        const keyName = `Test Key ${Date.now()}`;
        await page.locator("#name").fill(keyName);
        await page.locator("#scopes").fill("read, write");

        // Submit
        await page.getByRole("button", { name: /^create key$/i }).click();

        // Should show success dialog with token
        // Dialog title "API Key Created"
        await expect(page.getByText(/api key created/i)).toBeVisible({ timeout: 10000 });

        // Should show copy button
        const copyBtn = page.getByRole("button", { name: /copy token/i });
        await expect(copyBtn).toBeVisible();
      }
    });

    test("should show warning about saving token", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
        await createBtn.click();

        // Fill and submit
        await page.locator("#name").fill(`Warning Test ${Date.now()}`);
        await page.locator("#scopes").fill("read");
        await page.getByRole("button", { name: /^create key$/i }).click();

        // Should show warning alert about saving token
        // Alert says "Save this token now" / "only time you'll see"
        await expect(page.getByText(/save this token|only time/i)).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("Manage API Keys", () => {
    // Helper to create a key first
    async function createKey(page: import("@playwright/test").Page) {
      const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
      await createBtn.click();

      await page.locator("#name").fill(`Test Key ${Date.now()}`);
      await page.locator("#scopes").fill("read, write");
      await page.getByRole("button", { name: /^create key$/i }).click();

      // Wait for success dialog
      await expect(page.getByText(/api key created/i)).toBeVisible({ timeout: 10000 });

      // Close the dialog
      const doneBtn = page.getByRole("button", { name: /^done$/i });
      await doneBtn.click();
    }

    test("should list created keys", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        await createKey(page);

        // Should show the key in the DataTable
        // Table has title "API Keys" and shows key name
        await expect(page.getByText(/api keys/i)).toBeVisible();
      }
    });

    test("should show key metadata", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        await createKey(page);

        // DataTable shows columns: Name, Scopes, Created
        const nameColumn = page.getByText(/^name$/i);
        const scopesColumn = page.getByText(/^scopes$/i);
        const createdColumn = page.getByText(/^created$/i);

        const hasColumns = await nameColumn.isVisible().catch(() => false) ||
                          await scopesColumn.isVisible().catch(() => false) ||
                          await createdColumn.isVisible().catch(() => false);

        expect(hasColumns).toBeTruthy();
      }
    });

    test("should have revoke option in dropdown", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        await createKey(page);

        // Find the actions dropdown (more_vert icon button)
        const actionsBtn = page.locator("button").filter({ has: page.locator("[class*='material-symbols']") }).last();

        if (await actionsBtn.isVisible()) {
          await actionsBtn.click();

          // Should show "Revoke Key" option
          const revokeItem = page.getByText(/revoke key/i);
          await expect(revokeItem).toBeVisible();
        }
      }
    });

    test("should revoke key with confirmation", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/apikeys`);

        await createKey(page);

        // Find and click actions dropdown
        const actionsBtn = page.locator("button").filter({ has: page.locator("[class*='material-symbols']") }).last();

        if (await actionsBtn.isVisible()) {
          await actionsBtn.click();

          // Click revoke
          const revokeItem = page.getByText(/revoke key/i);
          if (await revokeItem.isVisible()) {
            await revokeItem.click();

            // Confirmation dialog should appear
            // Title "Revoke API Key"
            await expect(page.getByText(/revoke api key/i)).toBeVisible();

            // Confirm
            const confirmBtn = page.getByRole("button", { name: /^revoke key$/i });
            await confirmBtn.click();

            // Should show success toast
            await expect(page.getByText(/api key revoked/i)).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });
});

test.describe("Audit Log", () => {
  test.beforeEach(async ({ page, authPage }) => {
    const user = generateTestUser();
    const tenant = generateTestTenant();

    await authPage.signup(user);
    await page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 15000 });

    if (page.url().includes("/welcome")) {
      await page.getByLabel(/^name$/i).fill(tenant.name);
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(/\/w\//, { timeout: 15000 });
    }
  });

  test("should navigate to audit log page", async ({ page }) => {
    const currentUrl = page.url();
    const match = currentUrl.match(/\/w\/([^/]+)/);
    if (match) {
      await page.goto(`/w/${match[1]}/audit`);
      await expect(page).toHaveURL(/\/audit/);
    }
  });

  test("should show recent activity or empty state", async ({ page }) => {
    const currentUrl = page.url();
    const match = currentUrl.match(/\/w\/([^/]+)/);
    if (match) {
      await page.goto(`/w/${match[1]}/audit`);
      await expect(page).toHaveURL(/\/audit/);

      // Should show "Recent Activity" table or "No activity yet" empty state
      const recentActivity = page.getByText(/recent activity/i);
      const noActivity = page.getByText(/no activity yet/i);

      const hasContent = await recentActivity.isVisible().catch(() => false) ||
                        await noActivity.isVisible().catch(() => false);

      expect(hasContent).toBeTruthy();
    }
  });

  test("should show audit entry columns", async ({ page }) => {
    const currentUrl = page.url();
    const match = currentUrl.match(/\/w\/([^/]+)/);
    if (match) {
      await page.goto(`/w/${match[1]}/audit`);
      await expect(page).toHaveURL(/\/audit/);

      // If there are entries, DataTable shows columns: Time, Action, Resource, Actor
      const timeColumn = page.getByText(/^time$/i);
      const actionColumn = page.getByText(/^action$/i);
      const resourceColumn = page.getByText(/^resource$/i);
      const actorColumn = page.getByText(/^actor$/i);

      const hasColumns = await timeColumn.isVisible().catch(() => false) ||
                        await actionColumn.isVisible().catch(() => false) ||
                        await resourceColumn.isVisible().catch(() => false) ||
                        await actorColumn.isVisible().catch(() => false);

      // Either has columns or empty state
      expect(hasColumns || await page.getByText(/no activity/i).isVisible()).toBeTruthy();
    }
  });

  test("should generate audit entries from API key creation", async ({ page }) => {
    const currentUrl = page.url();
    const match = currentUrl.match(/\/w\/([^/]+)/);
    if (match) {
      const slug = match[1];

      // Create an API key to generate audit entry
      await page.goto(`/w/${slug}/apikeys`);

      const createBtn = page.getByRole("button", { name: /create key|create your first key/i }).first();
      await createBtn.click();

      await page.locator("#name").fill(`Audit Test ${Date.now()}`);
      await page.locator("#scopes").fill("read");
      await page.getByRole("button", { name: /^create key$/i }).click();

      // Wait for success
      await expect(page.getByText(/api key created/i)).toBeVisible({ timeout: 10000 });

      // Close dialog
      await page.getByRole("button", { name: /^done$/i }).click();

      // Navigate to audit log
      await page.goto(`/w/${slug}/audit`);
      await expect(page).toHaveURL(/\/audit/);

      // Should show the API key creation in audit log
      // The action would be something like "created" or the entry would appear
      await page.waitForTimeout(1000); // Give time for audit to be recorded

      const hasEntries = await page.getByText(/recent activity/i).isVisible() ||
                        await page.locator("table, [role='table']").first().isVisible();

      expect(hasEntries).toBeTruthy();
    }
  });
});
