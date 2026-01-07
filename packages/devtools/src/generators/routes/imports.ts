/**
 * Import path management for route generation
 */

/**
 * Map deep module service import paths to package imports
 *
 * In the monorepo, all services are re-exported from package roots.
 * Example: '@/src/modules/tenants/service/read' -> '@unisane/tenants'
 *
 * For local paths (starter apps), converts:
 * '@/src/modules/tenants/service/read' -> '@/src/modules/tenants'
 */
export function toModuleImport(importPath: string, usePackages: boolean = true): string {
  // Match @/src/modules/<name>/... pattern
  const moduleMatch = importPath.match(/^@\/src\/modules\/([^/]+)\//);
  if (moduleMatch && moduleMatch[1]) {
    const moduleName = moduleMatch[1];
    if (usePackages) {
      return `@unisane/${moduleName}`;
    }
    return `@/src/modules/${moduleName}`;
  }

  // Match @unisane/<name>/... pattern (already a package import, simplify if needed)
  const pkgMatch = importPath.match(/^@unisane\/([^/]+)\//);
  if (pkgMatch && pkgMatch[1]) {
    return `@unisane/${pkgMatch[1]}`;
  }

  // Return as-is for other paths
  return importPath;
}

/**
 * Check if an import path is a local zod import
 */
export function isZodImport(importPath: string): boolean {
  return importPath === 'zod' || importPath === 'z';
}

/**
 * Get the gateway import path based on configuration
 */
export function getGatewayImport(subpath: string, usePackages: boolean = true): string {
  if (usePackages) {
    return `@unisane/gateway${subpath ? `/${subpath}` : ''}`;
  }
  return `@/src/gateway${subpath ? `/${subpath}` : ''}`;
}

/**
 * Merge import lines from the same source path, deduplicating named imports
 */
export function mergeImports(lines: string[]): string[] {
  const byPath = new Map<string, Set<string>>();
  const order: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(
      /^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?$/
    );
    if (match && match[1] && match[2]) {
      const specifiers = match[1];
      const sourcePath = match[2];

      if (!byPath.has(sourcePath)) {
        byPath.set(sourcePath, new Set<string>());
        order.push(sourcePath);
      }

      const parts = specifiers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const pathSet = byPath.get(sourcePath)!;
      for (const part of parts) {
        pathSet.add(part);
      }
    } else {
      // Non-standard import, keep as raw
      const key = `__raw__${lines.indexOf(line)}`;
      if (!byPath.has(key)) {
        byPath.set(key, new Set([trimmed]));
        order.push(key);
      }
    }
  }

  const result: string[] = [];
  for (const key of order) {
    if (key.startsWith('__raw__')) {
      const set = byPath.get(key)!;
      const first = [...set][0];
      if (first) result.push(first);
    } else {
      const set = byPath.get(key)!;
      const specifiers = [...set].join(', ');
      result.push(`import { ${specifiers} } from '${key}';`);
    }
  }

  return result;
}

/**
 * Build a set of imports for a route handler
 */
export class ImportBuilder {
  private imports = new Map<string, Set<string>>();
  private usePackages: boolean;

  constructor(usePackages: boolean = true) {
    this.usePackages = usePackages;
  }

  /**
   * Add an import
   */
  add(importPath: string, names: string | string[]): void {
    const normalizedPath = toModuleImport(importPath, this.usePackages);
    const set = this.imports.get(normalizedPath) ?? new Set<string>();

    if (Array.isArray(names)) {
      for (const name of names) {
        set.add(name);
      }
    } else {
      set.add(names);
    }

    this.imports.set(normalizedPath, set);
  }

  /**
   * Add gateway import
   */
  addGateway(subpath: string, names: string | string[]): void {
    const path = getGatewayImport(subpath, this.usePackages);
    this.add(path, names);
  }

  /**
   * Build import statements
   */
  build(): string[] {
    const lines: string[] = [];

    for (const [path, names] of this.imports) {
      const flat = [...names]
        .flatMap((s) => s.split(',').map((x) => x.trim()))
        .filter(Boolean);
      const unique = [...new Set(flat)];
      lines.push(`import { ${unique.join(', ')} } from '${path}';`);
    }

    return lines;
  }
}
