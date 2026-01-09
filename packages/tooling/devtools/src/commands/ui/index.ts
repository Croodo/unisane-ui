/**
 * @module commands/ui
 *
 * UI component management commands (shadcn-style workflow).
 *
 * Commands:
 *   unisane ui init              Initialize Unisane UI in project
 *   unisane ui add <component>   Add UI component(s)
 *   unisane ui diff [component]  Check for component updates
 *   unisane ui doctor            Health check for UI setup
 */

export { uiInit } from './init.js';
export { uiAdd } from './add.js';
export { uiDiff } from './diff.js';
export { uiDoctor } from './doctor.js';
