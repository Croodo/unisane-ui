/**
 * Browser client generation
 *
 * Generates typed fetch-based API client for browser usage.
 * Uses extracted types instead of contract imports to avoid pulling in Node.js-only modules.
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

export interface GenBrowserOptions {
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
 * Generate browser API client
 */
export async function genBrowser(options: GenBrowserOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  const headerComment = header('sdk:gen --clients');

  // Generate type imports from extracted types (instead of contracts)
  const typeImports = generateExtractedTypeImports(groups);

  // Generate type aliases (simplified, no contract imports)
  const typeAliases = generateTypeAliases(groups);

  // Generate the browser client code
  const clientCode = generateBrowserClientCode(groups);

  // Generate API type definitions
  const apiTypes = generateBrowserApiTypes(groups);

  // Generate the browserApi factory function
  const browserApiFactory = generateBrowserApiFactory(groups);

  const content = [
    headerComment,
    `import { HEADER_NAMES } from '@unisane/gateway/client';`,
    '',
    typeImports,
    '',
    typeAliases,
    '',
    `type DataOf<T> = T extends { data: infer D } ? D : T;`,
    '',
    clientCode,
    '',
    apiTypes,
    '',
    browserApiFactory,
  ].join('\n');

  if (!dryRun) {
    await ensureDir(path.dirname(output));
    await writeText(output, content);
  }
}

/**
 * Generate imports from extracted type files
 */
function generateExtractedTypeImports(groups: RouteGroup[]): string {
  const imports: string[] = [];

  for (const g of groups) {
    // Include all routes (including admin) since we use extracted types
    const routes = g.routes;
    if (!routes.length) continue;

    const Group = pascalCase(g.name);
    const typeNames: string[] = [];

    for (const r of routes) {
      const Op = pascalCase(r.name);
      typeNames.push(`${Group}${Op}Request`);
      typeNames.push(`${Group}${Op}Response`);
    }

    imports.push(`import type {
  ${typeNames.join(',\n  ')}
} from '../../types/generated/${g.name}.types';`);
  }

  return imports.join('\n\n');
}

/**
 * Generate type aliases mapping from extracted types
 */
