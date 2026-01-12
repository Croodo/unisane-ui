import { test as base, expect, type Page } from "@playwright/test";

/**
 * E2E Test Fixtures
 *
 * Extended Playwright test with custom fixtures for:
 * - Authenticated user sessions
 * - Test data generation
 * - Common page objects
 */

// Test data types
export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

export interface TestTenant {
  name: string;
  slug: string;
}

// Generate unique test data
export function generateTestUser(prefix = "e2e"): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `${prefix}-${timestamp}-${random}@test.local`,
    password: "TestPassword123!",
    displayName: `Test User ${timestamp}`,
  };
}

export function generateTestTenant(prefix = "e2e"): TestTenant {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    name: `Test Workspace ${timestamp}`,
    slug: `${prefix}-${timestamp}-${random}`.toLowerCase(),
  };
}

// Page Object helpers
export class AuthPage {
  constructor(private page: Page) {}

  async goto(path: "login" | "signup" = "login") {
    await this.page.goto(`/${path}`);
    // Wait for form to be visible
    await this.page.waitForSelector('form', { timeout: 10000 });
  }

  async fillEmail(email: string) {
    // The label is "Email address" with htmlFor="email"
    await this.page.locator('#email').fill(email);
  }

  async fillPassword(password: string) {
    // The label is "Password" with htmlFor="password"
    await this.page.locator('#password').fill(password);
  }

  async submitLogin() {
    // Button text is "Sign in" or "Signing in…"
    await this.page.getByRole("button", { name: /sign in/i }).click();
  }

  async submitSignup() {
    // Button text is "Create account" or "Creating…"
    await this.page.getByRole("button", { name: /create account/i }).click();
  }

  async login(email: string, password: string) {
    await this.goto("login");
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  async signup(user: TestUser) {
    await this.goto("signup");
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.submitSignup();
    // Wait for navigation away from signup page - the API call may take time
    // First wait to leave /signup, then wait for final destination
    await this.page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 30000 });
    // Now wait for final destination
    await this.page.waitForURL(/\/(onboarding|welcome|workspaces|w\/|login)/, { timeout: 30000 });

    // If redirected to login (session cookie not ready), re-login with the same credentials
    if (this.page.url().includes("/login")) {
      await this.page.waitForSelector('form', { timeout: 10000 });
      await this.fillEmail(user.email);
      await this.fillPassword(user.password);
      await this.submitLogin();
      // Wait for final destination
      await this.page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 30000 });
    }
  }

  async expectLoggedIn() {
    // Should redirect away from auth pages when logged in
    await expect(this.page).not.toHaveURL(/\/(login|signup)/);
  }

  async expectLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
  }
}

export class WorkspacePage {
  constructor(private page: Page) {}

  async goto(slug: string, path = "") {
    await this.page.goto(`/w/${slug}${path ? `/${path}` : ""}`);
  }

  async gotoDashboard(slug: string) {
    await this.goto(slug, "dashboard");
  }

  async gotoSettings(slug: string) {
    await this.goto(slug, "settings");
  }

  async gotoBilling(slug: string) {
    await this.goto(slug, "billing");
  }

  async gotoTeam(slug: string) {
    await this.goto(slug, "team");
  }

  async gotoApiKeys(slug: string) {
    await this.goto(slug, "apikeys");
  }

  async gotoAudit(slug: string) {
    await this.goto(slug, "audit");
  }

  async expectOnDashboard(slug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/w/${slug}(/dashboard)?`));
  }
}

export class OnboardingPage {
  constructor(private page: Page) {}

  async expectOnWelcome() {
    await expect(this.page).toHaveURL(/\/welcome/);
  }

  async expectOnWorkspaces() {
    await expect(this.page).toHaveURL(/\/workspaces/);
  }

  async createWorkspace(name: string) {
    // Fill workspace name
    await this.page.getByLabel(/name|workspace/i).fill(name);
    // Submit
    await this.page.getByRole("button", { name: /create|continue/i }).click();
  }

  async selectWorkspace(slugOrName: string) {
    await this.page.getByText(slugOrName, { exact: false }).click();
  }
}

// Extended test with fixtures
type Fixtures = {
  authPage: AuthPage;
  workspacePage: WorkspacePage;
  onboardingPage: OnboardingPage;
  testUser: TestUser;
  testTenant: TestTenant;
};

export const test = base.extend<Fixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  workspacePage: async ({ page }, use) => {
    await use(new WorkspacePage(page));
  },

  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },

  testUser: async ({}, use) => {
    await use(generateTestUser());
  },

  testTenant: async ({}, use) => {
    await use(generateTestTenant());
  },
});

export { expect } from "@playwright/test";

// Storage state file for authenticated sessions
export const STORAGE_STATE_PATH = "e2e/.auth/user.json";

// Common test timeouts
export const TIMEOUTS = {
  navigation: 10_000,
  action: 5_000,
  assertion: 5_000,
} as const;
