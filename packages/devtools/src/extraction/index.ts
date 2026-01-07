/**
 * Contract metadata extraction module
 *
 * Provides AST-based parsing of defineOpMeta() calls from ts-rest
 * contract files for code generation.
 */

// Types
export type {
  ZodRef,
  CallArg,
  AuditConfig,
  FactoryRef,
  RouteGenEntry,
  Op,
  OpWithMeta,
} from './types.js';

// Metadata extraction
export { extractRouteMeta, summarizeMeta } from './meta-extract.js';
export type { ExtractOptions } from './meta-extract.js';

// Operation discovery
export {
  collectOps,
  mergeOpsWithMeta,
  apiPathToAppRouterPath,
  toWrapperPath,
  toSidecarPath,
  groupOpsByPath,
  getUniquePaths,
} from './discover.js';

// Low-level AST helpers (for advanced use)
export {
  getStringProp,
  getBoolProp,
  getObjProp,
  getRawProp,
  parseLiteralValue,
  stripQuotes,
} from './ast-helpers.js';

// Parsers
export {
  parseZodRef,
  parseFactoryRef,
  parseAuditConfig,
  parseCallArgs,
  parseExtraImports,
  parseServiceEntry,
} from './parsers.js';
