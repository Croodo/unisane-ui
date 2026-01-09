/**
 * Extracted types generation
 *
 * Generates standalone TypeScript type definitions from ts-rest contracts.
 * These types are computed at code-gen time, avoiding runtime contract imports.
 *
 * This allows generated hooks to be 100% browser-safe without importing
 * contracts that may transitively depend on Node.js modules.
 */
import * as path from 'node:path';
import { z } from 'zod';
import { header, pascalCase } from './utils.js';
import { parseRouterImports, collectRouteGroups } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';
import type { RouteGroup, AppRouteEntry } from './types.js';

export interface GenExtractedTypesOptions {
  /** Output directory path */
  output: string;
  /** App router object */
  appRouter: unknown;
  /** Path to router source file */
  routerPath: string;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Generate extracted types from contracts
 *
 * Creates standalone type definitions that don't require contract imports,
 * enabling browser-safe SDK hooks.
 */
export async function genExtractedTypes(options: GenExtractedTypesOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  // Create directories
  if (!dryRun) {
    await ensureDir(output);
  }

  // Generate types for each domain
  for (const group of groups) {
    const domainTypes = generateDomainTypes(group, appRouter);
    if (!dryRun && domainTypes) {
      await writeText(path.join(output, `${group.name}.types.ts`), domainTypes);
    }
  }

  // Generate barrel file
  const barrel = generateTypesBarrel(groups);
  if (!dryRun) {
    await writeText(path.join(output, 'index.ts'), barrel);
  }
}

/**
 * Generate types for a single domain
 */
function generateDomainTypes(group: RouteGroup, appRouter: unknown): string | null {
  const headerComment = header('sdk:gen --types');
  // Include all routes (including admin) for complete type coverage
  const routes = group.routes;

  if (!routes.length) return null;

  const types: string[] = [];
  const Group = pascalCase(group.name);

  for (const route of routes) {
    const Op = pascalCase(route.name);
    const routeTypes = generateRouteTypes(group, route, Group, Op, appRouter);
    types.push(routeTypes);
  }

  return `${headerComment}
// @ts-nocheck - Generated types

// ═══════════════════════════════════════════════════════════════════════════════
// ${Group} Types (extracted from contracts at code-gen time)
// ═══════════════════════════════════════════════════════════════════════════════

${types.join('\n\n')}
`;
}

/**
 * Generate request and response types for a route
 */
function generateRouteTypes(
  group: RouteGroup,
  route: AppRouteEntry,
  Group: string,
  Op: string,
  appRouter: unknown
): string {
  // Access the actual route object from the router
  const routerObj = appRouter as Record<string, Record<string, unknown>>;
  const routeObj = routerObj?.[group.name]?.[route.name] as {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    pathParams?: z.ZodTypeAny;
    responses?: Record<number, z.ZodTypeAny | { body?: z.ZodTypeAny }>;
  } | undefined;

  // Generate request type
  const requestParts: string[] = [];

  // Extract params type
  if (routeObj?.pathParams) {
    const paramsType = zodToTypeString(routeObj.pathParams);
    requestParts.push(`params: ${paramsType}`);
  } else if (route.path.includes(':')) {
    // Fallback: extract param names from path
    const paramNames = extractPathParams(route.path);
    if (paramNames.length > 0) {
      const paramsObj = paramNames.map((p) => `${p}: string`).join('; ');
      requestParts.push(`params: { ${paramsObj} }`);
    }
  }

  // Extract query type
  if (routeObj?.query) {
    const queryType = zodToTypeString(routeObj.query);
    requestParts.push(`query?: ${queryType}`);
  }

  // Extract body type
  if (routeObj?.body) {
    const bodyType = zodToTypeString(routeObj.body);
    const isOptional = isZodOptional(routeObj.body);
    requestParts.push(`body${isOptional ? '?' : ''}: ${bodyType}`);
  }

  const requestType = requestParts.length > 0
    ? `{ ${requestParts.join('; ')} }`
    : 'Record<string, never>';

  // Generate response type
  let responseType = 'unknown';
  if (routeObj?.responses) {
    const res200 = routeObj.responses[200];
    if (res200) {
      const schema = (res200 as { body?: z.ZodTypeAny }).body ?? res200;
      if (schema && typeof schema === 'object' && '_def' in schema) {
        responseType = zodToTypeString(schema as z.ZodTypeAny);
      }
    }
  }

  // Unwrap response data if wrapped in { data: T }
  const unwrappedResponse = extractDataType(responseType);

  return `/** ${route.method} ${route.path} */
export type ${Group}${Op}Request = ${requestType};
export type ${Group}${Op}Response = ${unwrappedResponse};`;
}

/**
 * Extract path parameters from a route path
 */
function extractPathParams(pathStr: string): string[] {
  const matches = pathStr.matchAll(/:([a-zA-Z0-9_]+)/g);
  return Array.from(matches).map((m) => m[1] as string);
}

/**
 * Check if a Zod schema is optional
 */
function isZodOptional(schema: z.ZodTypeAny): boolean {
  const def = (schema as unknown as { _def?: { typeName?: string } })._def;
  return def?.typeName === 'ZodOptional' || def?.typeName === 'ZodNullable';
}

/**
 * Convert a Zod schema to a TypeScript type string
 *
 * This function inspects the Zod schema's internal structure
 * and generates equivalent TypeScript type syntax.
 */
function zodToTypeString(schema: z.ZodTypeAny, depth = 0): string {
  if (depth > 10) return 'unknown'; // Prevent infinite recursion

  const def = (schema as unknown as { _def: ZodDef })._def;
  if (!def) return 'unknown';

  const typeName = def.typeName as string;

  switch (typeName) {
    case 'ZodString':
      return 'string';

    case 'ZodNumber':
      return 'number';

    case 'ZodBoolean':
      return 'boolean';

    case 'ZodBigInt':
      return 'bigint';

    case 'ZodDate':
      return 'Date';

    case 'ZodUndefined':
      return 'undefined';

    case 'ZodNull':
      return 'null';

    case 'ZodVoid':
      return 'void';

    case 'ZodAny':
      return 'any';

    case 'ZodUnknown':
      return 'unknown';

    case 'ZodNever':
      return 'never';

    case 'ZodLiteral':
      return serializeLiteral(def.value);

    case 'ZodEnum': {
      const values = def.values as string[];
      return values.map((v) => `"${v}"`).join(' | ');
    }

    case 'ZodNativeEnum': {
      // For native enums, output union of string literals
      const enumObj = def.values as Record<string, string | number>;
      const vals = Object.values(enumObj).filter((v) => typeof v === 'string');
      if (vals.length > 0) {
        return vals.map((v) => `"${v}"`).join(' | ');
      }
      return 'string | number';
    }

    case 'ZodArray': {
      const innerType = zodToTypeString(def.type as z.ZodTypeAny, depth + 1);
      return `${innerType}[]`;
    }

    case 'ZodObject': {
      const shape = def.shape?.() as Record<string, z.ZodTypeAny> | undefined;
      if (!shape) return 'Record<string, unknown>';

      const entries = Object.entries(shape).map(([key, val]) => {
        const isOpt = isZodOptional(val);
        const valType = zodToTypeString(val, depth + 1);
        return `${key}${isOpt ? '?' : ''}: ${valType}`;
      });

      if (entries.length === 0) return 'Record<string, never>';
      return `{ ${entries.join('; ')} }`;
    }

    case 'ZodRecord': {
      const keyType = def.keyType ? zodToTypeString(def.keyType as z.ZodTypeAny, depth + 1) : 'string';
      const valueType = def.valueType ? zodToTypeString(def.valueType as z.ZodTypeAny, depth + 1) : 'unknown';
      return `Record<${keyType}, ${valueType}>`;
    }

    case 'ZodMap': {
      const keyType = def.keyType ? zodToTypeString(def.keyType as z.ZodTypeAny, depth + 1) : 'unknown';
      const valueType = def.valueType ? zodToTypeString(def.valueType as z.ZodTypeAny, depth + 1) : 'unknown';
      return `Map<${keyType}, ${valueType}>`;
    }

    case 'ZodSet': {
      const valueType = def.valueType ? zodToTypeString(def.valueType as z.ZodTypeAny, depth + 1) : 'unknown';
      return `Set<${valueType}>`;
    }

    case 'ZodTuple': {
      const items = def.items as z.ZodTypeAny[] | undefined;
      if (!items) return 'unknown[]';
      const types = items.map((t) => zodToTypeString(t, depth + 1));
      return `[${types.join(', ')}]`;
    }

    case 'ZodUnion': {
      const options = def.options as z.ZodTypeAny[] | undefined;
      if (!options) return 'unknown';
      return options.map((o) => zodToTypeString(o, depth + 1)).join(' | ');
    }

    case 'ZodDiscriminatedUnion': {
      const options = def.options as z.ZodTypeAny[] | undefined;
      if (!options) return 'unknown';
      return options.map((o) => zodToTypeString(o, depth + 1)).join(' | ');
    }

    case 'ZodIntersection': {
      const left = zodToTypeString(def.left as z.ZodTypeAny, depth + 1);
      const right = zodToTypeString(def.right as z.ZodTypeAny, depth + 1);
      return `${left} & ${right}`;
    }

    case 'ZodOptional': {
      const innerType = zodToTypeString(def.innerType as z.ZodTypeAny, depth + 1);
      return `${innerType} | undefined`;
    }

    case 'ZodNullable': {
      const innerType = zodToTypeString(def.innerType as z.ZodTypeAny, depth + 1);
      return `${innerType} | null`;
    }

    case 'ZodDefault': {
      return zodToTypeString(def.innerType as z.ZodTypeAny, depth + 1);
    }

    case 'ZodCatch': {
      return zodToTypeString(def.innerType as z.ZodTypeAny, depth + 1);
    }

    case 'ZodPromise': {
      const innerType = zodToTypeString(def.type as z.ZodTypeAny, depth + 1);
      return `Promise<${innerType}>`;
    }

    case 'ZodFunction': {
      // Functions are complex, simplify to generic function type
      return '(...args: unknown[]) => unknown';
    }

    case 'ZodLazy': {
      // For lazy types, try to resolve
      try {
        const getter = def.getter as () => z.ZodTypeAny;
        return zodToTypeString(getter(), depth + 1);
      } catch {
        return 'unknown';
      }
    }

    case 'ZodEffects': {
      // Effects (transform, refine) - use the inner schema type
      const innerSchema = def.schema as z.ZodTypeAny | undefined;
      if (innerSchema) {
        return zodToTypeString(innerSchema, depth + 1);
      }
      return 'unknown';
    }

    case 'ZodBranded': {
      // Branded types - just use the underlying type
      const innerType = def.type as z.ZodTypeAny | undefined;
      if (innerType) {
        return zodToTypeString(innerType, depth + 1);
      }
      return 'unknown';
    }

    case 'ZodPipeline': {
      // Pipeline - use the output type
      const out = def.out as z.ZodTypeAny | undefined;
      if (out) {
        return zodToTypeString(out, depth + 1);
      }
      return 'unknown';
    }

    case 'ZodReadonly': {
      const innerType = zodToTypeString(def.innerType as z.ZodTypeAny, depth + 1);
      return `Readonly<${innerType}>`;
    }

    default:
      return 'unknown';
  }
}

/**
 * Type for Zod internal definition
 */
interface ZodDef {
  typeName?: string;
  value?: unknown;
  values?: unknown;
  type?: unknown;
  shape?: () => Record<string, z.ZodTypeAny>;
  keyType?: unknown;
  valueType?: unknown;
  items?: unknown[];
  options?: unknown[];
  left?: unknown;
  right?: unknown;
  innerType?: unknown;
  schema?: unknown;
  getter?: () => z.ZodTypeAny;
  out?: unknown;
}

/**
 * Serialize a literal value to TypeScript
 */
function serializeLiteral(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return 'unknown';
}

/**
 * Extract the data type from a wrapped response
 *
 * If the response is { data: T }, return T
 * Otherwise return the original type
 */
function extractDataType(typeStr: string): string {
  // Check for { data: T } pattern
  const dataMatch = typeStr.match(/^\{\s*data:\s*(.+?)(?:;\s*[^}]+)?\s*\}$/);
  if (dataMatch) {
    return dataMatch[1]?.trim() ?? typeStr;
  }

  // Check for { data?: T } pattern
  const optDataMatch = typeStr.match(/^\{\s*data\?:\s*(.+?)(?:;\s*[^}]+)?\s*\}$/);
  if (optDataMatch) {
    return `${optDataMatch[1]?.trim()} | undefined`;
  }

  return typeStr;
}

/**
 * Generate barrel file for all domain types
 */
function generateTypesBarrel(groups: RouteGroup[]): string {
  const headerComment = header('sdk:gen --types');

  // Include all groups (including those with admin routes)
  const exports = groups
    .filter((g) => g.routes.length > 0)
    .map((g) => `export * from './${g.name}.types';`)
    .join('\n');

  return `${headerComment}
// Barrel export for all extracted types

${exports}
`;
}
