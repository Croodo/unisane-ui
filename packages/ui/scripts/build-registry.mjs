#!/usr/bin/env node

/**
 * Unisane UI Registry Builder
 *
 * This script builds the component registry for the CLI tool.
 * It copies components from packages/ui/src to registry/ and:
 * - Rewrites @ui/* imports to @/* (shadcn convention)
 * - Generates registry.json with component metadata
 * - Detects inter-component dependencies automatically
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const registryDir = path.join(rootDir, "registry");

// Component type detection based on folder
function getComponentType(folder) {
  const types = {
    components: "components:ui",
    primitives: "primitives:ui",
    layout: "layout:ui",
    hooks: "hooks:ui",
    lib: "lib:util",
  };
  return types[folder] || "components:ui";
}

// Convert filename to component key (kebab-case)
function fileToKey(filename) {
  return filename
    .replace(/\.tsx?$/, "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// Convert filename to display name (PascalCase)
function fileToName(filename) {
  return filename
    .replace(/\.tsx?$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Rewrite import paths from @ui/* to @/* (shadcn convention)
 * This ensures registry components work in end-user projects
 */
function rewriteImports(content) {
  // Rewrite @ui/lib/utils -> @/lib/utils
  // Rewrite @ui/components/button -> @/components/ui/button
  // Rewrite @ui/primitives/icon -> @/primitives/icon
  // Rewrite @ui/layout/pane -> @/layout/pane

  return content
    // Handle all @ui/* imports - convert to @/*
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
    // Catch any remaining @ui/ patterns
    .replace(/from\s+["']@ui\/([^"']+)["']/g, 'from "@/$1"');
}

// Auto-detect registry dependencies from imports
async function detectDependencies(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const deps = new Set();

    // Match imports from @ui/components, @ui/primitives, @ui/layout
    const importRegex =
      /from\s+['"]@ui\/(components|primitives|layout)\/([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const depKey = fileToKey(match[2]);
      deps.add(depKey);
    }

    // Match imports from same folder like "./ripple"
    const relativeRegex = /from\s+['"]\.\/([^'"]+)['"]/g;
    while ((match = relativeRegex.exec(content)) !== null) {
      const depKey = fileToKey(match[1]);
      deps.add(depKey);
    }

    return Array.from(deps);
  } catch (error) {
    return [];
  }
}

// Scan a directory for components
async function scanDirectory(dir, folder) {
  const components = {};

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
      if (file === "index.ts" || file === "index.tsx") continue;

      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const key = fileToKey(file);
        const name = fileToName(file);
        const registryDeps = await detectDependencies(filePath);

        components[key] = {
          name,
          type: getComponentType(folder),
          description: `${name} component`,
          files: [`${folder}/${file}`],
          dependencies: [],
          registryDependencies: registryDeps,
        };
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan ${dir}: ${error.message}`);
  }

  return components;
}

// Scan lib directory for utilities
async function scanLibDirectory(dir) {
  const utils = {};

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      if (file === "index.ts") continue;

      const key = fileToKey(file);
      const name = fileToName(file);

      utils[key] = {
        name,
        type: "lib:util",
        description: `${name} utility`,
        files: [`lib/${file}`],
        dependencies: [],
        registryDependencies: [],
      };
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan lib: ${error.message}`);
  }

  return utils;
}

