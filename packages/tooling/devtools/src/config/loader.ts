import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import type { DevtoolsConfig, PartialDevtoolsConfig, ContractsConfig, RoutesConfig, SdkConfig, DatabaseConfig, PackagesConfig } from './schema.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { existsSync } from '../utils/fs.js';

/**
 * DEV-003 FIX: Zod schema for validating user config.
 *
 * This ensures that dynamically imported config files have the expected
 * structure and prevents malformed configs from causing runtime errors.
 */
const SdkTargetSchema = z.enum(['browser', 'server', 'hooks', 'vue', 'zod', 'types', 'admin-hooks', 'openapi']);
const RuntimeSchema = z.enum(['nodejs', 'edge']);

const PartialConfigSchema = z.object({
  contracts: z.object({
    dir: z.string(),
    router: z.string(),
    glob: z.string(),
  }).partial().optional(),
  routes: z.object({
    output: z.string(),
    runtime: RuntimeSchema,
  }).partial().optional(),
  sdk: z.object({
    output: z.string(),
    targets: z.array(SdkTargetSchema),
    namespace: z.boolean(),
  }).partial().optional(),
  database: z.object({
    uri: z.string().optional(),
    seedDataPath: z.string(),
  }).partial().optional(),
  packages: z.record(z.string()).optional(),
}).strict(); // strict() rejects unknown keys

const CONFIG_FILE_NAMES = [
  'devtools.config.ts',
  'devtools.config.js',
  'devtools.config.mjs',
];

/**
 * Type-safe merge for ContractsConfig
 */
function mergeContractsConfig(target: ContractsConfig, source: Partial<ContractsConfig> = {}): ContractsConfig {
  return {
    dir: source.dir ?? target.dir,
    router: source.router ?? target.router,
    glob: source.glob ?? target.glob,
  };
}

/**
 * Type-safe merge for RoutesConfig
 */
function mergeRoutesConfig(target: RoutesConfig, source: Partial<RoutesConfig> = {}): RoutesConfig {
  return {
    output: source.output ?? target.output,
    runtime: source.runtime ?? target.runtime,
  };
}

/**
 * Type-safe merge for SdkConfig
 */
function mergeSdkConfig(target: SdkConfig, source: Partial<SdkConfig> = {}): SdkConfig {
  return {
    output: source.output ?? target.output,
    targets: source.targets ?? target.targets,
    namespace: source.namespace ?? target.namespace,
  };
}

/**
 * Type-safe merge for DatabaseConfig
 */
function mergeDatabaseConfig(target: DatabaseConfig, source: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return {
    uri: source.uri ?? target.uri,
    seedDataPath: source.seedDataPath ?? target.seedDataPath,
  };
}

/**
 * Type-safe merge for PackagesConfig
 */
function mergePackagesConfig(target: PackagesConfig, source: Partial<PackagesConfig> = {}): PackagesConfig {
  const result: PackagesConfig = {
    gateway: source.gateway ?? target.gateway,
    kernel: source.kernel ?? target.kernel,
  };
  // Merge additional packages from target
  for (const key of Object.keys(target)) {
    if (key !== 'gateway' && key !== 'kernel') {
      const value = target[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  // Merge additional packages from source (override)
  for (const key of Object.keys(source)) {
    if (key !== 'gateway' && key !== 'kernel') {
      const value = source[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Find the config file in the current directory
 */
export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const configPath = path.join(cwd, name);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<DevtoolsConfig> {
  const configPath = findConfigFile(cwd);

  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  try {
    // Use dynamic import for both TS and JS files
    // For TypeScript, this requires tsx or ts-node to be running
    const fileUrl = pathToFileURL(configPath).href;
    const mod = await import(fileUrl);
    const rawConfig = mod.default || mod;

    // DEV-003 FIX: Validate config structure before using
    // This prevents malformed configs from causing cryptic runtime errors
    const parseResult = PartialConfigSchema.safeParse(rawConfig);
    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      console.error(`Invalid devtools config at ${configPath}:\n${errors}`);
      console.warn('Using default configuration instead.');
      return DEFAULT_CONFIG;
    }

    const userConfig: PartialDevtoolsConfig = parseResult.data;

    // Merge with defaults using type-safe helpers
    return {
      contracts: mergeContractsConfig(DEFAULT_CONFIG.contracts, userConfig.contracts),
      routes: mergeRoutesConfig(DEFAULT_CONFIG.routes, userConfig.routes),
      sdk: mergeSdkConfig(DEFAULT_CONFIG.sdk, userConfig.sdk),
      database: mergeDatabaseConfig(DEFAULT_CONFIG.database, userConfig.database),
      packages: mergePackagesConfig(DEFAULT_CONFIG.packages, userConfig.packages),
    };
  } catch (e) {
    console.warn(`Warning: Failed to load config from ${configPath}:`, e);
    return DEFAULT_CONFIG;
  }
}

/**
 * DEV-006 FIX: Validate that a resolved path stays within the project directory.
 *
 * This prevents path traversal attacks via config values like "../../../etc".
 * All resolved paths must be within the project root (cwd).
 *
 * @param resolvedPath - The absolute path after resolution
 * @param cwd - The project root directory
 * @param configKey - Name of the config key (for error messages)
 * @throws Error if the path escapes the project directory
 */
function validatePathWithinProject(resolvedPath: string, cwd: string, configKey: string): void {
  // Normalize both paths to handle any symlinks or path variations
  const normalizedPath = path.normalize(resolvedPath);
  const normalizedCwd = path.normalize(cwd);

  // Check if the resolved path starts with the project root
  // We add a trailing separator to prevent partial matches (e.g., /home/user vs /home/username)
  const cwdWithSep = normalizedCwd.endsWith(path.sep) ? normalizedCwd : normalizedCwd + path.sep;

  if (!normalizedPath.startsWith(cwdWithSep) && normalizedPath !== normalizedCwd) {
    throw new Error(
      `Configuration error: "${configKey}" resolves to a path outside the project directory.\n` +
      `  Resolved: ${normalizedPath}\n` +
      `  Project root: ${normalizedCwd}\n` +
      `This may indicate a path traversal attempt. Please use relative paths that stay within the project.`
    );
  }
}

/**
 * Get resolved paths based on config and cwd
 *
 * DEV-006 FIX: All paths are validated to stay within the project directory.
 */
export function resolvePaths(config: DevtoolsConfig, cwd: string = process.cwd()) {
  const resolvedPaths = {
    contractsDir: path.resolve(cwd, config.contracts.dir),
    routerPath: path.resolve(cwd, config.contracts.router),
    routesOutput: path.resolve(cwd, config.routes.output),
    sdkOutput: path.resolve(cwd, config.sdk.output),
    seedDataPath: path.resolve(cwd, config.database.seedDataPath),
  };

  // DEV-006 FIX: Validate all paths stay within project
  validatePathWithinProject(resolvedPaths.contractsDir, cwd, 'contracts.dir');
  validatePathWithinProject(resolvedPaths.routerPath, cwd, 'contracts.router');
  validatePathWithinProject(resolvedPaths.routesOutput, cwd, 'routes.output');
  validatePathWithinProject(resolvedPaths.sdkOutput, cwd, 'sdk.output');
  validatePathWithinProject(resolvedPaths.seedDataPath, cwd, 'database.seedDataPath');

  return resolvedPaths;
}
