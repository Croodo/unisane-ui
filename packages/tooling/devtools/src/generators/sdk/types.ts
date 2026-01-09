/**
 * Types for SDK generation
 */
import type { SdkTarget } from '../../config/schema.js';

// Re-export SdkTarget for convenience
export type { SdkTarget };

/**
 * Route entry from the app router
 */
export interface AppRouteEntry {
  name: string;
  method: string;
  path: string;
  hasBody: boolean;
  bodyOptional: boolean;
  metaOp?: string;
}

/**
 * Group of routes
 */
export interface RouteGroup {
  name: string;
  varName: string;
  importPath: string;
  routes: AppRouteEntry[];
}

/**
 * Alias entry for namespaced operations
 */
export interface AliasEntry {
  ns: 'admin' | 'tenant' | 'public' | 'me';
  group: string;
  name: string;
  sourceGroup: string;
  sourceOp: string;
  method: string;
  path: string;
}

/**
 * Import map entry
 */
export interface ImportMapEntry {
  varName: string;
  importPath: string;
}

/**
 * SDK generation options
 */
export interface SdkGenOptions {
  /** Output directory for generated files */
  outputDir: string;
  /** SDK namespace (e.g., 'unisane') */
  namespace?: string;
  /** Generate only specific targets */
  targets?: SdkTarget[];
  /** Path to contracts directory */
  contractsDir: string;
  /** Path to router file */
  routerPath: string;
  /** Use @unisane/* package imports */
  usePackages?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
}
