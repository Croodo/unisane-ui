import { test as teardown } from "@playwright/test";

/**
 * Global Teardown - Runs once after all tests
 *
 * Use this for:
 * - Cleaning up test data
 * - Closing connections
 */
teardown("global teardown", async () => {
  console.log("[E2E Teardown] Cleaning up...");

  // Note: Add cleanup logic here if needed
  // For now, we leave the test data for debugging

  console.log("[E2E Teardown] Complete");
});
