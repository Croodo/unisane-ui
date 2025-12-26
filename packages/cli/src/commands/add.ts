import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { prompts } from "../utils/prompts.js";

// Registry types
interface ComponentMetadata {
  name: string;
  type: string;
  description: string;
  files: string[];
  dependencies: string[];
  registryDependencies: string[];
  devDependencies?: string[];
  variants?: Record<string, string[]>;
  accessibility?: {
    keyboard?: boolean;
    screenReader?: boolean;
    contrast?: string;
  };
}

interface Registry {
  $schema: string;
  version: string;
  components: Record<string, ComponentMetadata>;
}

interface UnisaneConfig {
  aliases?: {
    components?: string;
    lib?: string;
    hooks?: string;
  };
  srcDir?: string;
}

interface AddOptions {
  yes?: boolean;
  overwrite?: boolean;
  all?: boolean;
  path?: string;
}

// Load registry from @unisane/ui package
async function loadRegistry(registryPath: string): Promise<Registry> {
  try {
    const registryJson = await fs.readJson(registryPath);
    return registryJson;
  } catch (error) {
    throw new Error(
      `Failed to load registry: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Load project config (unisane.json or from package.json)
async function loadConfig(): Promise<UnisaneConfig> {
  const configPath = path.join(process.cwd(), "unisane.json");
  const packageJsonPath = path.join(process.cwd(), "package.json");

  // Check for unisane.json first
  if (await fs.pathExists(configPath)) {
    try {
      return await fs.readJson(configPath);
    } catch {
      // Fall through to defaults
    }
  }

  // Check for unisane config in package.json
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.unisane) {
        return pkg.unisane;
      }
    } catch {
      // Fall through to defaults
    }
  }

  // Default config
  return {
    aliases: {
      components: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    srcDir: (await fs.pathExists(path.join(process.cwd(), "src")))
      ? "src"
      : "",
  };
}

// Recursively get all dependencies for components
function getAllDependencies(
  components: string[],
  registry: Registry,
  visited = new Set<string>()
): Set<string> {
  for (const component of components) {
    if (visited.has(component)) continue;

    const meta = registry.components[component];
    if (!meta) continue;

    visited.add(component);

    // Add registry dependencies recursively
    const deps = meta.registryDependencies || [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        getAllDependencies([dep], registry, visited);
      }
    }
  }

  return visited;
}

// Get target directory based on component type
function getTargetDir(
  type: string,
  config: UnisaneConfig,
  cwd: string,
  customPath?: string
): string {
  if (customPath) {
    return path.join(cwd, customPath);
  }

  const srcDir = config.srcDir || "";
  const basePath = srcDir ? path.join(cwd, srcDir) : cwd;

  if (type === "lib:util") {
    return path.join(basePath, "lib");
  }
  if (type === "hooks:ui") {
    return path.join(basePath, "hooks");
  }
  if (type === "types:ui") {
    return path.join(basePath, "types");
  }
  // All other types go to components/ui
  return path.join(basePath, "components", "ui");
}

// Transform import paths in component files
function transformImports(content: string, config: UnisaneConfig): string {
  const componentsAlias = config.aliases?.components || "@/components/ui";
  const libAlias = config.aliases?.lib || "@/lib";
  const hooksAlias = config.aliases?.hooks || "@/hooks";

  // Transform @ui/ imports
  content = content.replace(
    /from\s+['"]@ui\/(primitives|layout|components)\/([^'"]+)['"]/g,
    `from '${componentsAlias}/$2'`
  );

  content = content.replace(
    /from\s+['"]@ui\/lib\/([^'"]+)['"]/g,
    `from '${libAlias}/$1'`
  );

  content = content.replace(
    /from\s+['"]@ui\/hooks\/([^'"]+)['"]/g,
    `from '${hooksAlias}/$1'`
  );

  return content;
}

// Copy a single component
async function copyComponent(
  componentKey: string,
  meta: ComponentMetadata,
  config: UnisaneConfig,
  registryDir: string,
  cwd: string,
  options: AddOptions
): Promise<{ copied: string[]; skipped: string[] }> {
  const copied: string[] = [];
  const skipped: string[] = [];
  const targetDir = getTargetDir(meta.type, config, cwd, options.path);

  await fs.ensureDir(targetDir);

  for (const file of meta.files) {
    const srcFile = path.join(registryDir, file);
    const fileName = path.basename(file);
    const destFile = path.join(targetDir, fileName);

    // Check if file exists
    if (await fs.pathExists(destFile)) {
      if (!options.overwrite) {
        skipped.push(fileName);
        continue;
      }
    }

    try {
      let content = await fs.readFile(srcFile, "utf-8");
      content = transformImports(content, config);
      await fs.writeFile(destFile, content);
      copied.push(path.relative(cwd, destFile));
    } catch (error) {
      console.warn(
        chalk.yellow(`  Warning: Could not copy ${file}: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  return { copied, skipped };
}

// Get all npm dependencies for components
function getNpmDependencies(
  components: Set<string>,
  registry: Registry
): { dependencies: Set<string>; devDependencies: Set<string> } {
  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();

  for (const comp of components) {
    const meta = registry.components[comp];
    if (!meta) continue;

    for (const dep of meta.dependencies || []) {
      dependencies.add(dep);
    }
    for (const dep of meta.devDependencies || []) {
      devDependencies.add(dep);
    }
  }

  return { dependencies, devDependencies };
}

export async function addCommand(
  componentNames?: string[],
  options: AddOptions = {}
) {
  const spinner = ora();

  try {
    const cwd = process.cwd();

    // Find registry location
    const registryPath = path.join(
      cwd,
      "node_modules",
      "@unisane",
      "ui",
      "registry",
      "registry.json"
    );

    // Check if registry exists
    if (!(await fs.pathExists(registryPath))) {
      console.log(chalk.red("\n✗ Registry not found"));
      console.log(
        chalk.yellow(
          "\nMake sure you have installed @unisane/ui:"
        )
      );
      console.log(chalk.gray("  pnpm add @unisane/ui"));
      console.log(
        chalk.gray("\nOr run init first:")
      );
      console.log(chalk.gray("  npx @unisane/cli init"));
      return;
    }

    // Load registry and config
    const registry = await loadRegistry(registryPath);
    const config = await loadConfig();

    // Get list of available UI components (exclude lib utils)
    const availableComponents = Object.entries(registry.components)
      .filter(([_, meta]) => meta.type !== "lib:util")
      .map(([key]) => key)
      .sort();

    let selectedComponents: string[] = [];

    // Handle --all flag
    if (options.all) {
      selectedComponents = availableComponents;
      console.log(chalk.blue(`\nAdding all ${selectedComponents.length} components...`));
    }
    // Handle component names provided as arguments
    else if (componentNames && componentNames.length > 0) {
      // Validate component names
      const invalid = componentNames.filter(
        (name) => !registry.components[name]
      );
      if (invalid.length > 0) {
        console.log(chalk.red(`\n✗ Unknown components: ${invalid.join(", ")}`));
        console.log(chalk.gray("\nRun `npx @unisane/cli add` to see available components."));
        return;
      }
      selectedComponents = componentNames;
    }
    // Interactive selection
    else {
      const choices = availableComponents.map((key) => {
        const comp = registry.components[key];
        return {
          title: comp?.name || key,
          value: key,
          description: comp?.description || "",
        };
      });

      const { components } = await prompts({
        type: "multiselect",
        name: "components",
        message: "Which components would you like to add?",
        choices,
        hint: "Space to select. A to toggle all. Enter to submit.",
        instructions: false,
      });

      if (!components || components.length === 0) {
        console.log(chalk.yellow("\nNo components selected."));
        return;
      }

      selectedComponents = components;
    }

    // Get all dependencies (including transitive)
    const allComponents = getAllDependencies(selectedComponents, registry);

    // Always include utils
    allComponents.add("utils");

    const depsCount = allComponents.size - selectedComponents.length;
    if (depsCount > 0) {
      console.log(
        chalk.gray(`\nResolving ${depsCount} dependencies...`)
      );
    }

    // Confirm if not using --yes
    if (!options.yes && !options.all) {
      const componentList = Array.from(allComponents).sort();
      console.log(chalk.blue("\nComponents to add:"));
      for (const comp of componentList) {
        const meta = registry.components[comp];
        const isSelected = selectedComponents.includes(comp);
        const prefix = isSelected ? chalk.green("◉") : chalk.gray("○");
        console.log(`  ${prefix} ${meta?.name || comp}${!isSelected ? chalk.gray(" (dependency)") : ""}`);
      }

      const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message: "Proceed with installation?",
        initial: true,
      });

      if (!confirm) {
        console.log(chalk.yellow("\nCancelled."));
        return;
      }
    }

    // Copy components
    spinner.start("Installing components...");

    const registryDir = path.join(cwd, "node_modules", "@unisane", "ui", "registry");
    const allCopied: string[] = [];
    const allSkipped: string[] = [];

    for (const comp of allComponents) {
      const meta = registry.components[comp];
      if (!meta) continue;

      spinner.text = `Installing ${meta.name}...`;
      const { copied, skipped } = await copyComponent(
        comp,
        meta,
        config,
        registryDir,
        cwd,
        options
      );
      allCopied.push(...copied);
      allSkipped.push(...skipped);
    }

    spinner.succeed(chalk.green("Components installed successfully!"));

    // Show results
    if (allCopied.length > 0) {
      console.log(chalk.blue("\n✓ Created files:"));
      for (const file of allCopied) {
        console.log(chalk.gray(`  ${file}`));
      }
    }

    if (allSkipped.length > 0) {
      console.log(chalk.yellow("\n⚠ Skipped existing files:"));
      for (const file of allSkipped) {
        console.log(chalk.gray(`  ${file}`));
      }
      console.log(chalk.gray("\n  Use --overwrite to replace existing files."));
    }

    // Check for npm dependencies
    const { dependencies, devDependencies } = getNpmDependencies(allComponents, registry);

    if (dependencies.size > 0 || devDependencies.size > 0) {
      console.log(chalk.blue("\n📦 Required npm packages:"));

      if (dependencies.size > 0) {
        console.log(chalk.gray(`  pnpm add ${Array.from(dependencies).join(" ")}`));
      }
      if (devDependencies.size > 0) {
        console.log(chalk.gray(`  pnpm add -D ${Array.from(devDependencies).join(" ")}`));
      }
    }

    // Show usage example
    if (selectedComponents.length === 1 && selectedComponents[0]) {
      const comp = selectedComponents[0];
      const meta = registry.components[comp];
      if (meta) {
        const importAlias = config.aliases?.components || "@/components/ui";
        const importName = meta.name;
        console.log(chalk.blue("\n📝 Usage:"));
        console.log(chalk.gray(`  import { ${importName} } from "${importAlias}/${comp}";`));
      }
    }

  } catch (error) {
    spinner.fail(chalk.red("Failed to add components"));
    console.error(
      chalk.red("\nError:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
