import { promises as fs } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import { prompts } from "../utils/prompts.js";

export async function initCommand() {
  console.log(chalk.bold.blue("🎨 Unisane UI Init\n"));

  const spinner = ora("Initializing Unisane UI...").start();

  try {
    // Check if we're in a Next.js project
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    if (!packageJson.dependencies?.next) {
      spinner.fail("This does not appear to be a Next.js project");
      console.log(
        chalk.yellow("Please run this command in a Next.js project directory.")
      );
      return;
    }

    // Create styles directory
    const stylesDir = join(process.cwd(), "src", "styles");
    await fs.mkdir(stylesDir, { recursive: true });

    // Copy token files from the tokens package
    const tokensSource = join(
      process.cwd(),
      "node_modules",
      "@unisane",
      "tokens",
      "dist"
    );

    if (
      await fs
        .access(tokensSource)
        .then(() => true)
        .catch(() => false)
    ) {
      // Copy from node_modules if tokens package is installed
      const uniTokensSrc = join(tokensSource, "uni-tokens.css");
      const uniThemeSrc = join(tokensSource, "uni-theme.css");

      await fs.copyFile(uniTokensSrc, join(stylesDir, "uni-tokens.css"));
      await fs.copyFile(uniThemeSrc, join(stylesDir, "uni-theme.css"));
    } else {
      // Fallback: create placeholder files
      await fs.writeFile(
        join(stylesDir, "uni-tokens.css"),
        `/* Unisane UI Tokens - Add your tokens here */
@import "@unisane/tokens/uni-tokens.css";`
      );

      await fs.writeFile(
        join(stylesDir, "uni-theme.css"),
        `/* Unisane UI Theme - Add your theme here */
@import "@unisane/tokens/uni-theme.css";`
      );
    }

    // Update globals.css
    const globalsCssPath = join(process.cwd(), "src", "app", "globals.css");
    const globalsCss = await fs.readFile(globalsCssPath, "utf-8");

    if (!globalsCss.includes("uni-tokens.css")) {
      const updatedGlobals = `@import "../styles/uni-tokens.css";
@import "../styles/uni-theme.css";

${globalsCss}`;

      await fs.writeFile(globalsCssPath, updatedGlobals);
    }

    spinner.succeed("Unisane UI initialized successfully!");

    console.log(chalk.green("\n✅ Next steps:"));
    console.log(
      chalk.gray("1. Add components with: npx unisane-ui add button card")
    );
    console.log(chalk.gray("2. Start your dev server: npm run dev"));
    console.log(chalk.gray("3. Visit your app and start building!"));
  } catch (error) {
    spinner.fail("Failed to initialize Unisane UI");
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  }
}
