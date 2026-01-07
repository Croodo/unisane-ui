/**
 * Browser client generation
 *
 * Generates typed fetch-based API client for browser usage.
 */
import * as path from 'node:path';
import { header, pascalCase, extractParamNames, isAdminRoute } from './utils.js';
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
 * Generate browser API client
 */
export async function genBrowser(options: GenBrowserOptions): Promise<void> {
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

  // Generate the browser client code
  const clientCode = generateBrowserClientCode(groups);

  // Generate API type definitions
  const apiTypes = generateBrowserApiTypes(groups);

  // Generate the browserApi factory function
  const browserApiFactory = generateBrowserApiFactory(groups);

  const content = [
    headerComment,
    `import type { ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';`,
    `import { HEADER_NAMES } from '@unisane/gateway';`,
    typeImports,
    '',
    typeHelpers,
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
 * Generate core browser client utilities
 */
function generateBrowserClientCode(groups: RouteGroup[]): string {
  return `
function hasHeader(h: Record<string, string>, name: string): boolean {
  const lower = name.toLowerCase();
  return Object.keys(h).some((k) => k.toLowerCase() === lower);
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
    for (const [k, v] of Object.entries(query)) if (typeof v !== 'undefined' && v !== null) url.searchParams.set(k, String(v));
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
 * Generate BrowserApi type definition
 */
function generateBrowserApiTypes(groups: RouteGroup[]): string {
  const groupTypes = groups
    .map((g) => {
      const routes = g.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
      if (!routes.length) return '';

      const routeTypes = routes
        .map((r) => generateRouteTypeOverloads(g, r))
        .join('\n');

      return `  ${g.name}: {\n${routeTypes}\n  }`;
    })
    .filter(Boolean)
    .join(',\n');

  return `export type BrowserApi = {\n${groupTypes}\n};`;
}

/**
 * Generate type overloads for a single route
 */
function generateRouteTypeOverloads(g: RouteGroup, r: AppRouteEntry): string {
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

  const lines: string[] = [];

  if (!hasBody) {
    if (!hasParams) {
      lines.push(`    ${r.name}(query?: ${Q}): Promise<${R}>;`);
    } else if (singleParam) {
      lines.push(`    ${r.name}(param: ${PV}): Promise<${R}>;`);
      lines.push(`    ${r.name}(param: ${PV}, query: ${Q}): Promise<${R}>;`);
    } else {
      lines.push(`    ${r.name}(params: ${P}): Promise<${R}>;`);
      lines.push(`    ${r.name}(params: ${P}, query: ${Q}): Promise<${R}>;`);
    }
  } else {
    if (!hasParams) {
      lines.push(`    ${r.name}(body: ${B}): Promise<${R}>;`);
      lines.push(`    ${r.name}(body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) {
        lines.push(`    ${r.name}(): Promise<${R}>;`);
      }
    } else if (singleParam) {
      lines.push(`    ${r.name}(param: ${PV}, body: ${B}): Promise<${R}>;`);
      lines.push(`    ${r.name}(param: ${PV}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) {
        lines.push(`    ${r.name}(param: ${PV}): Promise<${R}>;`);
      }
    } else {
      lines.push(`    ${r.name}(params: ${P}, body: ${B}): Promise<${R}>;`);
      lines.push(`    ${r.name}(params: ${P}, body: ${B}, query: ${Q}): Promise<${R}>;`);
      if (bodyOptional) {
        lines.push(`    ${r.name}(params: ${P}): Promise<${R}>;`);
      }
    }
  }

  lines.push(`    ${r.name}(args?: ${T}): Promise<${R}>;`);

  if (m === 'GET') {
    lines.push(`    ${r.name}OrNull(args?: ${T}): Promise<${R} | null>;`);
  }

  return lines.join('\n');
}

/**
 * Generate the browserApi factory function
 */
function generateBrowserApiFactory(groups: RouteGroup[]): string {
  const routeImpls = groups
    .map((g) => {
      const routes = g.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
      if (!routes.length) return '';

      return routes.map((r) => generateRouteImplementation(g, r)).join('\n');
    })
    .filter(Boolean)
    .join('\n');

  return `export async function browserApi(): Promise<BrowserApi> {
  const out: Record<string, unknown> = {};
${routeImpls}
  return out as unknown as BrowserApi;
}`;
}

/**
 * Generate implementation for a single route
 */
function generateRouteImplementation(g: RouteGroup, r: AppRouteEntry): string {
  const m = r.method.toUpperCase();
  const hasBody = r.hasBody;
  const bodyOptional = r.bodyOptional;
  const paramNames = extractParamNames(r.path);
  const singleParam = paramNames.length === 1;
  const isWrite = ['POST', 'PATCH', 'PUT'].includes(m);

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
      argParsing = bodyOptional
        ? `if (!isFull) { if (args.length >= 1) a.params = { ${p}: args[0] }; if (args.length >= 2) a.body = args[1]; if (args.length >= 3) a.query = args[2]; }`
        : `if (!isFull) { if (args.length >= 2) { a.params = { ${p}: args[0] }; a.body = args[1]; if (args.length >= 3) a.query = args[2]; } }`;
    } else {
      argParsing = bodyOptional
        ? `if (!isFull) { if (args.length >= 1) a.params = args[0]; if (args.length >= 2) a.body = args[1]; if (args.length >= 3) a.query = args[2]; }`
        : `if (!isFull) { if (args.length >= 2) { a.params = args[0]; a.body = args[1]; if (args.length >= 3) a.query = args[2]; } }`;
    }
  }

  const orNullMethod = m === 'GET' ? `
  (out['${g.name}'] as Record<string, unknown>)['${r.name}OrNull'] = async (...args: unknown[]) => {
    try {
      const fn = (out['${g.name}'] as Record<string, unknown>)['${r.name}'] as (...a: unknown[]) => Promise<unknown>;
      return await fn(...args);
    } catch (e) {
      if ((e as any)?.status === 404) return null;
      throw e;
    }
  };` : '';

  return `  out['${g.name}'] = out['${g.name}'] ?? {};
  (out['${g.name}'] as Record<string, unknown>)['${r.name}'] = async (...args: unknown[]) => {
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
