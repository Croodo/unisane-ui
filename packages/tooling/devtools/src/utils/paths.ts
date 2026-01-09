import * as path from 'node:path';

/**
 * Convert a ts-rest path with :param to Next.js [param] format
 * Example: /tenants/:tenantId/users/:userId -> /tenants/[tenantId]/users/[userId]
 */
export function toNextJsPath(tsRestPath: string): string {
  return tsRestPath.replace(/:(\w+)/g, '[$1]');
}

/**
 * Convert a Next.js [param] path to ts-rest :param format
 * Example: /tenants/[tenantId]/users/[userId] -> /tenants/:tenantId/users/:userId
 */
export function toTsRestPath(nextJsPath: string): string {
  return nextJsPath.replace(/\[(\w+)\]/g, ':$1');
}

/**
 * Extract path parameters from a ts-rest path
 * Example: /tenants/:tenantId/users/:userId -> ['tenantId', 'userId']
 */
export function extractParams(tsRestPath: string): string[] {
  const matches = tsRestPath.match(/:(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/**
 * Get the file system path for a route
 * Example: /tenants/[tenantId]/billing -> src/app/api/tenants/[tenantId]/billing/route.ts
 */
export function getRouteFilePath(basePath: string, routePath: string): string {
  const nextPath = toNextJsPath(routePath);
  // Remove leading slash and add route.ts
  const relativePath = nextPath.startsWith('/') ? nextPath.slice(1) : nextPath;
  return path.join(basePath, relativePath, 'route.ts');
}

/**
 * Normalize a path to use forward slashes
 */
export function normalize(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get the domain name from a contract file path
 * Example: contracts/billing.contract.ts -> billing
 */
export function getDomainFromContractPath(contractPath: string): string {
  const basename = path.basename(contractPath);
  return basename.replace(/\.contract\.ts$/, '');
}

/**
 * Convert a domain name to PascalCase
 * Example: billing-plans -> BillingPlans
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a domain name to camelCase
 * Example: billing-plans -> billingPlans
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert a string to kebab-case
 * Example: billingPlans -> billing-plans
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
