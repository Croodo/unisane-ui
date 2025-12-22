import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { prompts } from "../utils/prompts.js";

// Registry component mapping
const COMPONENT_MAP = {
  // Phase 1 Components
  button: { file: "button.tsx", dependencies: ["ripple"] },
  "icon-button": { file: "icon-button.tsx", dependencies: ["ripple", "icon"] },
  "text-field": { file: "text-field.tsx", dependencies: [] },
  checkbox: { file: "checkbox.tsx", dependencies: ["ripple"] },
  radio: { file: "radio.tsx", dependencies: ["ripple"] },
  switch: { file: "switch.tsx", dependencies: ["ripple", "icon"] },
  card: { file: "card.tsx", dependencies: ["ripple"] },
  chip: { file: "chip.tsx", dependencies: [] },

  // Phase 2 Overlay Components
  dialog: { file: "dialog.tsx", dependencies: ["surface", "text"] },
  popover: { file: "popover.tsx", dependencies: [] },
  tooltip: { file: "tooltip.tsx", dependencies: ["surface", "text"] },
  "dropdown-menu": {
    file: "dropdown-menu.tsx",
    dependencies: ["menu", "surface", "text"],
  },
  tabs: { file: "tabs.tsx", dependencies: ["surface", "text"] },

  // Phase 3 Navigation Components
  fab: { file: "fab.tsx", dependencies: ["surface", "state-layer", "text"] },
  "top-app-bar": {
    file: "top-app-bar.tsx",
    dependencies: ["surface", "state-layer", "text", "icon-button"],
  },
  "navigation-bar": {
    file: "navigation-bar.tsx",
    dependencies: ["surface", "state-layer", "text", "icon"],
  },
  "navigation-rail": {
    file: "navigation-rail.tsx",
    dependencies: ["surface", "text"],
  },
  "navigation-drawer": {
    file: "navigation-drawer.tsx",
    dependencies: ["surface", "state-layer", "text"],
  },

  // Additional Utilities
  progress: { file: "progress.tsx", dependencies: [] },
  skeleton: { file: "skeleton.tsx", dependencies: [] },
  snackbar: {
    file: "snackbar.tsx",
    dependencies: ["surface", "text", "button", "icon-button"],
  },
  banner: {
    file: "banner.tsx",
    dependencies: ["surface", "text", "button", "icon-button"],
  },
  divider: { file: "divider.tsx", dependencies: [] },

  // New Components
  avatar: { file: "avatar.tsx", dependencies: ["surface", "text"] },
  badge: { file: "badge.tsx", dependencies: ["text"] },
  alert: {
    file: "alert.tsx",
    dependencies: ["surface", "text", "icon-button"],
  },
  accordion: {
    file: "accordion.tsx",
    dependencies: ["surface", "text", "state-layer"],
  },
  "bottom-app-bar": {
    file: "bottom-app-bar.tsx",
    dependencies: ["surface", "state-layer"],
  },
  breadcrumb: { file: "breadcrumb.tsx", dependencies: ["text", "icon-button"] },
  list: { file: "list.tsx", dependencies: ["surface", "text", "state-layer"] },

  // Data Display Components
  table: { file: "table.tsx", dependencies: ["surface", "text"] },
  pagination: {
    file: "pagination.tsx",
    dependencies: ["text", "icon-button", "state-layer"],
  },
  stepper: {
    file: "stepper.tsx",
    dependencies: ["surface", "text", "state-layer"],
  },
  slider: {
    file: "slider.tsx",
    dependencies: ["surface", "text", "state-layer"],
  },

  // Primitives
  ripple: { file: "ripple.tsx", dependencies: [] },
  icon: { file: "icon.tsx", dependencies: [] },
  text: { file: "text.tsx", dependencies: [] },
  surface: { file: "surface.tsx", dependencies: [] },
  "state-layer": { file: "state-layer.tsx", dependencies: [] },
  "focus-ring": { file: "focus-ring.tsx", dependencies: [] },
  menu: { file: "menu.tsx", dependencies: ["state-layer", "text"] },

  // Layout Primitives
  container: { file: "container.tsx", dependencies: [] },
  scaffold: { file: "scaffold.tsx", dependencies: ["window-size-provider"] },
  "pane-group": {
    file: "pane-group.tsx",
    dependencies: ["window-size-provider"],
  },
  "window-size-provider": {
    file: "window-size-provider.tsx",
    dependencies: [],
  },
};

type ComponentKey = keyof typeof COMPONENT_MAP;

function getAllDependencies(
  component: ComponentKey,
  visited = new Set<ComponentKey>()
): Set<ComponentKey> {
  const deps = COMPONENT_MAP[component].dependencies as ComponentKey[];

  for (const dep of deps) {
    if (!visited.has(dep)) {
      visited.add(dep);
      getAllDependencies(dep, visited);
    }
  }

  visited.add(component);
  return visited;
}

