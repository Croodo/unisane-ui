import { test as setup } from "@playwright/test";

/**
 * Global Setup - Runs once before all tests
 *
 * Use this for:
 * - Database seeding
 * - Creating test users
 * - Any one-time setup
 */
setup("global setup", async () => {
  console.log("[E2E Setup] Starting global setup...");

  // Note: For now, we assume the dev server handles database seeding.
  // In a production test setup, you would:
  // 1. Connect to a test database
  // 2. Seed test data
  // 3. Create test users

  console.log("[E2E Setup] Global setup complete");
});
