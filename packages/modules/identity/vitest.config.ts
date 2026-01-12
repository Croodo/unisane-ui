import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base from "../../../vitest.base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "identity",
      root: __dirname,
      include: ["src/**/*.{test,spec}.ts", "__tests__/**/*.{test,spec}.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        include: ["src/**/*.ts"],
        exclude: [
          "src/**/*.{test,spec}.ts",
          "src/__tests__/**",
          "src/**/index.ts",
          "src/client.ts",
        ],
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  }),
);
