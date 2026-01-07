/**
 * React hooks generation
 *
 * Generates React Query hooks from ts-rest contracts.
 * Outputs:
 * - shared/types.ts - Common type helpers
 * - shared/unwrap.ts - Response unwrapping utilities
 * - keys.ts - Query key factories
 * - domains/<domain>.hooks.ts - Per-domain hook files
 * - hooks.ts - Barrel with namespace object
 * - index.ts - Main entry point
 */
import * as path from 'node:path';
import { header, pascalCase, extractParamNames, isAdminRoute } from './utils.js';
import { parseRouterImports, collectRouteGroups } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';
import type { RouteGroup, AppRouteEntry } from './types.js';

export interface GenHooksOptions {
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
 * Generate React Query hooks
 */
export async function genHooks(options: GenHooksOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const { groups } = await collectRouteGroups(appRouter, importMap);

  // Create directories
  if (!dryRun) {
    await ensureDir(path.join(output, 'shared'));
    await ensureDir(path.join(output, 'domains'));
  }

  // Generate shared modules
  const sharedTypes = generateSharedTypes();
  const sharedUnwrap = generateSharedUnwrap();
  const sharedIndex = generateSharedIndex();

  if (!dryRun) {
    await writeText(path.join(output, 'shared/types.ts'), sharedTypes);
    await writeText(path.join(output, 'shared/unwrap.ts'), sharedUnwrap);
    await writeText(path.join(output, 'shared/index.ts'), sharedIndex);
  }

  // Generate keys
  const keysContent = generateKeys(groups);
  if (!dryRun) {
    await writeText(path.join(output, 'keys.ts'), keysContent);
  }

  // Generate domain hooks
  for (const group of groups) {
    const domainHooks = generateDomainHooks(group);
    if (!dryRun) {
      await writeText(path.join(output, `domains/${group.name}.hooks.ts`), domainHooks);
    }
  }

  // Generate barrels
  const hooksBarrel = generateHooksBarrel(groups);
  const mainIndex = generateMainIndex();

  if (!dryRun) {
    await writeText(path.join(output, 'hooks.ts'), hooksBarrel);
    await writeText(path.join(output, 'index.ts'), mainIndex);
  }
}

/**
 * Generate shared types file
 */
function generateSharedTypes(): string {
  const headerComment = header('sdk:gen --hooks');

  return `${headerComment}
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  UseQueryResult,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutationResult,
  UseMutationOptions,
  QueryKey,
  QueryClient,
} from "@tanstack/react-query";
import type { AppRoute } from "@ts-rest/core";

export type RouteOf<T> = Extract<T, AppRoute>;
export type DataOf<T> = T extends { data: infer D } ? D : T;
export type ListOut<T> = T extends { items: infer A }
  ? A
  : T extends Array<infer U>
    ? U[]
    : T;

export type {
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  QueryKey,
  QueryClient,
};
`;
}

/**
 * Generate shared unwrap utilities
 */
function generateSharedUnwrap(): string {
  const headerComment = header('sdk:gen --hooks');

  return `${headerComment}
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataOf, ListOut } from "./types";

export function unwrapResponse<T>(res: unknown): T {
  if (!res) return res as T;
  const r = res as Record<string, unknown>;
  const b = r.body ?? res;
  if (b && typeof b === "object" && "data" in (b as Record<string, unknown>)) {
    return (b as Record<string, unknown>).data as T;
  }
  return b as T;
}

export function toListOut<T>(res: unknown): ListOut<DataOf<T>> {
  const b = unwrapResponse(res);
  if (b == null) return [] as unknown as ListOut<DataOf<T>>;
  if (Array.isArray(b)) return b as unknown as ListOut<DataOf<T>>;
  if (
    b &&
    typeof b === "object" &&
    Array.isArray((b as Record<string, unknown>).items)
  ) {
    return (b as Record<string, unknown>).items as unknown as ListOut<DataOf<T>>;
  }
  return [] as unknown as ListOut<DataOf<T>>;
}

export function is404(e: unknown): boolean {
  return (e as { status?: number })?.status === 404;
}
`;
}

/**
 * Generate shared index
 */
function generateSharedIndex(): string {
  const headerComment = header('sdk:gen --hooks');

  return `${headerComment}
export * from "./types";
export * from "./unwrap";
`;
}

/**
 * Generate query keys factory
 */
function generateKeys(groups: RouteGroup[]): string {
  const headerComment = header('sdk:gen --hooks');

  const imports = groups
    .map((g) => `import { ${g.varName} } from '${g.importPath}';`)
    .join('\n');

  const keysBody = groups
    .map((g) => {
      const routes = g.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
      if (!routes.length) return '';

      const entries = routes
        .map((r) => {
          return `    ${r.name}: (args?: ClientInferRequest<typeof ${g.varName}["${r.name}"]>) => {
      const a = args as { params?: unknown; query?: unknown } | undefined;
      return ["${g.name}", "${r.name}", a?.params ?? null, a?.query ?? null] as const;
    },`;
        })
        .join('\n');
      return `  ${g.name}: {\n${entries}\n  },`;
    })
    .filter(Boolean)
    .join('\n');

  return `${headerComment}
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ClientInferRequest } from "@ts-rest/core";
${imports}

export const keys = {
${keysBody}
} as const;
`;
}

/**
 * Utility functions for hooks generation
 */
function isListOperation(name: string): boolean {
  return name.toLowerCase().includes('list');
}

function hasTenantParam(routePath: string): boolean {
  return routePath.includes(':tenantId');
}

function isGetMethod(method: string): boolean {
  return method.toUpperCase() === 'GET';
}

function getClientPath(groupName: string, routeName: string, opMeta?: string): string {
  const metaParts = (opMeta ?? '').split('.');
  const isMetaAdmin = metaParts[0] === 'admin' && metaParts.length >= 3;
  return isMetaAdmin
    ? `["admin"]["${metaParts[1]}"]["${metaParts.slice(2).join('.')}"]`
    : `["${groupName}"]["${routeName}"]`;
}

/**
 * Generate type helpers for a domain
 */
function generateTypeHelpers(group: RouteGroup): string {
  const routes = group.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));

  return routes
    .map((r) => {
      const Group = pascalCase(group.name);
      const Op = pascalCase(r.name);
      return `type T${Group}${Op} = ClientInferRequest<RouteOf<typeof ${group.varName}["${r.name}"]>>;
type D${Group}${Op} = DataOf<ClientInferResponseBody<RouteOf<typeof ${group.varName}["${r.name}"]>, 200>>;`;
    })
    .join('\n');
}

