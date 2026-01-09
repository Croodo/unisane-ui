/**
 * Server client generation
 *
 * Generates typed API client for server-side usage (Next.js RSC, API routes).
 *
 * Structure:
 * - api.domain.operation() - Regular routes
 * - api.admin.domain.operation() - Admin routes (nested under admin namespace)
 */
import * as path from 'node:path';
import { header, pascalCase, extractParamNames } from './utils.js';
import { parseRouterImports, collectRouteGroups } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';
import type { RouteGroup, AppRouteEntry } from './types.js';

export interface GenServerOptions {
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
 * Check if a route is an admin route
 */
function isAdminRoute(route: AppRouteEntry): boolean {
  return route.name.startsWith('admin') || route.path.includes('/admin/');
}

/**
 * Get the operation name for an admin route (strip admin prefix)
 */
function getAdminOpName(name: string): string {
  // adminList -> list, adminReadOrNull -> readOrNull, adminDeadList -> deadList
  if (name.startsWith('admin')) {
    const rest = name.slice(5); // Remove 'admin'
    return rest.charAt(0).toLowerCase() + rest.slice(1);
  }
  return name;
}

/**
 * Separate routes into regular and admin routes by domain
 */
function separateRoutes(groups: RouteGroup[]): {
  regularGroups: RouteGroup[];
  adminGroups: RouteGroup[];
} {
  const regularGroups: RouteGroup[] = [];
  const adminGroups: RouteGroup[] = [];

  for (const g of groups) {
    const regularRoutes = g.routes.filter((r) => !isAdminRoute(r));
    const adminRoutes = g.routes.filter((r) => isAdminRoute(r));

    if (regularRoutes.length > 0) {
      regularGroups.push({ ...g, routes: regularRoutes });
    }
    if (adminRoutes.length > 0) {
      adminGroups.push({ ...g, routes: adminRoutes });
    }
  }

  return { regularGroups, adminGroups };
}

/**
 * Generate server API client
 */
export async function genServer(options: GenServerOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  const headerComment = header('sdk:gen --clients');

  // Generate contract imports
  const typeImports = groups
    .map((g) => `import { ${g.varName} } from '${g.importPath}';`)
    .join('\n');

  // Generate type helpers
  const typeHelpers = generateTypeHelpers(groups);

  // Generate API type definitions
  const apiTypes = generateServerApiTypes(groups);

  // Generate the serverApi factory function
  const serverApiFactory = generateServerApiFactory(groups);

  // Helper function for filter encoding (inlined in generated file)
  const filterEncoderHelper = `
/** Base64url encode filters for URL safety (matches server expectation) */
function encodeFilters(query: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!query || typeof query !== 'object') return query;
  const filters = query.filters;
  if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
    const json = JSON.stringify(filters);
    const encoded = Buffer.from(json, 'utf8').toString('base64url');
    return { ...query, filters: encoded };
  }
  return query;
}`;

  const content = [
    headerComment,
    `import { createServerContracts } from '@/src/sdk/contracts';`,
    `import type { Contracts } from '@/src/sdk/contracts';`,
    `import type { ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';`,
    typeImports,
    '',
    filterEncoderHelper,
    '',
    typeHelpers,
    '',
    `type DataOf<T> = T extends { data: infer D } ? D : T;`,
    '',
    apiTypes,
    '',
    serverApiFactory,
  ].join('\n');

  if (!dryRun) {
    await ensureDir(path.dirname(output));
    await writeText(output, content);
  }
}

/**
 * Generate type helper definitions for each route
 */
function generateTypeHelpers(groups: RouteGroup[]): string {
  const lines: string[] = [];
  lines.push(`type RouteOf<T> = Extract<T, import('@ts-rest/core').AppRoute>;`);

  for (const g of groups) {
    for (const r of g.routes) {
      const Group = pascalCase(g.name);
      const Op = pascalCase(r.name);
      const T = `T${Group}${Op}`;
      const P = `P${Group}${Op}`;
      const Q = `Q${Group}${Op}`;
      const B = `B${Group}${Op}`;
      const R = `R${Group}${Op}`;
      const PV = `PV${Group}${Op}`;

      lines.push(`type ${T} = ClientInferRequest<RouteOf<typeof ${g.varName}['${r.name}']>>;`);
      lines.push(`type ${P} = ${T} extends { params: infer X } ? X : never;`);
      lines.push(`type ${Q} = ${T} extends { query: infer X } ? X : never;`);
      lines.push(`type ${B} = ${T} extends { body: infer X } ? X : never;`);
      lines.push(`type ${R} = DataOf<ClientInferResponseBody<RouteOf<typeof ${g.varName}['${r.name}']>, 200>>;`);
      lines.push(`type ${PV} = [keyof ${P}] extends [never] ? never : ${P}[keyof ${P}];`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate ServerApi type definition with nested admin namespace
 */
function generateServerApiTypes(groups: RouteGroup[]): string {
  const { regularGroups, adminGroups } = separateRoutes(groups);

  // Generate regular domain types
  const regularTypes = regularGroups
    .map((g) => {
      const routes = g.routes;
      if (!routes.length) return '';

      const routeTypes = routes
        .map((r) => generateRouteTypeOverloads(g, r, false))
        .join('\n');

      return `  ${g.name}: {\n${routeTypes}\n  }`;
    })
    .filter(Boolean)
    .join(',\n');

  // Generate admin domain types (nested under admin namespace)
  const adminDomainTypes = adminGroups
    .map((g) => {
      const routes = g.routes;
      if (!routes.length) return '';

      const routeTypes = routes
        .map((r) => generateRouteTypeOverloads(g, r, true))
        .join('\n');

      return `    ${g.name}: {\n${routeTypes}\n    }`;
    })
    .filter(Boolean)
    .join(',\n');

  const adminType = adminDomainTypes ? `,\n  admin: {\n${adminDomainTypes}\n  }` : '';

  return `export type ServerApi = {\n${regularTypes}${adminType}\n};`;
}

/**
 * Generate type overloads for a single route
 */
function generateRouteTypeOverloads(g: RouteGroup, r: AppRouteEntry, isAdmin: boolean): string {
  const Group = pascalCase(g.name);
  const Op = pascalCase(r.name);
  const T = `T${Group}${Op}`;
  const P = `P${Group}${Op}`;
  const Q = `Q${Group}${Op}`;
  const B = `B${Group}${Op}`;
  const R = `R${Group}${Op}`;
  const PV = `PV${Group}${Op}`;
  const m = r.method.toUpperCase();
  const hasBody = r.hasBody;
  const bodyOptional = r.bodyOptional;
  const paramNames = extractParamNames(r.path);
  const hasParams = paramNames.length > 0;
  const singleParam = paramNames.length === 1;

  // For admin routes, use the stripped operation name
  const opName = isAdmin ? getAdminOpName(r.name) : r.name;
  const indent = isAdmin ? '      ' : '    ';

  const lines: string[] = [];

  if (!hasBody) {
    if (!hasParams) {
      lines.push(`${indent}${opName}(query?: ${Q}): Promise<${R}>;`);
    } else if (singleParam) {
      lines.push(`${indent}${opName}(param: ${PV}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(param: ${PV}, query: ${Q}): Promise<${R}>;`);
    } else {
      lines.push(`${indent}${opName}(params: ${P}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(params: ${P}, query: ${Q}): Promise<${R}>;`);
    }
  } else {
    if (!hasParams) {
      lines.push(`${indent}${opName}(body: ${B}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) lines.push(`${indent}${opName}(): Promise<${R}>;`);
    } else if (singleParam) {
      lines.push(`${indent}${opName}(param: ${PV}, body: ${B}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(param: ${PV}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) lines.push(`${indent}${opName}(param: ${PV}): Promise<${R}>;`);
    } else {
      lines.push(`${indent}${opName}(params: ${P}, body: ${B}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(params: ${P}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) lines.push(`${indent}${opName}(params: ${P}): Promise<${R}>;`);
    }
  }

  lines.push(`${indent}${opName}(args?: ${T}): Promise<${R}>;`);

  if (m === 'GET') {
    lines.push(`${indent}${opName}OrNull(args?: ${T}): Promise<${R} | null>;`);
  }

  return lines.join('\n');
}

/**
 * Generate the serverApi factory function with nested admin namespace
 */
function generateServerApiFactory(groups: RouteGroup[]): string {
  const { regularGroups, adminGroups } = separateRoutes(groups);

  // Generate regular route implementations
  const regularImpls = regularGroups
    .map((g) => {
      const routes = g.routes;
      if (!routes.length) return '';
      return routes.map((r) => generateRouteImplementation(g, r, false)).join('\n');
    })
    .filter(Boolean)
    .join('\n');

  // Generate admin route implementations (nested under admin namespace)
  const adminImpls = adminGroups
    .map((g) => {
      const routes = g.routes;
      if (!routes.length) return '';
      return routes.map((r) => generateRouteImplementation(g, r, true)).join('\n');
    })
    .filter(Boolean)
    .join('\n');

  const adminInit = adminGroups.length > 0 ? `\n  out['admin'] = {};` : '';

  return `export async function createServerApi(init: {
  baseUrl?: string;
  credentials?: RequestCredentials;
  validateResponse?: boolean;
  attachCsrfFromCookie?: boolean;
  attachRequestId?: boolean;
  headersExtra?: Record<string, string>;
} = {}): Promise<Contracts> {
  const { cookies, headers } = await import('next/headers');
  const rawHeaders = await headers();
  const base: Record<string, string> = {};
  (rawHeaders as { forEach: (cb: (value: string, key: string) => void) => void }).forEach((value, key) => { base[key] = value; });
  try {
    const bag = await cookies();
    const header = bag.getAll().map((c) => (c.name + '=' + encodeURIComponent(c.value))).join('; ');
    if (header) base['cookie'] = header;
  } catch {}
  const merged = { ...base, ...(init.headersExtra ?? {}) };
  let inferredBaseUrl: string | undefined = init.baseUrl;
  if (!inferredBaseUrl) {
    const proto = (merged['x-forwarded-proto'] || merged['x-forwarded-protocol'] || 'http') as string;
    const host = (merged['x-forwarded-host'] || merged['host'] || '') as string;
    if (host) inferredBaseUrl = proto + '://' + host;
  }
  const opts = {
    headers: merged,
    credentials: init.credentials ?? 'include',
    attachCsrfFromCookie: init.attachCsrfFromCookie ?? true,
    attachRequestId: init.attachRequestId ?? true,
    validateResponse: true as const,
    ...(inferredBaseUrl !== undefined ? { baseUrl: inferredBaseUrl } : {}),
  } satisfies Parameters<typeof createServerContracts>[0];
  return createServerContracts(opts);
}

export async function serverApiRaw(): Promise<Contracts> { return createServerApi(); }

export async function serverApi(): Promise<ServerApi> {
  const client = await createServerApi();
  const out: Record<string, unknown> = {};${adminInit}
${regularImpls}
${adminImpls}
  return out as unknown as ServerApi;
}`;
}

/**
 * Generate implementation for a single route
 */
function generateRouteImplementation(g: RouteGroup, r: AppRouteEntry, isAdmin: boolean): string {
  const m = r.method.toUpperCase();
  const hasBody = ['POST', 'PATCH', 'PUT'].includes(m);
  const paramNames = extractParamNames(r.path);
  const singleParam = paramNames.length === 1;

  // For admin routes, use the stripped operation name and nested path
  const opName = isAdmin ? getAdminOpName(r.name) : r.name;
  const targetPath = isAdmin ? `(out['admin'] as Record<string, unknown>)['${g.name}']` : `out['${g.name}']`;
  const initPath = isAdmin
    ? `  (out['admin'] as Record<string, unknown>)['${g.name}'] = (out['admin'] as Record<string, unknown>)['${g.name}'] ?? {};`
    : `  out['${g.name}'] = out['${g.name}'] ?? {};`;

  // Generate argument parsing logic
  let argParsing: string;
  if (!hasBody) {
    if (paramNames.length === 0) {
      argParsing = `if (!isFull) { if (args.length >= 1) a.query = args[0]; }`;
    } else if (singleParam) {
      const p = paramNames[0];
      argParsing = `if (!isFull) { if (args.length >= 1) a.params = { ${p}: args[0] }; if (args.length >= 2) a.query = args[1]; }`;
    } else {
      argParsing = `if (!isFull) { if (args.length >= 1) a.params = args[0]; if (args.length >= 2) a.query = args[1]; }`;
    }
  } else {
    if (paramNames.length === 0) {
      argParsing = `if (!isFull) { if (args.length >= 1) a.body = args[0]; if (args.length >= 2) a.query = args[1]; }`;
    } else if (singleParam) {
      const p = paramNames[0];
      argParsing = `if (!isFull) { if (args.length >= 2) { a.params = { ${p}: args[0] }; a.body = args[1]; if (args.length >= 3) a.query = args[2]; } }`;
    } else {
      argParsing = `if (!isFull) { if (args.length >= 2) { a.params = args[0]; a.body = args[1]; if (args.length >= 3) a.query = args[2]; } }`;
    }
  }

  const orNullMethod = m === 'GET' ? `
  (${targetPath} as Record<string, unknown>)['${opName}OrNull'] = async (...args: unknown[]) => {
    try {
      const fn = (${targetPath} as Record<string, unknown>)['${opName}'] as (...a: unknown[]) => Promise<unknown>;
      return await fn(...args);
    } catch (e) {
      if ((e as any)?.status === 404) return null;
      throw e;
    }
  };` : '';

  return `${initPath}
  (${targetPath} as Record<string, unknown>)['${opName}'] = async (...args: unknown[]) => {
    const first = args[0] as Record<string, unknown> | undefined;
    const isFull = first && typeof first === 'object' && (('params' in first) || ('query' in first) || ('body' in first));
    let a = (isFull ? first : {}) as { params?: unknown; query?: Record<string, unknown>; body?: unknown };
    ${argParsing}
    // Encode filters for URL safety before ts-rest serializes them
    if (a.query) a.query = encodeFilters(a.query) as Record<string, unknown>;
    const fn = (client as any)['${g.name}']['${r.name}'] as (x?: object) => Promise<{ status?: number; body?: unknown }>;
    const res = await fn(a as object);
    const r0 = res as { status?: number; body?: unknown };
    if (typeof r0.status === 'number' && r0.status >= 400) {
      const errObj = (r0.body as { error?: { message?: unknown; code?: unknown; requestId?: unknown; fields?: unknown } })?.error as any;
      const e = new Error(typeof errObj?.message === 'string' ? errObj.message : 'HTTP_ERROR');
      (e as Error & { status?: number; code?: string; requestId?: string; fields?: unknown }).status = r0.status;
      if (typeof errObj?.code === 'string') (e as any).code = errObj.code;
      if (typeof errObj?.requestId === 'string') (e as any).requestId = errObj.requestId;
      if (typeof errObj?.fields !== 'undefined') (e as any).fields = errObj.fields;
      throw e;
    }
    const b = r0.body as unknown;
    if (b && typeof b === 'object' && 'data' in (b as Record<string, unknown>)) return (b as { data: unknown }).data;
    return b;
  };${orNullMethod}`;
}
