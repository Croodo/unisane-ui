import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ["node", "import"],
    alias: {
      "@": resolve(__dirname, "./src"),
      // Resolve @ui aliases for @unisane/ui peer dependency
      "@ui/lib/utils": resolve(__dirname, "../core/src/lib/utils"),
      "@ui/primitives": resolve(__dirname, "../core/src/primitives"),
    },
  },
  test: {
    name: "data-table",
    root: __dirname,
    globals: true,
    environment: "happy-dom", // MUST use happy-dom for React/DOM tests
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/__tests__/**",
        "src/**/index.ts",
        "src/types/**",
        "**/dist/**",
        "**/node_modules/**",
        "**/.turbo/**",
      ],
    },
    exclude: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
});