/**
 * Generate a query hook (for GET operations)
 */
function generateQueryHook(group: RouteGroup, route: AppRouteEntry): string {
  const Group = pascalCase(group.name);
  const Op = pascalCase(route.name);
  const paramNames = extractParamNames(route.path);
  const isList = isListOperation(route.name);
  const hasTenant = hasTenantParam(route.path);
  const clientPath = getClientPath(group.name, route.name, route.metaOp);

  const normCode =
    paramNames.length === 0
      ? `const a = (isFull ? first : { query: first }) as T${Group}${Op} | undefined;`
      : paramNames.length === 1
        ? `const a = isFull ? first as T${Group}${Op} : { params: { ${paramNames[0]}: first }, ...(arg2 ? { query: arg2 } : {}) } as T${Group}${Op};`
        : `const a = (isFull ? first : { params: first, ...(arg2 ? { query: arg2 } : {}) }) as T${Group}${Op};`;

  const safeReturnType = isList ? `ListOut<D${Group}${Op}>` : `D${Group}${Op} | null`;
  const emptyFallback = isList ? `[] as unknown as ListOut<D${Group}${Op}>` : 'null';

  let code = `/** ${route.method} ${route.path} */
/** Query variant - throws on error */
export function use${Group}${Op}Query(
  arg1?: unknown,
  arg2?: unknown,
  options?: QueryOpts<D${Group}${Op}>
): UseQueryResult<D${Group}${Op}, unknown> {
  const first = arg1;
  const isFull = first && typeof first === "object" && (("params" in (first as any)) || ("query" in (first as any)));
  ${normCode}
  const qk = keys.${group.name}.${route.name}(a as any) as unknown as QueryKey;
  return useQuery({
    queryKey: qk,
    queryFn: async () => {
      const api = await browserApi();
      return unwrapResponse<D${Group}${Op}>(await (api as any)${clientPath}(a));
    },
    ...options,
  });
}

/** Safe default - returns ${isList ? 'empty array' : 'null'} on 404 */
export function use${Group}${Op}(
  arg1?: unknown,
  arg2?: unknown,
  options?: QueryOpts<${safeReturnType}>
): UseQueryResult<${safeReturnType}, unknown> {
  const first = arg1;
  const isFull = first && typeof first === "object" && (("params" in (first as any)) || ("query" in (first as any)));
  ${normCode}
  const qk = keys.${group.name}.${route.name}(a as any) as unknown as QueryKey;
  return useQuery({
    queryKey: qk,
    queryFn: async () => {
      try {
        const api = await browserApi();
        ${isList ? `return toListOut<D${Group}${Op}>(await (api as any)${clientPath}(a));` : `return unwrapResponse<D${Group}${Op}>(await (api as any)${clientPath}(a));`}
      } catch (e) {
        if (is404(e)) return ${emptyFallback};
        throw e;
      }
    },
    ...options,
  });
}`;

  // List-specific: Infinite variant
  if (isList) {
    code += `

/** Paginated infinite query */
export function use${Group}${Op}Infinite(
  arg1?: unknown,
  arg2?: unknown,
  options?: InfiniteOpts<D${Group}${Op}>
): UseInfiniteQueryResult<D${Group}${Op}, unknown> {
  const first = arg1;
  const isFull = first && typeof first === "object" && (("params" in (first as any)) || ("query" in (first as any)));
  ${normCode}
  const qk = keys.${group.name}.${route.name}(a as any) as unknown as QueryKey;
  const getNext = options?.getNextCursor ?? ((r: any) => r?.nextCursor);
  return useInfiniteQuery({
    queryKey: qk,
    initialPageParam: (a as any)?.query?.cursor,
    getNextPageParam: (l) => getNext(l as D${Group}${Op}),
    queryFn: async ({ pageParam }) => {
      const n = { ...a } as any;
      if (pageParam) n.query = { ...(n.query ?? {}), cursor: pageParam };
      const api = await browserApi();
      return unwrapResponse<D${Group}${Op}>(await (api as any)${clientPath}(n));
    },
    ...options,
  }) as UseInfiniteQueryResult<D${Group}${Op}, unknown>;
}`;
  }

  // ForTenant variant for tenant-scoped routes
  if (hasTenant) {
    code += `

/** Convenience hook using session's active tenantId */
export function use${Group}${Op}ForTenant(
  arg1?: unknown,
  arg2?: unknown,
  options?: QueryOpts<${safeReturnType}>
): UseQueryResult<${safeReturnType}, unknown> {
  const { tenantId } = useActiveTenant();
  const first = arg1;
  const isFull = first && typeof first === "object" && (("params" in (first as any)) || ("query" in (first as any)));
  ${normCode}
  const p = { ...(a as any)?.params };
  if (!p.tenantId && tenantId) p.tenantId = tenantId;
  const a2 = { ...a, params: p } as T${Group}${Op};
  const qk = [...(keys.${group.name}.${route.name}(a2 as any) as unknown as unknown[]), "forTenant"] as QueryKey;
  const enabled = (options?.enabled ?? true) && Boolean(a2?.params?.tenantId);
  return useQuery({
    queryKey: qk,
    enabled,
    queryFn: async () => {
      try {
        const api = await browserApi();
        ${isList ? `return toListOut<D${Group}${Op}>(await (api as any)${clientPath}(a2));` : `return unwrapResponse<D${Group}${Op}>(await (api as any)${clientPath}(a2));`}
      } catch (e) {
        if (is404(e)) return ${emptyFallback};
        throw e;
      }
    },
    ...options,
  }) as UseQueryResult<${safeReturnType}, unknown>;
}`;
  }

  return code;
}