// Scan hooks directory
async function scanHooksDirectory(dir) {
  const hooks = {};

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      if (file === "index.ts") continue;

      const key = fileToKey(file);
      const name = fileToName(file);

      hooks[key] = {
        name,
        type: "hooks:ui",
        description: `${name} hook`,
        files: [`hooks/${file}`],
        dependencies: [],
        registryDependencies: [],
      };
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan hooks: ${error.message}`);
  }

  return hooks;
}

// Copy files to registry with import path rewriting
async function copyToRegistry(componentMetadata) {
  console.log("📦 Building registry...\n");

  // Create registry directories
  await fs.mkdir(path.join(registryDir, "components"), { recursive: true });
  await fs.mkdir(path.join(registryDir, "primitives"), { recursive: true });
  await fs.mkdir(path.join(registryDir, "layout"), { recursive: true });
  await fs.mkdir(path.join(registryDir, "lib"), { recursive: true });
  await fs.mkdir(path.join(registryDir, "hooks"), { recursive: true });

  let rewriteCount = 0;

  // Copy all component files
  for (const [, meta] of Object.entries(componentMetadata)) {
    for (const file of meta.files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(registryDir, file);

      try {
        let content = await fs.readFile(srcPath, "utf-8");

        // Check if content has @ui/ imports that need rewriting
        const hasUiImports = content.includes("@ui/");

        // Rewrite imports from @ui/* to @/*
        content = rewriteImports(content);

        if (hasUiImports) {
          rewriteCount++;
        }

        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });
        await fs.writeFile(destPath, content);
        console.log(`✅ Copied ${file}${hasUiImports ? " (imports rewritten)" : ""}`);
      } catch (error) {
        console.warn(`⚠️  Could not copy ${file}: ${error.message}`);
      }
    }
  }

  console.log(`\n📝 Rewrote imports in ${rewriteCount} files\n`);
}

// Generate registry.json
async function generateRegistry(componentMetadata) {
  const registry = {
    $schema: "./registry-schema.json",
    version: "0.4.0",
    components: componentMetadata,
  };

  const registryPath = path.join(registryDir, "registry.json");
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
  console.log("✅ Generated registry.json\n");
}

// Generate schema for IDE autocomplete
async function generateSchema() {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      $schema: { type: "string" },
      version: { type: "string" },
      components: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: {
              type: "string",
              enum: [
                "components:ui",
                "primitives:ui",
                "layout:ui",
                "hooks:ui",
                "lib:util",
              ],
            },
            description: { type: "string" },
            files: { type: "array", items: { type: "string" } },
            dependencies: { type: "array", items: { type: "string" } },
            registryDependencies: { type: "array", items: { type: "string" } },
            variants: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
            },
            accessibility: {
              type: "object",
              properties: {
                keyboard: { type: "boolean" },
                screenReader: { type: "boolean" },
                contrast: { type: "string", enum: ["AA", "AAA"] },
              },
            },
          },
          required: ["name", "type", "description", "files"],
        },
      },
    },
    required: ["components"],
  };

  const schemaPath = path.join(registryDir, "registry-schema.json");
  await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
  console.log("✅ Generated registry-schema.json\n");
}

// Copy styles to registry
async function copyStyles() {
  const stylesDir = path.join(registryDir, "styles");
  await fs.mkdir(stylesDir, { recursive: true });

  // Copy CSS files from tokens package if available
  const tokensDistDir = path.join(rootDir, "..", "tokens", "dist");

  try {
    const files = ["unisane.css", "uni-tokens.css", "uni-theme.css"];

    for (const file of files) {
      const srcPath = path.join(tokensDistDir, file);
      const destPath = path.join(stylesDir, file);

      try {
        await fs.copyFile(srcPath, destPath);
        console.log(`✅ Copied styles/${file}`);
      } catch {
        // File might not exist, skip silently
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not copy styles: ${error.message}`);
  }
}

// Main
async function main() {
  try {
    console.log("🔍 Scanning source directories...\n");

    // Auto-detect all components
    const components = await scanDirectory(
      path.join(srcDir, "components"),
      "components"
    );
    const primitives = await scanDirectory(
      path.join(srcDir, "primitives"),
      "primitives"
    );
    const layout = await scanDirectory(path.join(srcDir, "layout"), "layout");
    const lib = await scanLibDirectory(path.join(srcDir, "lib"));
    const hooks = await scanHooksDirectory(path.join(srcDir, "hooks"));

    // Merge all component metadata
    const componentMetadata = {
      ...lib,
      ...hooks,
      ...primitives,
      ...layout,
      ...components,
    };

    console.log(`📊 Found ${Object.keys(componentMetadata).length} items:`);
    console.log(`   - Components: ${Object.keys(components).length}`);
    console.log(`   - Primitives: ${Object.keys(primitives).length}`);
    console.log(`   - Layout: ${Object.keys(layout).length}`);
    console.log(`   - Lib: ${Object.keys(lib).length}`);
    console.log(`   - Hooks: ${Object.keys(hooks).length}\n`);

    await copyToRegistry(componentMetadata);
    await copyStyles();
    await generateRegistry(componentMetadata);
    await generateSchema();

    console.log("🎉 Registry built successfully!");
    console.log(`📁 Location: ${registryDir}`);
    console.log(`📊 Total items: ${Object.keys(componentMetadata).length}`);
    console.log("\n💡 All @ui/* imports have been rewritten to @/* for end-user compatibility.");
  } catch (error) {
    console.error("❌ Failed to build registry:", error);
    process.exit(1);
  }
}

main();
