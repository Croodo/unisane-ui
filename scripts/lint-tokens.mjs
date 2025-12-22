#!/usr/bin/env node

import { promises as fs } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

// Simple color functions since chalk might not be available
const colors = {
  bold: (str) => `\x1b[1m${str}\x1b[22m`,
  red: (str) => `\x1b[31m${str}\x1b[39m`,
  yellow: (str) => `\x1b[33m${str}\x1b[39m`,
  gray: (str) => `\x1b[90m${str}\x1b[39m`,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Forbidden patterns that indicate token impurity
const forbiddenPatterns = [
  {
    pattern: /#[0-9a-fA-F]{3,6}/g,
    message: "Raw hex colors found. Use CSS custom properties instead.",
  },
  {
    pattern: /rgb\(/g,
    message: "Raw rgb() values found. Use CSS custom properties instead.",
  },
  {
    pattern: /rgba\(/g,
    message: "Raw rgba() values found. Use CSS custom properties instead.",
  },
  {
    pattern: /hsl\(/g,
    message: "Raw hsl() values found. Use CSS custom properties instead.",
  },
  {
    pattern: /oklch\([^)]+\)/g,
    message:
      "Raw oklch() values found in components. Only allowed in token files.",
  },
  {
    pattern: /box-shadow:\s*[^;]+;/g,
    message: "Raw box-shadow values found. Use elevation tokens instead.",
  },
  {
    pattern: /border-radius:\s*[^;]+;/g,
    message: "Raw border-radius values found. Use shape tokens instead.",
  },
  {
    pattern: /font-size:\s*[^;]+;/g,
    message: "Raw font-size values found. Use typography tokens instead.",
  },
  {
    pattern: /font-weight:\s*[^;]+;/g,
    message: "Raw font-weight values found. Use typography tokens instead.",
  },
  {
    pattern: /padding:\s*[^;]+;/g,
    message: "Raw padding values found. Use spacing tokens instead.",
  },
  {
    pattern: /margin:\s*[^;]+;/g,
    message: "Raw margin values found. Use spacing tokens instead.",
  },
  {
    pattern: /width:\s*[^;]+px[^;]*;/g,
    message:
      "Raw pixel width values found. Use spacing tokens or relative units.",
  },
  {
    pattern: /height:\s*[^;]+px[^;]*;/g,
    message:
      "Raw pixel height values found. Use spacing tokens or relative units.",
  },
];

// Allowed exceptions (files that can contain raw values)
const allowedExceptions = [
  "uni-tokens.css",
  "uni-theme.css",
  "ref.json",
  "build.mjs",
  "sync-registry.mjs",
  "lint-tokens.mjs",
  "turborepo-logo.tsx", // Demo/logo component with SVG gradients
  "page.tsx", // Documentation pages with code examples
];

// Check if a file is allowed to have raw values
function isAllowedException(filePath) {
  return allowedExceptions.some((exception) => filePath.endsWith(exception));
}

// Lint a single file
async function lintFile(filePath) {
  if (isAllowedException(filePath)) {
    return [];
  }

  const content = await fs.readFile(filePath, "utf-8");
  const errors = [];

  for (const { pattern, message } of forbiddenPatterns) {
    const matches = content.match(pattern);

    if (matches) {
      // Get line numbers for each match
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.test(line)) {
          errors.push({
            file: filePath,
            line: i + 1,
            message,
            match: line.trim(),
          });
        }
      }
    }
  }

  return errors;
}

// Recursively find all relevant files
async function findFiles(dir, extensions = [".tsx", ".ts", ".css"]) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (
          !["node_modules", "dist", ".next", ".git", "coverage"].includes(
            entry.name
          )
        ) {
          files.push(...(await findFiles(fullPath, extensions)));
        }
      } else if (
        entry.isFile() &&
        extensions.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  return files;
}

// Main lint function
async function lintTokens() {
  console.log("🔍 Linting for token purity...\n");

  const packagesDir = join(rootDir, "packages");
  const registryDir = join(rootDir, "registry");
  const appsDir = join(rootDir, "apps");

  const allFiles = [
    ...(await findFiles(packagesDir)),
    ...(await findFiles(registryDir)),
    ...(await findFiles(appsDir)),
  ];

  const allErrors = [];

  for (const file of allFiles) {
    const errors = await lintFile(file);
    allErrors.push(...errors);
  }

  if (allErrors.length === 0) {
    console.log("✅ No token purity violations found!");
    return;
  }

  console.log(`❌ Found ${allErrors.length} token purity violations:\n`);

  // Group errors by file
  const errorsByFile = allErrors.reduce((acc, error) => {
    if (!acc[error.file]) {
      acc[error.file] = [];
    }
    acc[error.file].push(error);
    return acc;
  }, {});

  for (const [file, errors] of Object.entries(errorsByFile)) {
    console.log(colors.bold(relative(rootDir, file)));

    for (const error of errors) {
      console.log(`  Line ${error.line}: ${error.message}`);
      console.log(colors.gray(`    ${error.match}`));
    }

    console.log();
  }

  console.log(colors.red("Token purity check failed!"));
  console.log(
    colors.yellow(
      "Please use CSS custom properties and tokens instead of raw values."
    )
  );
  process.exit(1);
}

// Run lint
lintTokens().catch((error) => {
  console.error("Linting failed:", error);
  process.exit(1);
});
