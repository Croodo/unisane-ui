#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { doctorCommand } from "./commands/doctor.js";

const program = new Command();

program
  .name("unisane-ui")
  .description(
    "Unisane UI CLI - Material 3 design system with shadcn-style workflow"
  )
  .version("0.0.1");

program
  .command("init")
  .description("Initialize Unisane UI in your project")
  .action(initCommand);

program
  .command("add")
  .description("Add Unisane UI components to your project")
  .argument("[component]", "Component name to add")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (componentName, options) => {
    await addCommand(componentName, options);
  });

program
  .command("doctor")
  .description("Check your Unisane UI installation")
  .action(doctorCommand);

program.parse(process.argv);
