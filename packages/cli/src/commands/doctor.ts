import { promises as fs } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  fix?: string;
}

export async function doctorCommand() {
  console.log(chalk.bold.blue("🔍 Unisane UI Doctor\n"));

  const spinner = ora("Checking installation...").start();
  const results: CheckResult[] = [];

  try {
    // Check 1: Next.js project
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    if (packageJson.dependencies?.next) {
      results.push({
        name: "Next.js",
        status: "pass",
        message: `Found Next.js ${packageJson.dependencies.next}`,
      });
    } else {
      results.push({
        name: "Next.js",
        status: "fail",
        message: "Not a Next.js project",
        fix: "Run this command in a Next.js project directory",
      });
    }

    // Check 2: Tailwind CSS v4
    const tailwindVersion =
      packageJson.dependencies?.tailwindcss ||
      packageJson.devDependencies?.tailwindcss;
    if (tailwindVersion) {
      if (tailwindVersion.startsWith("^4") || tailwindVersion.startsWith("4")) {
        results.push({
          name: "Tailwind CSS",
          status: "pass",
          message: `Found Tailwind CSS v4 (${tailwindVersion})`,
        });
      } else {
        results.push({
          name: "Tailwind CSS",
          status: "warn",
          message: `Found Tailwind CSS ${tailwindVersion} (v4 recommended)`,
          fix: "Update to Tailwind CSS v4: npm install tailwindcss@^4",
        });
      }
    } else {
      results.push({
        name: "Tailwind CSS",
        status: "fail",
        message: "Tailwind CSS not found",
        fix: "Install Tailwind CSS: npm install tailwindcss@^4",
      });
    }

    // Check 3: Token files
    const stylesDir = join(process.cwd(), "src", "styles");
    const uniTokensPath = join(stylesDir, "uni-tokens.css");
    const uniThemePath = join(stylesDir, "uni-theme.css");

    if (
      await fs
        .access(uniTokensPath)
        .then(() => true)
        .catch(() => false)
    ) {
      results.push({
        name: "uni-tokens.css",
        status: "pass",
        message: "Found token definitions",
      });
    } else {
      results.push({
        name: "uni-tokens.css",
        status: "fail",
        message: "Token file not found",
        fix: "Run: npx unisane-ui init",
      });
    }

    if (
      await fs
        .access(uniThemePath)
        .then(() => true)
        .catch(() => false)
    ) {
      results.push({
        name: "uni-theme.css",
        status: "pass",
        message: "Found theme mapping",
      });
    } else {
      results.push({
        name: "uni-theme.css",
        status: "fail",
        message: "Theme file not found",
        fix: "Run: npx unisane-ui init",
      });
    }

    // Check 4: CSS imports in globals.css
    const globalsCssPath = join(process.cwd(), "src", "app", "globals.css");
    if (
      await fs
        .access(globalsCssPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const globalsCss = await fs.readFile(globalsCssPath, "utf-8");

      if (
        globalsCss.includes("uni-tokens.css") &&
        globalsCss.includes("uni-theme.css")
      ) {
        results.push({
          name: "CSS Imports",
          status: "pass",
          message: "Token imports found in globals.css",
        });
      } else {
        results.push({
          name: "CSS Imports",
          status: "fail",
          message: "Missing token imports in globals.css",
          fix: "Add: @import '../styles/uni-tokens.css'; @import '../styles/uni-theme.css';",
        });
      }
    } else {
      results.push({
        name: "CSS Imports",
        status: "warn",
        message: "globals.css not found",
        fix: "Ensure CSS imports are configured in your global styles",
      });
    }

    // Check 5: Dependencies
    const requiredDeps = ["class-variance-authority", "clsx", "tailwind-merge"];
    const missingDeps: string[] = [];

    for (const dep of requiredDeps) {
      if (
        !packageJson.dependencies?.[dep] &&
        !packageJson.devDependencies?.[dep]
      ) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length === 0) {
      results.push({
        name: "Dependencies",
        status: "pass",
        message: "All required dependencies installed",
      });
    } else {
      results.push({
        name: "Dependencies",
        status: "fail",
        message: `Missing: ${missingDeps.join(", ")}`,
        fix: `Install: npm install ${missingDeps.join(" ")}`,
      });
    }

    // Check 6: TypeScript configuration
    const tsconfigPath = join(process.cwd(), "tsconfig.json");
    if (
      await fs
        .access(tsconfigPath)
        .then(() => true)
        .catch(() => false)
    ) {
      results.push({
        name: "TypeScript",
        status: "pass",
        message: "TypeScript configuration found",
      });
    } else {
      results.push({
        name: "TypeScript",
        status: "warn",
        message: "TypeScript config not found",
        fix: "TypeScript is recommended for the best experience",
      });
    }

    spinner.stop();

    // Display results
    console.log(chalk.bold("📋 Results:\n"));

    for (const result of results) {
      const icon =
        result.status === "pass"
          ? "✅"
          : result.status === "warn"
            ? "⚠️"
            : "❌";
      const color =
        result.status === "pass"
          ? "green"
          : result.status === "warn"
            ? "yellow"
            : "red";

      console.log(
        `${icon} ${chalk.bold(result.name)}: ${chalk[color](result.message)}`
      );

      if (result.fix) {
        console.log(chalk.gray(`   💡 Fix: ${result.fix}`));
      }
    }

    // Summary
    const passCount = results.filter((r) => r.status === "pass").length;
    const failCount = results.filter((r) => r.status === "fail").length;
    const warnCount = results.filter((r) => r.status === "warn").length;

    console.log(
      chalk.bold(
        `\n📊 Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`
      )
    );

    if (failCount > 0) {
      console.log(
        chalk.yellow("\n🔧 Run 'npx unisane-ui init' to fix most issues")
      );
      process.exit(1);
    } else {
      console.log(chalk.green("\n🎉 Your Unisane UI installation looks good!"));
    }
  } catch (error) {
    spinner.fail("Failed to check installation");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
