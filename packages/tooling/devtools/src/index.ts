#!/usr/bin/env node
/**
 * @unisane/devtools
 *
 * Developer tools and utilities for the Unisane platform.
 * Includes CLI commands and code generators.
 */

export const VERSION = '0.1.0';

// Re-export config types and utilities
export * from './config/index.js';

// Re-export utility functions
export * from './utils/index.js';

// Re-export extraction module
export * from './extraction/index.js';

// Export command functions for programmatic use
export { doctor } from './commands/dev/doctor.js';
export { routesGen } from './commands/routes/gen.js';
export type { RoutesGenOptions } from './commands/routes/gen.js';
export { sdkGen } from './commands/sdk/gen.js';
export type { SdkGenOptions } from './commands/sdk/gen.js';

// Re-export generators
export * from './generators/routes/index.js';
export * from './generators/sdk/index.js';
