#!/usr/bin/env node

/**
 * Unisane UI Registry Validator
 *
 * This script validates the registry to detect:
 * 1. Component drift (src/ and registry/ out of sync)
 * 2. Unrewritten @ui/* imports in registry files
 * 3. Missing components in registry
 * 4. Orphaned files in registry not in src
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const registryDir = path.join(rootDir, "registry");

// Track validation results
const results = {
  errors: [],
  warnings: [],
  info: [],
};

function error(msg) {
  results.errors.push(msg);
}

function warn(msg) {
  results.warnings.push(msg);
}

function info(msg) {
  results.info.push(msg);
}

/**
 * Normalize content for comparison by stripping:
 * - Whitespace differences
 * - Import path differences (@ui/* vs @/*)
 */
function normalizeForComparison(content, isRegistry = false) {
  let normalized = content;

  // If it's a src file, rewrite @ui/* to @/* like the build script does
  if (!isRegistry) {
    normalized = normalized
      .replace(/from\s+["']@ui\/lib\/([^"']+)["']/g, 'from "@/lib/$1"')
      .replace(
        /from\s+["']@ui\/components\/([^"']+)["']/g,
        'from "@/components/ui/$1"'
      )
      .replace(
        /from\s+["']@ui\/primitives\/([^"']+)["']/g,
        'from "@/primitives/$1"'
      )
      .replace(/from\s+["']@ui\/layout\/([^"']+)["']/g, 'from "@/layout/$1"')
      .replace(/from\s+["']@ui\/hooks\/([^"']+)["']/g, 'from "@/hooks/$1"')
      .replace(/from\s+["']@ui\/([^"']+)["']/g, 'from "@/$1"');
  }

  // Normalize whitespace for comparison
  return normalized.trim();
}

/**
 * Get hash of normalized content for quick comparison
 */
