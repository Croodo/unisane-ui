import { config } from "./packages/tooling/eslint-config/base.js";

export default [
  ...config,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
];