function generateTypeAliases(groups: RouteGroup[]): string {
  const lines: string[] = [];

  for (const g of groups) {
    // Include all routes (including admin) since we use extracted types
    const routes = g.routes;

    for (const r of routes) {
      const Group = pascalCase(g.name);
      const Op = pascalCase(r.name);

      // T = Full request type (from extracted types)
      // P = params extraction
      // Q = query extraction
      // B = body extraction
      // R = response type (from extracted types)
      // PV = first param value (for single-param convenience)
      const T = `T${Group}${Op}`;
      const P = `P${Group}${Op}`;
      const Q = `Q${Group}${Op}`;
      const B = `B${Group}${Op}`;
      const R = `R${Group}${Op}`;
      const PV = `PV${Group}${Op}`;

      // Map to extracted types
      lines.push(`type ${T} = ${Group}${Op}Request;`);
      lines.push(`type ${P} = ${T} extends { params: infer X } ? X : never;`);
      lines.push(`type ${Q} = ${T} extends { query: infer X } ? X : never;`);
      lines.push(`type ${B} = ${T} extends { body: infer X } ? X : never;`);
      lines.push(`type ${R} = DataOf<${Group}${Op}Response>;`);
      lines.push(`type ${PV} = [keyof ${P}] extends [never] ? never : ${P}[keyof ${P}];`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate core browser client utilities
 */
function generateBrowserClientCode(groups: RouteGroup[]): string {
  return `
function hasHeader(h: Record<string, string>, name: string): boolean {
  const lower = name.toLowerCase();
  return Object.keys(h).some((k) => k.toLowerCase() === lower);
}

/** Base64url encode for filter serialization */
function base64UrlEncode(input: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'utf8').toString('base64url');
    }
    const ascii = btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
    return ascii.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

function buildUrl(pathTpl: string, params?: Record<string, unknown>, query?: Record<string, unknown>): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();
  let p = pathTpl;
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) p = p.replace(new RegExp(':'+k+'(?![a-zA-Z0-9_])','g'), encodeURIComponent(String(v)));
  }
  const urlStr = (base ? base + p : p);
  const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost';
  const url = new URL(urlStr, origin);
  if (query && typeof query === 'object') {
    for (const [k, v] of Object.entries(query)) {
      if (typeof v === 'undefined' || v === null) continue;
      let val: string;
      if (k === 'filters' && typeof v === 'object') {
        // Filters use base64url-encoded JSON for URL safety
        val = base64UrlEncode(JSON.stringify(v));
      } else if (typeof v === 'object') {
        val = JSON.stringify(v);
      } else {
        val = String(v);
      }
      if (val) url.searchParams.set(k, val);
    }
  }
  return url.toString();
}

async function ensureCsrfToken(): Promise<string | undefined> {
  if (typeof document === 'undefined') return undefined;
  const cookie = document.cookie ?? '';
  const token = cookie.split(';').map((s) => s.trim()).find((p) => p.startsWith('csrf_token='))?.split('=')[1];
  if (token) return token;
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();
    const res = await fetch(base + '/api/auth/csrf', { method: 'GET', credentials: 'include' });
    const json = (await res.json().catch(() => ({}))) as { token?: string };
    return json?.token ?? undefined;
  } catch { return undefined; }
}

async function doFetch<R>(
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: unknown,
  query?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<R> {
  const h: Record<string, string> = { ...(headers ?? {}) };
  if (!hasHeader(h, HEADER_NAMES.REQUEST_ID)) h[HEADER_NAMES.REQUEST_ID] = crypto.randomUUID();
  const isWrite = ['POST','PATCH','PUT','DELETE'].includes(method.toUpperCase()) || typeof body !== 'undefined';
  if (isWrite && !hasHeader(h, HEADER_NAMES.IDEMPOTENCY_KEY)) h[HEADER_NAMES.IDEMPOTENCY_KEY] = crypto.randomUUID();
  if (isWrite && !hasHeader(h, HEADER_NAMES.AUTHORIZATION) && !hasHeader(h, HEADER_NAMES.CSRF_TOKEN)) {
    const csrf = await ensureCsrfToken();
    if (csrf) h[HEADER_NAMES.CSRF_TOKEN] = csrf;
  }
  const url = buildUrl(path, params, query);
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...h },
    ...(typeof body !== 'undefined' ? { body: JSON.stringify(body) } : {}),
  });
  const status = res.status;
  const jsonUnknown: unknown = await res.json().catch(() => undefined);
  if (status >= 400) {
    const jsonObj = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : {};
    const errObj = (jsonObj['error'] as { code?: unknown; message?: unknown; requestId?: unknown; fields?: unknown } | undefined) ?? {};
    const e: Error & { status?: number; code?: string; requestId?: string; fields?: unknown } = new Error(
      typeof errObj?.message === 'string' ? (errObj.message as string) : 'HTTP_ERROR'
    );
    e.status = status;
    if (typeof errObj?.code === 'string') e.code = errObj.code;
    if (typeof errObj?.requestId === 'string') e.requestId = errObj.requestId as string;
    if (typeof errObj?.fields !== 'undefined') e.fields = errObj.fields;
    throw e;
  }
  const jsonOk = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : ({} as Record<string, unknown>);
  const b = (jsonOk['body'] ?? jsonUnknown) as unknown;
  if (b && typeof b === 'object' && 'data' in (b as Record<string, unknown>)) return (b as { data: unknown }).data as R;
  return b as R;
}`;
}

/**
 * Generate BrowserApi type definition with nested admin namespace
 */
function generateBrowserApiTypes(groups: RouteGroup[]): string {
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

  return `export type BrowserApi = {\n${regularTypes}${adminType}\n};`;
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
      if (bodyOptional) {
        lines.push(`${indent}${opName}(): Promise<${R}>;`);
      }
    } else if (singleParam) {
      lines.push(`${indent}${opName}(param: ${PV}, body: ${B}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(param: ${PV}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) {
        lines.push(`${indent}${opName}(param: ${PV}): Promise<${R}>;`);
      }
    } else {
      lines.push(`${indent}${opName}(params: ${P}, body: ${B}): Promise<${R}>;`);
      lines.push(`${indent}${opName}(params: ${P}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) {
        lines.push(`${indent}${opName}(params: ${P}): Promise<${R}>;`);
      }
    }
  }

  lines.push(`${indent}${opName}(args?: ${T}): Promise<${R}>;`);

  if (m === 'GET') {
    lines.push(`${indent}${opName}OrNull(args?: ${T}): Promise<${R} | null>;`);
  }

  return lines.join('\n');
}

/**
 * Generate the browserApi factory function with nested admin namespace
 */
function generateBrowserApiFactory(groups: RouteGroup[]): string {
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

  return `export async function browserApi(): Promise<BrowserApi> {
  const out: Record<string, unknown> = {};${adminInit}
${regularImpls}
${adminImpls}
  return out as unknown as BrowserApi;
}`;
}

/**
 * Generate implementation for a single route
 */
function generateRouteImplementation(g: RouteGroup, r: AppRouteEntry, isAdmin: boolean): string {
  const m = r.method.toUpperCase();
  const hasBody = r.hasBody;
  const bodyOptional = r.bodyOptional;
  const paramNames = extractParamNames(r.path);
  const singleParam = paramNames.length === 1;
  const isWrite = ['POST', 'PATCH', 'PUT'].includes(m);

  // For admin routes, use the stripped operation name and nested path
  const opName = isAdmin ? getAdminOpName(r.name) : r.name;
  const targetPath = isAdmin ? `(out['admin'] as Record<string, unknown>)['${g.name}']` : `out['${g.name}']`;
  const initPath = isAdmin
    ? `  (out['admin'] as Record<string, unknown>)['${g.name}'] = (out['admin'] as Record<string, unknown>)['${g.name}'] ?? {};`
    : `  out['${g.name}'] = out['${g.name}'] ?? {};`;

  // Generate argument parsing logic
  // Note: We cast query assignments to Record<string, unknown> because args[n] is typed as unknown
  let argParsing: string;
  if (!hasBody) {
    if (paramNames.length === 0) {
      argParsing = `if (!isFull) { if (args.length >= 1) a.query = args[0] as Record<string, unknown>; }`;
    } else if (singleParam) {
      const p = paramNames[0];
      argParsing = `if (!isFull) { if (args.length >= 1) a.params = { ${p}: args[0] }; if (args.length >= 2) a.query = args[1] as Record<string, unknown>; }`;
    } else {
      argParsing = `if (!isFull) { if (args.length >= 1) a.params = args[0]; if (args.length >= 2) a.query = args[1] as Record<string, unknown>; }`;
    }
  } else {
    if (paramNames.length === 0) {
      argParsing = `if (!isFull) { if (args.length >= 1) a.body = args[0]; if (args.length >= 2) a.query = args[1] as Record<string, unknown>; }`;
    } else if (singleParam) {
      const p = paramNames[0];
      argParsing = bodyOptional
        ? `if (!isFull) { if (args.length >= 1) a.params = { ${p}: args[0] }; if (args.length >= 2) a.body = args[1]; if (args.length >= 3) a.query = args[2] as Record<string, unknown>; }`
        : `if (!isFull) { if (args.length >= 2) { a.params = { ${p}: args[0] }; a.body = args[1]; if (args.length >= 3) a.query = args[2] as Record<string, unknown>; } }`;
    } else {
      argParsing = bodyOptional
        ? `if (!isFull) { if (args.length >= 1) a.params = args[0]; if (args.length >= 2) a.body = args[1]; if (args.length >= 3) a.query = args[2] as Record<string, unknown>; }`
        : `if (!isFull) { if (args.length >= 2) { a.params = args[0]; a.body = args[1]; if (args.length >= 3) a.query = args[2] as Record<string, unknown>; } }`;
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
    const isFull = first && typeof first === 'object' && (('params' in first) || ('query' in first) || ('body' in first) || ('headers' in first));
    const a = (isFull ? first : {}) as { params?: unknown; query?: unknown; body?: unknown; headers?: Record<string, string> };
    ${argParsing}
    const headers = { ...(a.headers ?? {}) } as Record<string, string>;
    if (!hasHeader(headers, HEADER_NAMES.REQUEST_ID)) headers[HEADER_NAMES.REQUEST_ID] = crypto.randomUUID();
    const isWrite = ${isWrite} || Object.prototype.hasOwnProperty.call(a, 'body');
    if (isWrite && !hasHeader(headers, HEADER_NAMES.IDEMPOTENCY_KEY)) headers[HEADER_NAMES.IDEMPOTENCY_KEY] = crypto.randomUUID();
    if (isWrite && !hasHeader(headers, HEADER_NAMES.AUTHORIZATION) && !hasHeader(headers, HEADER_NAMES.CSRF_TOKEN)) {
      const csrf = await ensureCsrfToken();
      if (csrf) headers[HEADER_NAMES.CSRF_TOKEN] = csrf;
    }
    return doFetch('${m}', '${r.path}', a.params as Record<string, unknown>, a.body, a.query as Record<string, unknown>, headers);
  };${orNullMethod}`;
}
