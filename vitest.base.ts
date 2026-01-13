import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TS_BASE = resolve(ROOT, "tsconfig.json");

export default defineConfig({
  resolve: { conditions: ["node", "import"] },
  test: {
    name: "unisane",
    globals: true,
    // Don't set environment here - let each package specify its own
    // Most packages use 'node', but UI packages like data-table need 'happy-dom'
    passWithNoTests: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "**/dist/**",
        "**/node_modules/**",
        "**/.turbo/**",
        "**/starters/**",
      ],
    },
    exclude: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
});
