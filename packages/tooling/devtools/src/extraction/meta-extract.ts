/**
 * Metadata extractor using ts-morph to parse defineOpMeta() calls
 * from contract files. This avoids brittle regex parsing by using
 * proper AST analysis.
 */
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { Project, SyntaxKind } from 'ts-morph';
import type { RouteGenEntry } from './types.js';
import { getStringProp } from './ast-helpers.js';
import { parseServiceEntry } from './parsers.js';

export interface ExtractOptions {
  /** Directory containing contract files */
  contractsDir: string;
  /** Glob pattern for contract files (default: *.contract.ts) */
  glob?: string;
}

/**
 * Extract route metadata from all contract files in a directory
 *
 * Scans for defineOpMeta({...}) calls and builds a map of
 * opKey -> RouteGenEntry for code generation.
 */
export async function extractRouteMeta(
  options: ExtractOptions
): Promise<Map<string, RouteGenEntry>> {
  const { contractsDir, glob = '*.contract.ts' } = options;

  // Find all contract files
  const entries = await fs.readdir(contractsDir).catch(() => [] as string[]);
  const pattern = globToRegex(glob);
  const tsFiles = entries
    .filter((f) => pattern.test(f))
    .map((f) => path.join(contractsDir, f));

  if (tsFiles.length === 0) {
    return new Map();
  }

  // Create ts-morph project
  const project = new Project({
    useInMemoryFileSystem: false,
    skipAddingFilesFromTsConfig: true,
  });

  // Add source files
  for (const filePath of tsFiles) {
    try {
      project.addSourceFileAtPath(filePath);
    } catch {
      // Skip files that can't be parsed
    }
  }

  const out = new Map<string, RouteGenEntry>();

  // Process each source file
  for (const sf of project.getSourceFiles()) {
    try {
      const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);

      for (const call of calls) {
        const ident = call.getExpression().getText().trim();
        if (ident !== 'defineOpMeta') continue;

        const arg = call
          .getArguments()[0]
          ?.asKind(SyntaxKind.ObjectLiteralExpression);
        if (!arg) continue;

        const opKey = getStringProp(arg, 'op') ?? '';
        if (!opKey) continue;

        const entry = parseServiceEntry(arg, opKey);
        if (!entry) continue;

        // Try to capture HTTP path/method from surrounding withMeta call
        try {
          const withMetaCall = call.getParentIfKind(SyntaxKind.CallExpression);
          const firstArg = withMetaCall
            ?.getArguments()?.[0]
            ?.asKind(SyntaxKind.ObjectLiteralExpression);

          if (firstArg) {
            const pathProp = firstArg
              .getProperty('path')
              ?.asKind(SyntaxKind.PropertyAssignment)
              ?.getInitializer()
              ?.getText();
            const methodProp = firstArg
              .getProperty('method')
              ?.asKind(SyntaxKind.PropertyAssignment)
              ?.getInitializer()
              ?.getText();

            const strip = (s?: string) =>
              s && (s.startsWith('"') || s.startsWith("'"))
                ? s.slice(1, -1)
                : s || undefined;

            const apiPath = strip(pathProp);
            const method = strip(methodProp);
            if (apiPath) entry.apiPath = apiPath;
            if (method) entry.method = method;
          }
        } catch {
          // Ignore errors capturing path/method
        }

        out.set(opKey, entry);
      }
    } catch {
      // Skip source files that fail to process
    }
  }

  return out;
}

/**
 * Convert a simple glob pattern to a regex
 */
function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

/**
 * Get a summary of extracted metadata for logging
 */
export function summarizeMeta(meta: Map<string, RouteGenEntry>): {
  total: number;
  byGroup: Record<string, number>;
} {
  const byGroup: Record<string, number> = {};

  for (const [opKey] of meta) {
    const group = opKey.split('.')[0] ?? 'unknown';
    byGroup[group] = (byGroup[group] ?? 0) + 1;
  }

  return {
    total: meta.size,
    byGroup,
  };
}
