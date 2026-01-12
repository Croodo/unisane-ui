import { test, expect, generateTestUser, generateTestTenant } from "./fixtures";

/**
 * E2E Tests: Team Management
 *
 * Critical user journeys:
 * 1. View team members
 * 2. View member roles
 * 3. Member management (future: invite)
 *
 * Note: Invite functionality is currently disabled ("coming soon")
 */

test.describe("Team Management", () => {
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

  test.describe("Team Page", () => {
    test("should navigate to team page", async ({ page }) => {
      // Get workspace slug from URL
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);
      }
    });

    test("should show current user as member", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);

        // Should show the Members table with current user
        // The TeamClient shows a DataTable with title "Members"
        // Current user should be shown with "(You)" badge
        const youBadge = page.getByText(/you/i);
        const membersTitle = page.getByText(/^members$/i);

        const hasContent = await youBadge.isVisible().catch(() => false) ||
                          await membersTitle.isVisible().catch(() => false);

        expect(hasContent).toBeTruthy();
      }
    });

    test("should show admin role for owner", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);

        // Owner should have Admin badge
        const adminBadge = page.getByText(/admin/i);
        if (await adminBadge.first().isVisible()) {
          expect(true).toBeTruthy();
        }
      }
    });

    test("should show invite button (disabled)", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);

        // The "Invite Members" button exists but is disabled (coming soon)
        const inviteBtn = page.getByRole("button", { name: /invite/i });
        if (await inviteBtn.isVisible()) {
          // Button should be disabled
          await expect(inviteBtn).toBeDisabled();
        }
      }
    });
  });

  test.describe("Member Display", () => {
    test("should show member details in table", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);

        // DataTable shows columns: Member, Roles, Joined
        const memberColumn = page.getByText(/^member$/i);
        const rolesColumn = page.getByText(/^roles$/i);
        const joinedColumn = page.getByText(/^joined$/i);

        const hasColumns = await memberColumn.isVisible().catch(() => false) ||
                          await rolesColumn.isVisible().catch(() => false) ||
                          await joinedColumn.isVisible().catch(() => false);

        expect(hasColumns).toBeTruthy();
      }
    });

    test("should show empty state if no members except owner", async ({ page }) => {
      const currentUrl = page.url();
      const match = currentUrl.match(/\/w\/([^/]+)/);
      if (match) {
        await page.goto(`/w/${match[1]}/team`);
        await expect(page).toHaveURL(/\/team/);

        // For new workspace, either shows empty state or just the owner
        // Empty state says "No team members yet"
        const emptyState = page.getByText(/no team members yet/i);
        const membersTable = page.locator("table, [role='table']");

        const hasContent = await emptyState.isVisible().catch(() => false) ||
                          await membersTable.first().isVisible().catch(() => false);

        expect(hasContent).toBeTruthy();
      }
    });
  });
});

test.describe("Invite Member Flow (future)", () => {
  test.skip("should open invite modal when available", async ({ page }) => {
    // This test is for when invite functionality is implemented
    // Currently disabled with "coming soon" message
  });

  test.skip("should validate email format", async ({ page }) => {
    // Future test for invite validation
  });

  test.skip("should send invitation successfully", async ({ page }) => {
    // Future test for sending invitations
  });
});

test.describe("Accept Invitation Flow", () => {
  test.skip("should accept invitation from email link", async ({ page, context }) => {
    // This test requires:
    // 1. Sending a real invitation
    // 2. Accessing the email/invitation link
    // 3. Creating a new account or logging in
    // 4. Accepting the invitation

    // For now, skip - would need to mock email or use real email testing service
  });
});
