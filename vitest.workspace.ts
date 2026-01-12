import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // Auto-discover all vitest configs in packages
  "packages/**/vitest.config.ts",
]);
