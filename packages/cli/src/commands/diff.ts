import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { diffLines, type Change } from "diff";

interface ComponentMetadata {
  name: string;
  type: string;
  files: string[];
}

interface Registry {
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

// Load project config
async function loadConfig(): Promise<UnisaneConfig> {
  const configPath = path.join(process.cwd(), "unisane.json");
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (await fs.pathExists(configPath)) {
    try {
      return await fs.readJson(configPath);
    } catch {
      // Fall through
    }
  }

  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.unisane) {
        return pkg.unisane;
      }
    } catch {
      // Fall through
    }
  }

  return {
    aliases: {
      components: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    srcDir: (await fs.pathExists(path.join(process.cwd(), "src"))) ? "src" : "",
  };
}

// Get target directory based on component type
function getTargetDir(type: string, config: UnisaneConfig, cwd: string): string {
  const srcDir = config.srcDir || "";
  const basePath = srcDir ? path.join(cwd, srcDir) : cwd;

  if (type === "lib:util") {
    return path.join(basePath, "lib");
  }
  if (type === "hooks:ui") {
    return path.join(basePath, "hooks");
  }
  return path.join(basePath, "components", "ui");
}

// Format diff output
function formatDiff(diff: Change[]): string {
  let output = "";
  for (const part of diff) {
    if (part.added) {
      output += chalk.green(part.value.split("\n").map((l: string) => `+ ${l}`).join("\n"));
    } else if (part.removed) {
      output += chalk.red(part.value.split("\n").map((l: string) => `- ${l}`).join("\n"));
    }
  }
  return output;
}

export async function diffCommand(componentName?: string) {
  const spinner = ora();

  try {
    const cwd = process.cwd();

    // Find registry
    const registryPath = path.join(
      cwd,
      "node_modules",
      "@unisane",
      "ui",
      "registry",
      "registry.json"
    );

    if (!(await fs.pathExists(registryPath))) {
      console.log(chalk.red("\n✗ Registry not found"));
      console.log(chalk.gray("  Make sure @unisane/ui is installed."));
      return;
    }

    const registry: Registry = await fs.readJson(registryPath);
    const config = await loadConfig();
    const registryDir = path.join(cwd, "node_modules", "@unisane", "ui", "registry");

    const componentsToCheck: string[] = [];

    if (componentName) {
      if (!registry.components[componentName]) {
        console.log(chalk.red(`\n✗ Unknown component: ${componentName}`));
        return;
      }
      componentsToCheck.push(componentName);
    } else {
      // Check all installed components
      spinner.start("Scanning for installed components...");

      for (const [key, meta] of Object.entries(registry.components)) {
        const targetDir = getTargetDir(meta.type, config, cwd);
        const fileName = path.basename(meta.files[0] || "");
        const localPath = path.join(targetDir, fileName);

        if (await fs.pathExists(localPath)) {
          componentsToCheck.push(key);
        }
      }

      spinner.stop();
    }

    if (componentsToCheck.length === 0) {
      console.log(chalk.yellow("\nNo components found to check."));
      console.log(chalk.gray("  Run `npx @unisane/cli add` to add components."));
      return;
    }

    console.log(chalk.blue(`\nChecking ${componentsToCheck.length} component(s) for updates...\n`));

    let hasChanges = false;

    for (const comp of componentsToCheck) {
      const meta = registry.components[comp];
      if (!meta) continue;

      const targetDir = getTargetDir(meta.type, config, cwd);

      for (const file of meta.files) {
        const fileName = path.basename(file);
        const localPath = path.join(targetDir, fileName);
        const registryFilePath = path.join(registryDir, file);

        if (!(await fs.pathExists(localPath))) {
          continue;
        }

        try {
          const localContent = await fs.readFile(localPath, "utf-8");
          const registryContent = await fs.readFile(registryFilePath, "utf-8");

          // Normalize import paths for comparison
          const normalizedRegistry = registryContent
            .replace(/@ui\/(primitives|layout|components)\//g, "@/components/ui/")
            .replace(/@ui\/lib\//g, "@/lib/")
            .replace(/@ui\/hooks\//g, "@/hooks/");

          if (localContent !== normalizedRegistry) {
            hasChanges = true;
            console.log(chalk.yellow(`● ${meta.name}`));
            console.log(chalk.gray(`  ${path.relative(cwd, localPath)}`));

            const diff = diffLines(localContent, normalizedRegistry);
            const additions = diff.filter((p) => p.added).length;
            const deletions = diff.filter((p) => p.removed).length;

            console.log(chalk.gray(`  ${chalk.green(`+${additions}`)} ${chalk.red(`-${deletions}`)} changes\n`));
          } else {
            console.log(chalk.green(`✓ ${meta.name}`) + chalk.gray(" (up to date)"));
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    if (!hasChanges) {
      console.log(chalk.green("\n✓ All components are up to date!"));
    } else {
      console.log(chalk.blue("\nTo update components, run:"));
      console.log(chalk.gray("  npx @unisane/cli add <component> --overwrite"));
      console.log(chalk.gray("\nOr update all:"));
      console.log(chalk.gray("  npx @unisane/cli add --all --overwrite"));
    }

  } catch (error) {
    spinner.fail(chalk.red("Failed to check for updates"));
    console.error(
      chalk.red("\nError:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
