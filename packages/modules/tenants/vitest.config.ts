import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base from "../../../vitest.base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "tenants",
      root: __dirname,
      include: ["src/**/*.{test,spec}.ts"],
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  })
);
