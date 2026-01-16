/**
 * Router parsing utilities for SDK generation
 *
 * Uses ts-morph for proper TypeScript AST parsing instead of regex,
 * which handles all import patterns including:
 * - Multiple named imports
 * - Multi-line imports
 * - Default imports
 * - Namespace imports
 * - Aliased imports
 */
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { Project } from 'ts-morph';
import type { ImportMapEntry, RouteGroup, AppRouteEntry, AliasEntry } from './types.js';
import { parseOpKey } from './utils.js';

/**
 * Parse import statements from router file using ts-morph AST parsing.
 * Properly handles all import patterns including multi-line and aliased imports.
 */
export async function parseRouterImports(routerPath: string): Promise<Record<string, ImportMapEntry>> {
  const src = await fs.readFile(routerPath, 'utf8');

  // Use ts-morph for proper AST-based import parsing
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('router.ts', src);

  const varToPath: Record<string, string> = {};

  // Determine the contracts directory from router path
  const routerDir = path.dirname(routerPath);
  const contractsAlias = '@/src/contracts';

  // Parse all imports using AST
  for (const importDecl of sourceFile.getImportDeclarations()) {
    let importPath = importDecl.getModuleSpecifierValue();

    // Convert relative imports to @/src/contracts/* absolute imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolvedPath = path.resolve(routerDir, importPath);
      const filename = path.basename(resolvedPath);
      importPath = `${contractsAlias}/${filename}`;
    }

    // Handle default import: import foo from 'bar'
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      varToPath[defaultImport.getText()] = importPath;
    }

    // Handle namespace import: import * as foo from 'bar'
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      varToPath[namespaceImport.getText()] = importPath;
    }

    // Handle named imports: import { foo, bar, baz as qux } from 'bar'
    for (const namedImport of importDecl.getNamedImports()) {
      // Use alias if present, otherwise use the original name
      const localName = namedImport.getAliasNode()?.getText() ?? namedImport.getName();
      varToPath[localName] = importPath;
    }
  }

  // Extract router body to map group names to import variables
  const body = src.split('c.router(')[1]?.split(');')[0] ?? '';
  const pairRe = /(\w+)\s*:\s*(\w+)\s*,?/g;
  const out: Record<string, ImportMapEntry> = {};

  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(body))) {
    const group = m[1] as string;
    const v = m[2] as string;
    out[group] = {
      varName: v,
      importPath: varToPath[v] ?? `@/src/contracts/${group}.contract`,
    };
  }

  return out;
}

/**
 * Collect route groups from app router
 */
export async function collectRouteGroups(
  appRouter: unknown,
  importMap: Record<string, ImportMapEntry>,
  readMeta?: (group: string, op: string, path: string, method: string) => Promise<string | undefined>
): Promise<{ groups: RouteGroup[]; aliases: AliasEntry[] }> {
  const routerObj = appRouter as Record<string, unknown>;
  const groups: RouteGroup[] = [];
  const aliases: AliasEntry[] = [];

  for (const groupName of Object.keys(routerObj)) {
    const groupObj = routerObj[groupName] as Record<string, unknown> | undefined;
    if (!groupObj || typeof groupObj !== 'object') continue;

    const routes: AppRouteEntry[] = [];

    for (const op of Object.keys(groupObj)) {
      const r = groupObj[op] as { method?: unknown; path?: unknown; body?: unknown } | undefined;
      if (!r || typeof r !== 'object') continue;

      const method = String(r.method ?? 'GET');
      const routePath = String(r.path ?? '');
      const bodyVal = r.body;
      const hasBody = Object.prototype.hasOwnProperty.call(r, 'body');

      // Check if body is optional (ZodOptional)
      let bodyOptional = false;
      try {
        type MaybeZod = { _def?: { typeName?: string } } | null | undefined;
        const def = (bodyVal as MaybeZod)?._def;
        const typeName = def?.typeName as string | undefined;
        bodyOptional = Boolean(typeName === 'ZodOptional');
      } catch {
        // Ignore
      }

      // Get metadata op key if available
      let metaOp: string | undefined;
      if (readMeta) {
        try {
          metaOp = await readMeta(groupName, op, routePath, method);
        } catch {
          // Ignore
        }
      }

      // Build alias if op key indicates namespace
      if (typeof metaOp === 'string') {
        const { ns, group: ag, name: an } = parseOpKey(metaOp);
        if (ns) {
          aliases.push({
            ns,
            group: ag,
            name: an,
            sourceGroup: groupName,
            sourceOp: op,
            method,
            path: routePath,
          });
        }
      }

      const entry: AppRouteEntry = {
        name: op,
        method,
        path: routePath,
        hasBody,
        bodyOptional,
      };
      if (typeof metaOp === 'string') {
        entry.metaOp = metaOp;
      }
      routes.push(entry);
    }

    const { varName, importPath } = importMap[groupName] ?? {
      varName: `${groupName}Contract`,
      importPath: `@/src/contracts/${groupName}.contract`,
    };
    groups.push({ name: groupName, varName, importPath, routes });
  }

  return { groups, aliases };
}
