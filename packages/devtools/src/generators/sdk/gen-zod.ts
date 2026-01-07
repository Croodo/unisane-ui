/**
 * Zod schema generation
 *
 * Re-exports Zod schemas from ts-rest contracts for runtime validation.
 * Generates a barrel file that re-exports all request/response schemas
 * organized by domain.
 */
import * as path from 'node:path';
import { header, pascalCase, isAdminRoute } from './utils.js';
import { parseRouterImports, collectRouteGroups } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';
import type { RouteGroup } from './types.js';

export interface GenZodOptions {
  /** Output file path */
  output: string;
  /** App router object */
  appRouter: unknown;
  /** Path to router source file */
  routerPath: string;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Generate Zod schema re-exports
 */
export async function genZod(options: GenZodOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  const headerComment = header('sdk:gen --zod');

  // Generate imports for all contracts
  const contractImports = groups
    .map((g) => `import { ${g.varName} } from '${g.importPath}';`)
    .join('\n');

  // Generate schema extraction helpers
  const schemaHelpers = generateSchemaHelpers();

  // Generate schema exports per domain
  const domainSchemas = groups
    .map((g) => generateDomainSchemas(g))
    .filter(Boolean)
    .join('\n\n');

  // Generate namespace object
  const schemaNamespace = generateSchemaNamespace(groups);

  const content = [
    headerComment,
    `/* eslint-disable @typescript-eslint/no-explicit-any */`,
    `import { z } from 'zod';`,
    contractImports,
    '',
    schemaHelpers,
    '',
    domainSchemas,
    '',
    schemaNamespace,
  ].join('\n');

  if (!dryRun) {
    await ensureDir(path.dirname(output));
    await writeText(output, content);
  }
}

/**
 * Generate schema extraction helper functions
 */
function generateSchemaHelpers(): string {
  return `
/**
 * Extract body schema from a route definition
 */
function getBodySchema<T extends { body?: z.ZodTypeAny }>(route: T): T['body'] {
  return route.body;
}

/**
 * Extract query schema from a route definition
 */
function getQuerySchema<T extends { query?: z.ZodTypeAny }>(route: T): T['query'] {
  return route.query;
}

/**
 * Extract params schema from a route definition
 */
function getParamsSchema<T extends { pathParams?: z.ZodTypeAny }>(route: T): T['pathParams'] {
  return route.pathParams;
}

/**
 * Extract response schema from a route definition
 */
function getResponseSchema<T extends { responses?: Record<number, { body?: z.ZodTypeAny }> }>(
  route: T,
  status: number = 200
): z.ZodTypeAny | undefined {
  const response = route.responses?.[status];
  if (!response) return undefined;
  // Response body might be wrapped in { body: schema } or be the schema directly
  if ('body' in response) return response.body;
  return response as unknown as z.ZodTypeAny;
}

type SchemaSet = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  response?: z.ZodTypeAny;
};
`;
}

/**
 * Generate schema exports for a domain
 */
function generateDomainSchemas(group: RouteGroup): string {
  const routes = group.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
  if (!routes.length) return '';

  const Group = pascalCase(group.name);

  const schemas = routes.map((r) => {
    const Op = pascalCase(r.name);
    const routeRef = `${group.varName}['${r.name}']`;

    return `/** Schemas for ${group.name}.${r.name} (${r.method} ${r.path}) */
export const ${group.name}${Op}Schemas = {
  body: getBodySchema(${routeRef} as any),
  query: getQuerySchema(${routeRef} as any),
  params: getParamsSchema(${routeRef} as any),
  response: getResponseSchema(${routeRef} as any, 200),
} as const satisfies SchemaSet;`;
  }).join('\n\n');

  return `// ═══════════════════════════════════════════════════════════════════════════════
// ${Group} Schemas
// ═══════════════════════════════════════════════════════════════════════════════

${schemas}`;
}

/**
 * Generate namespace object for organized access
 */
function generateSchemaNamespace(groups: RouteGroup[]): string {
  const namespaceEntries = groups
    .map((g) => {
      const routes = g.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
      if (!routes.length) return '';

      const routeEntries = routes
        .map((r) => {
          const Op = pascalCase(r.name);
          return `    ${r.name}: ${g.name}${Op}Schemas,`;
        })
        .join('\n');

      return `  ${g.name}: {\n${routeEntries}\n  },`;
    })
    .filter(Boolean)
    .join('\n');

  return `/**
 * Namespace object for organized schema access
 *
 * Usage:
 *   schemas.users.create.body.parse(data)
 *   schemas.billing.getInvoice.response.parse(response)
 */
export const schemas = {
${namespaceEntries}
} as const;

/**
 * Helper to validate request body
 */
export function validateBody<T extends keyof typeof schemas>(
  domain: T,
  operation: keyof typeof schemas[T],
  data: unknown
): z.SafeParseReturnType<unknown, unknown> {
  const schema = (schemas[domain] as any)[operation]?.body;
  if (!schema) return { success: true, data } as any;
  return schema.safeParse(data);
}

/**
 * Helper to validate query params
 */
export function validateQuery<T extends keyof typeof schemas>(
  domain: T,
  operation: keyof typeof schemas[T],
  data: unknown
): z.SafeParseReturnType<unknown, unknown> {
  const schema = (schemas[domain] as any)[operation]?.query;
  if (!schema) return { success: true, data } as any;
  return schema.safeParse(data);
}

/**
 * Helper to validate path params
 */
export function validateParams<T extends keyof typeof schemas>(
  domain: T,
  operation: keyof typeof schemas[T],
  data: unknown
): z.SafeParseReturnType<unknown, unknown> {
  const schema = (schemas[domain] as any)[operation]?.params;
  if (!schema) return { success: true, data } as any;
  return schema.safeParse(data);
}

/**
 * Helper to validate response
 */
export function validateResponse<T extends keyof typeof schemas>(
  domain: T,
  operation: keyof typeof schemas[T],
  data: unknown
): z.SafeParseReturnType<unknown, unknown> {
  const schema = (schemas[domain] as any)[operation]?.response;
  if (!schema) return { success: true, data } as any;
  return schema.safeParse(data);
}
`;
}
