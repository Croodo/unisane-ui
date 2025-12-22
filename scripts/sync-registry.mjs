#!/usr/bin/env node

import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, relative, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const packagesDir = join(rootDir, "packages");
const registryDir = join(rootDir, "registry");

// Ensure registry directories exist
function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

// Copy file with directory structure preservation
function copyFile(src, dest) {
  const destDir = dirname(dest);
  ensureDir(destDir);

  try {
    copyFileSync(src, dest);
    console.log(
      `✓ Copied: ${relative(rootDir, src)} → ${relative(rootDir, dest)}`
    );
  } catch (error) {
    console.error(`✗ Failed to copy: ${relative(rootDir, src)}`, error.message);
  }
}

// Copy directory recursively
function copyDir(srcDir, destDir, allowedExts = [".tsx"]) {
  if (!existsSync(srcDir)) {
    console.warn(
      `⚠ Source directory doesn't exist: ${relative(rootDir, srcDir)}`
    );
    return;
  }

  const items = readdirSync(srcDir);

  for (const item of items) {
    const srcPath = join(srcDir, item);
    const destPath = join(destDir, item);
    const stats = statSync(srcPath);

    if (stats.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (stats.isFile() && allowedExts.includes(extname(srcPath))) {
      copyFile(srcPath, destPath);
    }
  }
}

// Main sync function
function syncRegistry() {
  console.log("🔄 Syncing packages/ui → registry/\n");

  // Copy styles
  console.log("📁 Copying styles...");
  const stylesSrc = join(packagesDir, "tokens", "dist");
  const stylesDest = join(registryDir, "styles");
  copyDir(stylesSrc, stylesDest, [".css"]);

  // Copy primitives
  console.log("\n📁 Copying primitives...");
  const primitivesSrc = join(packagesDir, "ui", "src", "primitives");
  const primitivesDest = join(registryDir, "primitives");
  copyDir(primitivesSrc, primitivesDest);

  // Copy layout
  console.log("\n📁 Copying layout...");
  const layoutSrc = join(packagesDir, "ui", "src", "layout");
  const layoutDest = join(registryDir, "layout");
  copyDir(layoutSrc, layoutDest);

  // Copy components
  console.log("\n📁 Copying components...");
  const componentsSrc = join(packagesDir, "ui", "src", "components");
  const componentsDest = join(registryDir, "components");
  copyDir(componentsSrc, componentsDest);

  // Copy utilities
  console.log("\n📁 Copying utilities...");
  const utilsSrc = join(packagesDir, "ui", "src", "lib", "utils.ts");
  const utilsDest = join(registryDir, "lib", "utils.ts");
  if (existsSync(utilsSrc)) {
    copyFile(utilsSrc, utilsDest);
  }

  console.log("\n✅ Registry sync complete!");
}

// Run sync
syncRegistry();