async function copyComponent(
  component: ComponentKey,
  targetDir: string,
  registryDir: string
) {
  const componentInfo = COMPONENT_MAP[component];
  if (!componentInfo) {
    throw new Error(`Unknown component: ${component}`);
  }

  // Determine source path based on component type
  let srcDir: string;
  if (
    ["text", "surface", "state-layer", "focus-ring", "icon"].includes(component)
  ) {
    srcDir = path.join(registryDir, "primitives");
  } else if (
    ["container", "scaffold", "pane-group", "window-size-provider"].includes(
      component
    )
  ) {
    srcDir = path.join(registryDir, "layout");
  } else {
    srcDir = path.join(registryDir, "components");
  }

  const srcFile = path.join(srcDir, componentInfo.file);
  const destFile = path.join(targetDir, `${component}.tsx`);

  // Read and process the file
  let content = await fs.readFile(srcFile, "utf-8");

  // Update import paths to use relative imports from the components directory
  content = content.replace(
    /from\s+['"](\.\.\/)+(primitives|layout|components|lib)/g,
    (match, dots, folder) => {
      // Calculate relative path from components/ui to the target folder
      const relativePath = folder === "lib" ? "../lib" : `./${folder}`;
      return `from '${relativePath}`;
    }
  );

  // Ensure target directory exists
  await fs.ensureDir(targetDir);

  // Write the processed file
  await fs.writeFile(destFile, content);

  return destFile;
}

export async function addCommand(
  componentName?: string,
  options?: { yes?: boolean }
) {
  const spinner = ora("Adding component...").start();

  try {
    // Prompt for component selection if not provided
    if (!componentName) {
      const { component } = await prompts({
        type: "select",
        name: "component",
        message: "Which component would you like to add?",
        choices: [
          // Phase 1 Components
          { title: "Button", value: "button" },
          { title: "Icon Button", value: "icon-button" },
          { title: "TextField", value: "text-field" },
          { title: "Checkbox", value: "checkbox" },
          { title: "Radio", value: "radio" },
          { title: "Switch", value: "switch" },
          { title: "Card", value: "card" },
          { title: "Chip", value: "chip" },

          // Phase 2 Overlay Components
          { title: "Dialog", value: "dialog" },
          { title: "Popover", value: "popover" },
          { title: "Tooltip", value: "tooltip" },
          { title: "Dropdown Menu", value: "dropdown-menu" },
          { title: "Tabs", value: "tabs" },

          // Phase 3 Navigation Components
          { title: "FAB", value: "fab" },
          { title: "Top App Bar", value: "top-app-bar" },
          { title: "Navigation Bar", value: "navigation-bar" },
          { title: "Navigation Rail", value: "navigation-rail" },
          { title: "Navigation Drawer", value: "navigation-drawer" },

          // Additional Utilities
          { title: "Progress", value: "progress" },
          { title: "Skeleton", value: "skeleton" },
          { title: "Snackbar", value: "snackbar" },
          { title: "Banner", value: "banner" },
          { title: "Divider", value: "divider" },

          // New Components
          { title: "Avatar", value: "avatar" },
          { title: "Badge", value: "badge" },
          { title: "Alert", value: "alert" },
          { title: "Accordion", value: "accordion" },
          { title: "Bottom App Bar", value: "bottom-app-bar" },
          { title: "Breadcrumb", value: "breadcrumb" },
          { title: "List", value: "list" },

          // Data Display Components
          { title: "Table", value: "table" },
          { title: "Pagination", value: "pagination" },
          { title: "Stepper", value: "stepper" },

          // Layout Primitives
          { title: "Container", value: "container" },
          { title: "Scaffold", value: "scaffold" },
          { title: "PaneGroup", value: "pane-group" },
        ],
      });
      componentName = component;
    }

    if (!componentName || !COMPONENT_MAP.hasOwnProperty(componentName)) {
      spinner.fail(`Unknown component: ${componentName}`);
      console.log(
        chalk.yellow(
          "Available components: button, icon-button, text-field, checkbox, radio, switch, card, chip, dialog, popover, tooltip, dropdown-menu, tabs, fab, top-app-bar, navigation-bar, navigation-rail, navigation-drawer, progress, skeleton, snackbar, banner, divider, avatar, badge, alert, accordion, bottom-app-bar, breadcrumb, list, table, pagination, stepper, container, scaffold, pane-group"
        )
      );
      return;
    }

    // Check if we're in a Next.js project
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = await fs.readJson(packageJsonPath);

    if (!packageJson.dependencies?.next) {
      spinner.fail("This does not appear to be a Next.js project");
      console.log(
        chalk.yellow("Please run this command in a Next.js project directory.")
      );
      return;
    }

    // Determine target directory
    const targetDir = path.join(process.cwd(), "src", "components", "ui");

    // Get all dependencies including the component itself
    const allComponents = getAllDependencies(componentName as ComponentKey);

    spinner.text = `Adding ${componentName} and dependencies...`;

    // Copy all components
    const registryDir = path.join(
      process.cwd(),
      "node_modules",
      "@unisane",
      "ui",
      "registry"
    );
    const copiedFiles: string[] = [];

    for (const comp of allComponents) {
      const destFile = await copyComponent(comp, targetDir, registryDir);
      copiedFiles.push(destFile);
    }

    // Also copy utils if not exists
    const utilsDir = path.join(process.cwd(), "src", "lib");
    const utilsFile = path.join(utilsDir, "utils.ts");
    if (!(await fs.pathExists(utilsFile))) {
      await fs.ensureDir(utilsDir);
      const registryUtils = path.join(registryDir, "lib", "utils.ts");
      if (await fs.pathExists(registryUtils)) {
        await fs.copy(registryUtils, utilsFile);
        copiedFiles.push(utilsFile);
      }
    }

    spinner.succeed(
      chalk.green(`✅ Component ${componentName} added successfully!`)
    );

    console.log(chalk.blue("\n📁 Created files:"));
    for (const file of copiedFiles) {
      console.log(chalk.gray(`  - ${path.relative(process.cwd(), file)}`));
    }

    console.log(chalk.blue("\n📝 Usage example:"));
    const importName = componentName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    console.log(
      chalk.gray(
        `import { ${importName} } from "@/components/ui/${componentName}";`
      )
    );
  } catch (error) {
    spinner.fail(chalk.red("Failed to add component"));
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
