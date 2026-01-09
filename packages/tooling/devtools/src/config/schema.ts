/**
 * SDK generation targets
 * - browser: Fetch-based client for browsers
 * - server: Server-side client for Next.js RSC/API routes
 * - hooks: React Query hooks
 * - vue: Vue Query composables
 * - zod: Zod schema re-exports
 * - types: TypeScript types
 * - admin-hooks: Admin list params hooks and grid registries
 */
export type SdkTarget = 'browser' | 'server' | 'hooks' | 'vue' | 'zod' | 'types' | 'admin-hooks';

/**
 * Next.js runtime options
 */
export type Runtime = 'nodejs' | 'edge';

/**
 * Contract discovery configuration
 */
export interface ContractsConfig {
  /** Directory containing contract files */
  dir: string;
  /** Path to the main router file */
  router: string;
  /** Glob pattern for contract files */
  glob: string;
}

/**
 * Route generation configuration
 */
export interface RoutesConfig {
  /** Output directory for generated routes */
  output: string;
  /** Default Next.js runtime */
  runtime: Runtime;
}

/**
 * SDK generation configuration
 */
export interface SdkConfig {
  /** Output directory for generated SDK */
  output: string;
  /** Which SDK targets to generate */
  targets: SdkTarget[];
  /** Use namespace pattern (hooks.domain.action) */
  namespace: boolean;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** MongoDB URI (optional, falls back to env) */
  uri?: string;
  /** Path to seed data JSON file */
  seedDataPath: string;
}

/**
 * Package import mappings for generated code
 */
export interface PackagesConfig {
  gateway: string;
  kernel: string;
  [key: string]: string;
}

/**
 * Complete devtools configuration
 */
export interface DevtoolsConfig {
  contracts: ContractsConfig;
  routes: RoutesConfig;
  sdk: SdkConfig;
  database: DatabaseConfig;
  packages: PackagesConfig;
}

/**
 * Partial config for user overrides
 */
export type PartialDevtoolsConfig = {
  contracts?: Partial<ContractsConfig>;
  routes?: Partial<RoutesConfig>;
  sdk?: Partial<SdkConfig>;
  database?: Partial<DatabaseConfig>;
  packages?: Partial<PackagesConfig>;
};

/**
 * Helper function for defining config with type safety
 */
export function defineConfig(config: PartialDevtoolsConfig): PartialDevtoolsConfig {
  return config;
}
