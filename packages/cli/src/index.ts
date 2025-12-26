#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { doctorCommand } from "./commands/doctor.js";
import { diffCommand } from "./commands/diff.js";

const program = new Command();

program
  .name("unisane")
  .description(
    "Unisane UI CLI - Material 3 design system with shadcn-style workflow"
  )
  .version("0.0.1");

program
  .command("init")
  .description("Initialize Unisane UI in your project")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-d, --defaults", "Use default configuration")
  .action(initCommand);

program
  .command("add")
  .description("Add components to your project")
  .argument("[components...]", "Components to add (space-separated)")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("-o, --overwrite", "Overwrite existing files")
  .option("-a, --all", "Add all available components")
  .option("-p, --path <path>", "Custom path to add components")
  .action(async (components, options) => {
    await addCommand(components, options);
  });

program
  .command("diff")
  .description("Check for component updates")
  .argument("[component]", "Component to check (or all if omitted)")
  .action(diffCommand);

program
  .command("doctor")
  .description("Check your Unisane UI installation")
  .action(doctorCommand);

program.parse(process.argv);
