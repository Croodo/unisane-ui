/**
 * Browser client generation
 *
 * Generates typed fetch-based API client for browser usage.
 * Uses extracted types instead of contract imports to avoid pulling in Node.js-only modules.
 *
 * Structure:
 * - clients/generated/
 *   - shared/          - Shared utilities (fetch, csrf, etc.)
 *   - domains/         - Per-domain client files
 *   - browser.ts       - Namespace export: client.domain.operation()
 *   - index.ts         - Barrel export
 */
import * as path from 'node:path';
import { header, pascalCase, extractParamNames } from './utils.js';
import { parseRouterImports, collectRouteGroups } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';
import type { RouteGroup, AppRouteEntry } from './types.js';

export interface GenBrowserOptions {
  /** Output directory path (e.g., clients/generated) */
  output: string;
  /** App router object */
  appRouter: unknown;
  /** Path to router source file */
  routerPath: string;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Check if a route is an admin route.
 *
 * **Convention:** Admin routes are identified by:
 * - Route name starting with "admin" (e.g., `adminList`, `adminReadOrNull`)
 * - Path containing "/admin/" segment (e.g., `/api/rest/v1/admin/tenants`)
 *
 * Admin routes are grouped separately in the generated SDK under `client.admin.*`
 * to distinguish them from regular tenant-scoped routes.
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
 * Generate browser API client (domain-structured)
 */
export async function genBrowser(options: GenBrowserOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  if (!dryRun) {
    await ensureDir(path.join(output, 'shared'));
    await ensureDir(path.join(output, 'domains'));
  }

  // Generate shared utilities
  const sharedFetch = generateSharedFetch();
  const sharedIndex = generateSharedIndex();

  if (!dryRun) {
    await writeText(path.join(output, 'shared/fetch.ts'), sharedFetch);
    await writeText(path.join(output, 'shared/index.ts'), sharedIndex);
  }

  // Generate domain files
  for (const g of groups) {
    const domainContent = generateDomainClient(g);
    if (!dryRun) {
      await writeText(path.join(output, `domains/${g.name}.browser.ts`), domainContent);
    }
  }

  // Generate domains index
  const domainsIndex = generateDomainsIndex(groups);
  if (!dryRun) {
    await writeText(path.join(output, 'domains/index.ts'), domainsIndex);
  }

  // Generate main browser.ts with namespace pattern
  const browserMain = generateBrowserMain(groups);
  if (!dryRun) {
    await writeText(path.join(output, 'browser.ts'), browserMain);
  }

  // Generate main index
  const mainIndex = generateMainIndex();
  if (!dryRun) {
    await writeText(path.join(output, 'index.ts'), mainIndex);
  }
}

/**
 * Generate shared fetch utilities
 */
function generateSharedFetch(): string {
  const headerComment = header('sdk:gen --clients');

  return `${headerComment}
import { HEADER_NAMES } from '@unisane/gateway/client';

export function hasHeader(h: Record<string, string>, name: string): boolean {
  const lower = name.toLowerCase();
  return Object.keys(h).some((k) => k.toLowerCase() === lower);
}

/** Base64url encode for filter serialization */
export function base64UrlEncode(input: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'utf8').toString('base64url');
    }
    const ascii = btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
    return ascii.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

export function buildUrl(pathTpl: string, params?: Record<string, unknown>, query?: Record<string, unknown>): string {
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

export async function ensureCsrfToken(): Promise<string | undefined> {
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

// Inflight request deduplication cache for GET requests
// Prevents duplicate concurrent requests to the same URL
const inflightRequests = new Map<string, Promise<unknown>>();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  // Status codes that trigger a retry
  retryableStatuses: new Set([408, 429, 500, 502, 503, 504]),
} as const;

/**
 * Determine if an error is retryable
 */
function isRetryable(error: unknown): boolean {
  // Network errors (fetch throws)
  if (error instanceof TypeError && error.message.includes('fetch')) return true;

  // HTTP errors with retryable status codes
  const status = (error as { status?: number })?.status;
  if (status && RETRY_CONFIG.retryableStatuses.has(status)) return true;

  // Specific error codes that are retryable
  const code = (error as { code?: string })?.code;
  if (code === 'RATE_LIMITED' || code === 'SERVICE_UNAVAILABLE') return true;

  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number, retryAfterHeader?: string | null): number {
  // Respect Retry-After header if present
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, RETRY_CONFIG.maxDelayMs);
    }
  }

  // Exponential backoff: baseDelay * 2^attempt with jitter
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function doFetch<R>(
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

  // For GET requests, deduplicate concurrent identical requests
  const isGet = method.toUpperCase() === 'GET';
  if (isGet) {
    const existing = inflightRequests.get(url);
    if (existing) return existing as Promise<R>;
  }

  const fetchPromise = (async () => {
    let lastError: unknown;
    let retryAfterHeader: string | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Wait before retry (skip on first attempt)
        if (attempt > 0) {
          const delay = getRetryDelay(attempt - 1, retryAfterHeader);
          await sleep(delay);
        }

        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: { 'content-type': 'application/json', ...h },
          ...(typeof body !== 'undefined' ? { body: JSON.stringify(body) } : {}),
        });

        const status = res.status;
        retryAfterHeader = res.headers.get('Retry-After');
        const jsonUnknown: unknown = await res.json().catch(() => undefined);

        if (status >= 400) {
          const jsonObj = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : {};
          const errObj = (jsonObj['error'] as { code?: unknown; message?: unknown; requestId?: unknown; fields?: unknown } | undefined) ?? {};
          const e: Error & { status?: number; code?: string; requestId?: string; fields?: unknown; retryable?: boolean } = new Error(
            typeof errObj?.message === 'string' ? (errObj.message as string) : 'HTTP_ERROR'
          );
          e.status = status;
          if (typeof errObj?.code === 'string') e.code = errObj.code;
          if (typeof errObj?.requestId === 'string') e.requestId = errObj.requestId as string;
          if (typeof errObj?.fields !== 'undefined') e.fields = errObj.fields;
          e.retryable = RETRY_CONFIG.retryableStatuses.has(status);

          // Check if we should retry
          if (isRetryable(e) && attempt < RETRY_CONFIG.maxRetries) {
            lastError = e;
            continue;
          }

          throw e;
        }

        // Success - parse and return response
        const jsonOk = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : ({} as Record<string, unknown>);
        const b = (jsonOk['body'] ?? jsonUnknown) as unknown;
        if (b && typeof b === 'object' && 'data' in (b as Record<string, unknown>)) return (b as { data: unknown }).data as R;
        return b as R;

      } catch (e) {
        lastError = e;

        // Network errors are retryable
        if (isRetryable(e) && attempt < RETRY_CONFIG.maxRetries) {
          continue;
        }

        throw e;
      }
    }

    // Should never reach here, but throw last error just in case
    throw lastError;
  })();

  // Cache GET requests while inflight
  if (isGet) {
    inflightRequests.set(url, fetchPromise);
    // Clean up cache when promise resolves or rejects
    fetchPromise.finally(() => inflightRequests.delete(url));
  }

  return fetchPromise;
}

export { HEADER_NAMES };
`;
}

/**
 * Generate shared index
 */
function generateSharedIndex(): string {
  const headerComment = header('sdk:gen --clients');

  return `${headerComment}
export * from "./fetch";
`;
}

/**
 * Generate a domain client file
 */
function generateDomainClient(g: RouteGroup): string {
  const headerComment = header('sdk:gen --clients');
  const Group = pascalCase(g.name);

  const regularRoutes = g.routes.filter((r) => !isAdminRoute(r));
  const adminRoutes = g.routes.filter((r) => isAdminRoute(r));

  // Generate type imports from extracted types
  const typeNames: string[] = [];
  for (const r of g.routes) {
    const Op = pascalCase(r.name);
    typeNames.push(`${Group}${Op}Request`);
    typeNames.push(`${Group}${Op}Response`);
  }

  const typeImport = `import type {
  ${typeNames.join(',\n  ')}
} from '../../../types/generated/${g.name}.types';`;

  // Generate type aliases
  const typeAliases: string[] = [];
  for (const r of g.routes) {
    const Op = pascalCase(r.name);
    const T = `T${Group}${Op}`;
    const P = `P${Group}${Op}`;
    const Q = `Q${Group}${Op}`;
    const B = `B${Group}${Op}`;
    const R = `R${Group}${Op}`;
    const PV = `PV${Group}${Op}`;

    typeAliases.push(`type ${T} = ${Group}${Op}Request;`);
    typeAliases.push(`type ${P} = ${T} extends { params: infer X } ? X : never;`);
    typeAliases.push(`type ${Q} = ${T} extends { query: infer X } ? X : never;`);
    typeAliases.push(`type ${B} = ${T} extends { body: infer X } ? X : never;`);
    typeAliases.push(`type ${R} = DataOf<${Group}${Op}Response>;`);
    typeAliases.push(`type ${PV} = [keyof ${P}] extends [never] ? never : ${P}[keyof ${P}];`);
  }

  // Generate regular route types
  const regularTypeContent = regularRoutes.length > 0
    ? regularRoutes.map((r) => generateRouteTypeOverloads(g, r, false, '  ')).join('\n')
    : '';

  // Generate admin route types
  const adminTypeContent = adminRoutes.length > 0
    ? adminRoutes.map((r) => generateRouteTypeOverloads(g, r, true, '    ')).join('\n')
    : '';

  // Build the type definitions
  let typeDefinitions = '';
  if (regularRoutes.length > 0) {
    typeDefinitions += `export type ${Group}Client = {\n${regularTypeContent}\n};\n\n`;
  }
  if (adminRoutes.length > 0) {
    typeDefinitions += `export type ${Group}AdminClient = {\n${adminTypeContent}\n};\n\n`;
  }

  // Generate regular route implementations
  const regularImplContent = regularRoutes.length > 0
    ? regularRoutes.map((r) => generateRouteImplementation(g, r, false)).join('\n\n')
    : '';

  // Generate admin route implementations
  const adminImplContent = adminRoutes.length > 0
    ? adminRoutes.map((r) => generateRouteImplementation(g, r, true)).join('\n\n')
    : '';

  // Build factory functions
  let factoryFunctions = '';
  if (regularRoutes.length > 0) {
    factoryFunctions += `export function create${Group}Client(): ${Group}Client {
  return {
${regularImplContent}
  };
}\n\n`;
  }
  if (adminRoutes.length > 0) {
    factoryFunctions += `export function create${Group}AdminClient(): ${Group}AdminClient {
  return {
${adminImplContent}
  };
}\n`;
  }

  return `${headerComment}
import { doFetch, hasHeader, HEADER_NAMES, ensureCsrfToken } from '../shared/fetch';

${typeImport}

type DataOf<T> = T extends { data: infer D } ? D : T;

${typeAliases.join('\n')}

${typeDefinitions}${factoryFunctions}`;
}

/**
 * Generate type overloads for a single route
 */
function generateRouteTypeOverloads(g: RouteGroup, r: AppRouteEntry, isAdmin: boolean, indent: string): string {
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
 * Generate implementation for a single route (as object property)
 */
function generateRouteImplementation(g: RouteGroup, r: AppRouteEntry, isAdmin: boolean): string {
  const Group = pascalCase(g.name);
  const m = r.method.toUpperCase();
  const hasBody = r.hasBody;
  const bodyOptional = r.bodyOptional;
  const paramNames = extractParamNames(r.path);
  const singleParam = paramNames.length === 1;
  const isWrite = ['POST', 'PATCH', 'PUT'].includes(m);

  // For admin routes, use the stripped operation name
  const opName = isAdmin ? getAdminOpName(r.name) : r.name;

  // Generate argument parsing logic
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

  // For GET methods, generate OrNull variant as well
  if (m === 'GET') {
    return `    ${opName}: (async (...args: unknown[]) => {
      const first = args[0] as Record<string, unknown> | undefined;
      const isFull = first && typeof first === 'object' && (('params' in first) || ('query' in first) || ('body' in first) || ('headers' in first));
      const a = (isFull ? first : {}) as { params?: unknown; query?: unknown; body?: unknown; headers?: Record<string, string> };
      ${argParsing}
      const headers = { ...(a.headers ?? {}) } as Record<string, string>;
      if (!hasHeader(headers, HEADER_NAMES.REQUEST_ID)) headers[HEADER_NAMES.REQUEST_ID] = crypto.randomUUID();
      return doFetch('${m}', '${r.path}', a.params as Record<string, unknown>, a.body, a.query as Record<string, unknown>, headers);
    }) as ${Group}${isAdmin ? 'Admin' : ''}Client['${opName}'],
    ${opName}OrNull: (async (...args: unknown[]) => {
      try {
        const first = args[0] as Record<string, unknown> | undefined;
        const isFull = first && typeof first === 'object' && (('params' in first) || ('query' in first) || ('body' in first) || ('headers' in first));
        const a = (isFull ? first : {}) as { params?: unknown; query?: unknown; body?: unknown; headers?: Record<string, string> };
        ${argParsing}
        const headers = { ...(a.headers ?? {}) } as Record<string, string>;
        if (!hasHeader(headers, HEADER_NAMES.REQUEST_ID)) headers[HEADER_NAMES.REQUEST_ID] = crypto.randomUUID();
        return await doFetch('${m}', '${r.path}', a.params as Record<string, unknown>, a.body, a.query as Record<string, unknown>, headers);
      } catch (e) {
        if ((e as any)?.status === 404) return null;
        throw e;
      }
    }) as ${Group}${isAdmin ? 'Admin' : ''}Client['${opName}OrNull'],`;
  }

  // For non-GET methods
  return `    ${opName}: (async (...args: unknown[]) => {
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
    }) as ${Group}${isAdmin ? 'Admin' : ''}Client['${opName}'],`;
}

/**
 * Generate domains index
 */
function generateDomainsIndex(groups: RouteGroup[]): string {
  const headerComment = header('sdk:gen --clients');

  const exports = groups.map((g) => `export * from "./${g.name}.browser";`).join('\n');

  return `${headerComment}
${exports}
`;
}

/**
 * Generate main browser.ts with namespace pattern
 */
function generateBrowserMain(groups: RouteGroup[]): string {
  const headerComment = header('sdk:gen --clients');

  const { regularGroups, adminGroups } = separateRoutes(groups);

  // Generate imports
  const imports: string[] = [];
  const allGroups = new Set<string>();

  for (const g of groups) {
    const Group = pascalCase(g.name);
    const regularRoutes = g.routes.filter((r) => !isAdminRoute(r));
    const adminRoutes = g.routes.filter((r) => isAdminRoute(r));

    const importParts: string[] = [];
    if (regularRoutes.length > 0) {
      importParts.push(`create${Group}Client`);
      importParts.push(`${Group}Client`);
    }
    if (adminRoutes.length > 0) {
      importParts.push(`create${Group}AdminClient`);
      importParts.push(`${Group}AdminClient`);
    }

    if (importParts.length > 0) {
      imports.push(`import { ${importParts.join(', ')} } from './domains/${g.name}.browser';`);
      allGroups.add(g.name);
    }
  }

  // Generate BrowserApi type
  const regularTypeProps = regularGroups
    .map((g) => {
      const Group = pascalCase(g.name);
      return `  ${g.name}: ${Group}Client;`;
    })
    .join('\n');

  const adminTypeProps = adminGroups
    .map((g) => {
      const Group = pascalCase(g.name);
      return `    ${g.name}: ${Group}AdminClient;`;
    })
    .join('\n');

  const adminType = adminGroups.length > 0 ? `\n  admin: {\n${adminTypeProps}\n  };` : '';

  const browserApiType = `export type BrowserApi = {\n${regularTypeProps}${adminType}\n};`;

  // Generate factory
  const regularInit = regularGroups
    .map((g) => {
      const Group = pascalCase(g.name);
      return `    ${g.name}: create${Group}Client(),`;
    })
    .join('\n');

  const adminInit = adminGroups.length > 0
    ? `    admin: {\n${adminGroups.map((g) => {
        const Group = pascalCase(g.name);
        return `      ${g.name}: create${Group}AdminClient(),`;
      }).join('\n')}\n    },`
    : '';

  return `${headerComment}
${imports.join('\n')}

${browserApiType}

// Memoized SDK instance - avoids recreating the API client on every call
let _cachedBrowserApi: BrowserApi | null = null;

export function browserApi(): BrowserApi {
  // Return cached instance if available
  if (_cachedBrowserApi) return _cachedBrowserApi;

  _cachedBrowserApi = {
${regularInit}
${adminInit}
  };

  return _cachedBrowserApi;
}
`;
}

/**
 * Generate main index
 */
function generateMainIndex(): string {
  const headerComment = header('sdk:gen --clients');

  return `${headerComment}
export * from "./browser";
export * from "./server";
export * from "./shared";
export * from "./domains";
`;
}
