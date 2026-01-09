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
    environment: "node",
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
