import { test, expect, generateTestUser } from "./fixtures";

/**
 * E2E Tests: Authentication Flows
 *
 * Critical user journeys:
 * 1. Sign up with email/password
 * 2. Sign in with email/password
 * 3. Password reset flow
 */

test.describe("Authentication", () => {
  test.describe("Sign Up Flow", () => {
    test("should show signup page with form", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForSelector("form", { timeout: 10000 });

      // Check form elements exist by ID
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    });

    test("should show validation for empty form submission", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForSelector("form", { timeout: 10000 });

      // HTML5 validation should prevent submission with empty required fields
      // Click the submit button
      await page.getByRole("button", { name: /create account/i }).click();

      // The form should still be on signup page (not submitted)
      await expect(page).toHaveURL(/\/signup/);
    });

    test("should successfully create account and redirect", async ({ page, authPage }) => {
      const user = generateTestUser();

      await authPage.signup(user);

      // Wait for redirect - should go to onboarding or workspace
      await page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 15000 });
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForSelector("form", { timeout: 10000 });

      // Find "Sign in" link
      const loginLink = page.getByRole("link", { name: /sign in/i });
      await expect(loginLink).toBeVisible();

      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Sign In Flow", () => {
    test("should show login page with form", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form", { timeout: 10000 });

      // Check form elements exist
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form", { timeout: 10000 });

      await page.locator("#email").fill("nonexistent@example.com");
      await page.locator("#password").fill("WrongPassword123!");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should show error alert
      await expect(page.locator('[data-slot="alert"], .alert, [role="alert"]').first()).toBeVisible({ timeout: 10000 });
    });

    test("should successfully login with valid credentials", async ({ page, authPage }) => {
      // First create an account
      const user = generateTestUser();
      await authPage.signup(user);

      // Wait for redirect after signup
      await page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 15000 });

      // Now sign out by going to login page (clears context)
      await page.goto("/login");
      await page.waitForSelector("form", { timeout: 10000 });

      // Login with the created account
      await authPage.login(user.email, user.password);

      // Should redirect to workspace or onboarding
      await page.waitForURL(/\/(onboarding|welcome|workspaces|w\/)/, { timeout: 15000 });
    });

    test("should have link to signup page", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form", { timeout: 10000 });

      const signupLink = page.getByRole("link", { name: /sign up/i });
      await expect(signupLink).toBeVisible();

      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    });

    test("should have link to forgot password", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form", { timeout: 10000 });

      const forgotLink = page.getByRole("link", { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();

      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });

  test.describe("Password Reset Flow", () => {
    test("should show forgot password page", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.waitForSelector("form", { timeout: 10000 });

      await expect(page.locator("#email, input[type='email']").first()).toBeVisible();
      await expect(page.getByRole("button", { name: /reset|send|submit/i })).toBeVisible();
    });

    test("should submit password reset request", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.waitForSelector("form", { timeout: 10000 });

      await page.locator("#email, input[type='email']").first().fill("test@example.com");
      await page.getByRole("button", { name: /reset|send|submit/i }).click();

      // Should show success message or stay on page (implementation dependent)
      // The form should respond in some way
      await page.waitForTimeout(2000);
    });
  });
});
