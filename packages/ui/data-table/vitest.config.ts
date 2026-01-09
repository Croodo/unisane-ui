import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import base from "../../../vitest.base";

export default mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
    test: {
      name: "data-table",
      root: __dirname,
      environment: "happy-dom",
      setupFiles: ["./src/__tests__/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.{test,spec}.{ts,tsx}",
          "src/__tests__/**",
          "src/**/index.ts",
          "src/types/**",
        ],
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        // Resolve @ui aliases for @unisane/ui peer dependency
        "@ui/lib/utils": resolve(__dirname, "../core/src/lib/utils"),
        "@ui/primitives": resolve(__dirname, "../core/src/primitives"),
      },
    },
  }),
);