/**
 * Generate a mutation hook (for POST/PUT/PATCH/DELETE operations)
 */
function generateMutationHook(group: RouteGroup, route: AppRouteEntry): string {
  const Group = pascalCase(group.name);
  const Op = pascalCase(route.name);

  return `/** ${route.method} ${route.path} (mutation) */
export function use${Group}${Op}(
  options?: MutationOpts<D${Group}${Op}, T${Group}${Op}>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variables: T${Group}${Op}) => {
      const api = await browserApi();
      return unwrapResponse<D${Group}${Op}>(await (api as any)["${group.name}"]["${route.name}"](variables));
    },
    ...options,
    onSuccess: (data: D${Group}${Op}, variables: T${Group}${Op}, ctx: unknown) => {
      void qc.invalidateQueries({ queryKey: ["${group.name}"], exact: false });
      options?.onSuccess?.(data, variables, ctx);
    },
  }) as UseMutationResult<D${Group}${Op}, unknown, T${Group}${Op}, unknown>;
}`;
}

/**
 * Generate hooks for a single route
 */
function generateRouteHooks(group: RouteGroup, route: AppRouteEntry): string {
  return isGetMethod(route.method)
    ? generateQueryHook(group, route)
    : generateMutationHook(group, route);
}

/**
 * Generate domain hooks file
 */
