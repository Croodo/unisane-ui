import { config } from "./packages/eslint-config/base.js";

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
