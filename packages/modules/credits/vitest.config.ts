import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base from "../../../vitest.base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "credits",
      root: __dirname,
      environment: "node",
      include: ["src/**/*.{test,spec}.ts"],
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  })
);