function generateDomainHooks(group: RouteGroup): string {
  const headerComment = header('sdk:gen --hooks');
  const routes = group.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
  const hasTenantRoutes = routes.some((r) => hasTenantParam(r.path));

  const typeHelpers = generateTypeHelpers(group);
  const hooks = routes.map((r) => generateRouteHooks(group, r)).join('\n\n');

  return `${headerComment}
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// @ts-nocheck - Generated file with complex ts-rest type inference
"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  QueryKey,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import type {
  ClientInferRequest,
  ClientInferResponseBody,
} from "@ts-rest/core";
import { ${group.varName} } from "${group.importPath}";
import { browserApi } from "@/src/sdk/clients/generated/browser";${hasTenantRoutes ? '\nimport { useActiveTenant } from "@/src/hooks/useActiveTenant";' : ''}
import { keys } from "../keys";
import type { RouteOf, DataOf, ListOut } from "../shared/types";
import { unwrapResponse, toListOut, is404 } from "../shared/unwrap";

type QueryOpts<T> = Omit<
  UseQueryOptions<T, unknown, T, QueryKey>,
  "queryKey" | "queryFn"
>;
type InfiniteOpts<T> = Omit<
  UseInfiniteQueryOptions<T, unknown, T, QueryKey, string>,
  "queryKey" | "queryFn" | "getNextPageParam"
> & { getNextCursor?: (r: T) => string | undefined };
type MutationOpts<D, V> = Omit<
  UseMutationOptions<D, unknown, V, unknown>,
  "mutationFn"
>;

// Type helpers
${typeHelpers}

// Hooks
${hooks}
`;
}

/**
 * Build operation entry for namespace object
 */
function buildOperationEntry(group: RouteGroup, route: AppRouteEntry, originalName?: string): string {
  const Group = pascalCase(group.name);
  const FullOp = pascalCase(originalName ?? route.name);
  const hookName = `use${Group}${FullOp}`;
  if (isGetMethod(route.method)) {
    return `${route.name}: (args?: unknown, options?: unknown) => ${group.name}Hooks.${hookName}(args, undefined, options as any)`;
  } else {
    return `${route.name}: (options?: unknown) => ${group.name}Hooks.${hookName}(options as any)`;
  }
}

/**
 * Generate hooks barrel with namespace object
 */
function generateHooksBarrel(groups: RouteGroup[]): string {
  const headerComment = header('sdk:gen --hooks');

  const exports = groups
    .map((g) => `export * from "./domains/${g.name}.hooks";`)
    .join('\n');

  const nsImports = groups
    .map((g) => `import * as ${g.name}Hooks from "./domains/${g.name}.hooks";`)
    .join('\n');

  const nsEntries = groups.map((g) => {
    const routes = g.routes.filter((r) => !isAdminRoute(r.name, r.metaOp));
    if (!routes.length) return '';

    // Build nested structure for admin.get, admin.patch patterns
    const routesByPrefix = new Map<
      string,
      { route: AppRouteEntry; originalName: string; displayName: string }[]
    >();
    for (const r of routes) {
      const prefixes = ['admin', 'profile'];
      let prefix = '';
      let baseName = r.name;
      for (const p of prefixes) {
        if (
          r.name.toLowerCase().startsWith(p.toLowerCase()) &&
          r.name.length > p.length
        ) {
          prefix = p;
          baseName = r.name.slice(p.length);
          baseName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
          break;
        }
      }
      const key = prefix || '_root';
      if (!routesByPrefix.has(key)) routesByPrefix.set(key, []);
      routesByPrefix.get(key)!.push({
        route: r,
        originalName: r.name,
        displayName: prefix ? baseName : r.name,
      });
    }

    const entries: string[] = [];
    for (const [prefix, items] of routesByPrefix) {
      if (prefix === '_root') {
        for (const item of items) {
          entries.push(
            buildOperationEntry(
              g,
              { ...item.route, name: item.displayName },
              item.originalName
            )
          );
        }
      } else {
        const nested = items
          .map((item) =>
            buildOperationEntry(
              g,
              { ...item.route, name: item.displayName },
              item.originalName
            )
          )
          .join(',\n      ');
        entries.push(`${prefix}: {\n      ${nested}\n    }`);
      }
    }
    return `  ${g.name}: {\n    ${entries.join(',\n    ')}\n  }`;
  }).filter(Boolean);

  return `${headerComment}
${exports}

${nsImports}

/**
 * Namespace-based hooks object
 * Use flat hooks (useXxx) for new code
 */
export const hooks = {
${nsEntries.join(',\n')}
} as const;
`;
}

/**
 * Generate main index file
 */
function generateMainIndex(): string {
  const headerComment = header('sdk:gen --hooks');

  return `${headerComment}
export * from "./keys";
export * from "./hooks";
export * from "./shared";
`;
}
