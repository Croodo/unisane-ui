/**
 * Operation discovery from ts-rest router
 */
import * as path from 'node:path';
import type { Op, OpWithMeta, RouteGenEntry } from './types.js';

/**
 * Collect operations from a ts-rest app router object
 *
 * Extracts all operations that have paths starting with /api/
 */
export function collectOps(appRouter: unknown): Op[] {
  const routerObj = appRouter as Record<string, unknown>;
  const ops: Op[] = [];

  for (const group of Object.keys(routerObj)) {
    const g = routerObj[group] as Record<string, unknown> | undefined;
    if (!g || typeof g !== 'object') continue;

    for (const name of Object.keys(g)) {
      const opVal = (g as Record<string, unknown>)[name] as
        | { method?: unknown; path?: unknown }
        | undefined;
      if (!opVal || typeof opVal !== 'object') continue;

      const method = String(opVal.method ?? 'GET').toUpperCase();
      const p = String(opVal.path ?? '');

      // Only include API routes
      if (!p.startsWith('/api/')) continue;

      ops.push({ group, name, method, path: p });
    }
  }

  return ops;
}

/**
 * Merge operations with metadata from defineOpMeta
 */
export function mergeOpsWithMeta(
  ops: Op[],
  meta: Map<string, RouteGenEntry>
): OpWithMeta[] {
  return ops.map((op) => {
    const opKey = `${op.group}.${op.name}`;
    const entry = meta.get(opKey);
    return {
      ...op,
      ...(entry ? { meta: entry } : {}),
    };
  });
}

/**
 * Convert an API path to a Next.js App Router path
 *
 * Examples:
 *   /api/rest/v1/tenants/:tenantId -> /api/rest/v1/tenants/[tenantId]
 *   /api/rest/v1/users -> /api/rest/v1/users
 */
export function apiPathToAppRouterPath(apiPath: string): string {
  return apiPath
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        return `[${segment.slice(1)}]`;
      }
      return segment;
    })
    .join('/');
}

/**
 * Get the file path for a wrapper route.ts file
 *
 * Example:
 *   /api/rest/v1/tenants/:tenantId -> src/app/api/rest/v1/tenants/[tenantId]/route.ts
 */
export function toWrapperPath(apiPath: string, cwd: string = process.cwd()): string {
  const routerPath = apiPathToAppRouterPath(apiPath);
  const parts = routerPath.split('/').filter(Boolean);

  if (parts[0] !== 'api') {
    throw new Error(`Unexpected path (no /api): ${apiPath}`);
  }

  const baseDir = path.resolve(cwd, 'src', 'app', ...parts);
  return path.join(baseDir, 'route.ts');
}

/**
 * Get the file path for a sidecar route.gen.ts file
 */
export function toSidecarPath(wrapperPath: string): string {
  const dir = path.dirname(wrapperPath);
  return path.join(dir, 'route.gen.ts');
}

/**
 * Group operations by their wrapper path
 */
export function groupOpsByPath(ops: OpWithMeta[], cwd: string = process.cwd()): Map<string, OpWithMeta[]> {
  const groups = new Map<string, OpWithMeta[]>();

  for (const op of ops) {
    const wrapperPath = toWrapperPath(op.path, cwd);
    const existing = groups.get(wrapperPath) ?? [];
    existing.push(op);
    groups.set(wrapperPath, existing);
  }

  return groups;
}

/**
 * Get unique API paths from operations (for directory creation)
 */
export function getUniquePaths(ops: Op[]): string[] {
  const seen = new Set<string>();
  return ops.filter((op) => {
    if (seen.has(op.path)) return false;
    seen.add(op.path);
    return true;
  }).map((op) => op.path);
}
