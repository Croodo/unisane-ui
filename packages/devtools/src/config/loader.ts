import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DevtoolsConfig, PartialDevtoolsConfig, ContractsConfig, RoutesConfig, SdkConfig, DatabaseConfig, PackagesConfig } from './schema.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { existsSync } from '../utils/fs.js';

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
    const userConfig: PartialDevtoolsConfig = mod.default || mod;

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
 * Get resolved paths based on config and cwd
 */
export function resolvePaths(config: DevtoolsConfig, cwd: string = process.cwd()) {
  return {
    contractsDir: path.resolve(cwd, config.contracts.dir),
    routerPath: path.resolve(cwd, config.contracts.router),
    routesOutput: path.resolve(cwd, config.routes.output),
    sdkOutput: path.resolve(cwd, config.sdk.output),
    seedDataPath: path.resolve(cwd, config.database.seedDataPath),
  };
}