function getContentHash(content) {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dir, basePath = "") {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(basePath, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        // Skip index files for comparison purposes
        if (entry.name !== "index.ts" && entry.name !== "index.tsx") {
          files.push(relativePath);
        } else {
          // Still track index files but separately
          files.push(relativePath);
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

/**
 * Check for unrewritten @ui/* imports in registry files
 */
async function checkUnrewrittenImports() {
  console.log("\n🔍 Checking for unrewritten @ui/* imports...\n");

  const folders = ["components", "primitives", "layout", "lib", "hooks"];
  let unrewrittenCount = 0;

  for (const folder of folders) {
    const folderPath = path.join(registryDir, folder);
    const files = await getAllFiles(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      try {
        const content = await fs.readFile(filePath, "utf-8");

        // Check for any remaining @ui/ imports
        const uiImportRegex = /from\s+["']@ui\/[^"']+["']/g;
        const matches = content.match(uiImportRegex);

        if (matches) {
          unrewrittenCount++;
          error(
            `Unrewritten imports in registry/${folder}/${file}: ${matches.join(", ")}`
          );
        }
      } catch {
        // File doesn't exist or can't be read
      }
    }
  }

  if (unrewrittenCount === 0) {
    info("✅ All imports correctly rewritten in registry files");
  }

  return unrewrittenCount;
}

/**
 * Compare src and registry files to detect drift
 */
async function checkComponentDrift() {
  console.log("🔍 Checking for component drift (src/ vs registry/)...\n");

  const folders = ["components", "primitives", "layout", "lib", "hooks"];
  let driftCount = 0;
  let missingCount = 0;
  let orphanedCount = 0;

  for (const folder of folders) {
    const srcFolderPath = path.join(srcDir, folder);
    const regFolderPath = path.join(registryDir, folder);

    const srcFiles = await getAllFiles(srcFolderPath);
    const regFiles = await getAllFiles(regFolderPath);

    // Check for files in src but not in registry (missing)
    // Note: primitives/icon.tsx is intentionally not in registry as it's re-exported via components/icon.tsx
    const knownReexports = ["primitives/icon.tsx"];
    for (const file of srcFiles) {
      if (!regFiles.includes(file)) {
        const fullPath = `${folder}/${file}`;
        if (knownReexports.includes(fullPath)) {
          info(`Skipping ${fullPath} (re-exported via components)`);
          continue;
        }
        missingCount++;
        warn(`Missing in registry: ${folder}/${file}`);
      }
    }

    // Check for files in registry but not in src (orphaned)
    for (const file of regFiles) {
      if (!srcFiles.includes(file)) {
        orphanedCount++;
        warn(`Orphaned in registry (not in src): ${folder}/${file}`);
      }
    }

    // Check for content drift in matching files
    for (const file of srcFiles) {
      if (!regFiles.includes(file)) continue;

      const srcPath = path.join(srcFolderPath, file);
      const regPath = path.join(regFolderPath, file);

      try {
        const srcContent = await fs.readFile(srcPath, "utf-8");
        const regContent = await fs.readFile(regPath, "utf-8");

        const srcNormalized = normalizeForComparison(srcContent, false);
        const regNormalized = normalizeForComparison(regContent, true);

        const srcHash = getContentHash(srcNormalized);
        const regHash = getContentHash(regNormalized);

        if (srcHash !== regHash) {
          driftCount++;
          error(`Content drift detected: ${folder}/${file}`);
        }
      } catch (err) {
        warn(`Could not compare ${folder}/${file}: ${err.message}`);
      }
    }
  }

  if (driftCount === 0 && missingCount === 0 && orphanedCount === 0) {
    info("✅ No component drift detected - src/ and registry/ are in sync");
  }

  return { driftCount, missingCount, orphanedCount };
}

/**
 * Validate registry.json has all components
 */
async function validateRegistryJson() {
  console.log("🔍 Validating registry.json...\n");

  const registryJsonPath = path.join(registryDir, "registry.json");

  try {
    const content = await fs.readFile(registryJsonPath, "utf-8");
    const registry = JSON.parse(content);

    if (!registry.components) {
      error("registry.json missing 'components' field");
      return;
    }

    // Check that all files referenced in registry.json exist
    let missingFiles = 0;
    for (const [key, component] of Object.entries(registry.components)) {
      for (const file of component.files || []) {
        const filePath = path.join(registryDir, file);
        try {
          await fs.access(filePath);
        } catch {
          missingFiles++;
          error(`registry.json references missing file: ${file} (component: ${key})`);
        }
      }
    }

    if (missingFiles === 0) {
      info(
        `✅ registry.json valid with ${Object.keys(registry.components).length} components`
      );
    }

    // Check for files in registry not listed in registry.json
    const folders = ["components", "primitives", "layout", "lib", "hooks"];
    const listedFiles = new Set();

    for (const component of Object.values(registry.components)) {
      for (const file of component.files || []) {
        listedFiles.add(file);
      }
    }

    for (const folder of folders) {
      const folderPath = path.join(registryDir, folder);
      const files = await getAllFiles(folderPath);

      for (const file of files) {
        const relativePath = `${folder}/${file}`;
        if (!listedFiles.has(relativePath)) {
          warn(`File not in registry.json: ${relativePath}`);
        }
      }
    }
  } catch (err) {
    error(`Could not read registry.json: ${err.message}`);
  }
}

/**
 * Check for common issues in component files
 */
async function checkCommonIssues() {
  console.log("🔍 Checking for common issues...\n");

  const folders = ["components", "primitives", "layout"];
  let issueCount = 0;

  for (const folder of folders) {
    const folderPath = path.join(srcDir, folder);
    const files = await getAllFiles(folderPath);

    for (const file of files) {
      if (!file.endsWith(".tsx")) continue;

      const filePath = path.join(folderPath, file);

      try {
        const content = await fs.readFile(filePath, "utf-8");

        // Check for missing displayName
        if (
          content.includes("forwardRef") &&
          !content.includes(".displayName")
        ) {
          issueCount++;
          warn(`Missing displayName in forwardRef component: ${folder}/${file}`);
        }

        // Check for hardcoded pixel values (potential design token issues)
        const hardcodedPx = content.match(/[^-]\d+px/g);
        if (hardcodedPx && hardcodedPx.length > 3) {
          warn(
            `Multiple hardcoded px values in ${folder}/${file}: consider using design tokens`
          );
        }

        // Check for deprecated Tailwind v3 patterns
        if (content.includes("flex-shrink-0")) {
          issueCount++;
          error(
            `Deprecated Tailwind v3 pattern "flex-shrink-0" in ${folder}/${file} - use "shrink-0"`
          );
        }

        // Check for deprecated Tailwind v3 important syntax (!class instead of class!)
        // Only check inside template strings and className props, not JS code
        const classNameRegex = /className\s*=\s*{?[`"'][^`"']*![a-z][a-z0-9-]*[^`"']*[`"']}?/g;
        const classMatches = content.match(classNameRegex);
        if (classMatches) {
          for (const classMatch of classMatches) {
            // Look for !class pattern (but not class!)
            const importantPattern = /\s!(border|bg|text|ring|outline|shadow|p|m|w|h|flex|grid|block|inline|hidden|visible|opacity|z|inset|top|bottom|left|right|rounded|font|gap|space|scale|rotate|translate|skew|transform|transition|duration|ease|delay|animate)-?[a-z0-9-]*/gi;
            const badImportants = classMatch.match(importantPattern);
            if (badImportants) {
              issueCount++;
              error(
                `Deprecated Tailwind v3 important syntax in ${folder}/${file}: ${badImportants.join(", ")} - use "class!" format instead`
              );
            }
          }
        }
      } catch {
        // File doesn't exist or can't be read
      }
    }
  }

  if (issueCount === 0) {
    info("✅ No common issues detected");
  }

  return issueCount;
}

/**
 * Print summary
 */
function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 VALIDATION SUMMARY");
  console.log("=".repeat(60) + "\n");

  if (results.info.length > 0) {
    for (const msg of results.info) {
      console.log(msg);
    }
    console.log("");
  }

  if (results.warnings.length > 0) {
    console.log(`⚠️  ${results.warnings.length} warnings:\n`);
    for (const msg of results.warnings) {
      console.log(`   • ${msg}`);
    }
    console.log("");
  }

  if (results.errors.length > 0) {
    console.log(`❌ ${results.errors.length} errors:\n`);
    for (const msg of results.errors) {
      console.log(`   • ${msg}`);
    }
    console.log("");
  }

  console.log("=".repeat(60));

  if (results.errors.length > 0) {
    console.log("\n❌ Validation FAILED - run 'pnpm build:registry' to fix drift\n");
    return false;
  } else if (results.warnings.length > 0) {
    console.log("\n⚠️  Validation passed with warnings\n");
    return true;
  } else {
    console.log("\n✅ Validation PASSED\n");
    return true;
  }
}

// Main
async function main() {
  console.log("🔍 Unisane UI Registry Validator\n");
  console.log("=".repeat(60) + "\n");

  // Check if registry exists
  try {
    await fs.access(registryDir);
  } catch {
    error("Registry directory does not exist. Run 'pnpm build:registry' first.");
    printSummary();
    process.exit(1);
  }

  await checkComponentDrift();
  await checkUnrewrittenImports();
  await validateRegistryJson();
  await checkCommonIssues();

  const passed = printSummary();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Validation failed with error:", err);
  process.exit(1);
});
