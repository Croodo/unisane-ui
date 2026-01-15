/**
 * Metadata extractor using ts-morph to parse defineOpMeta() calls
 * from contract files. This avoids brittle regex parsing by using
 * proper AST analysis.
 */
import { glob as globFn } from 'glob';
import { Project, SyntaxKind } from 'ts-morph';
import type { RouteGenEntry } from './types.js';
import { getStringProp } from './ast-helpers.js';
import { parseServiceEntry } from './parsers.js';

export interface ExtractOptions {
  /** Directory containing contract files */
  contractsDir: string;
  /** Glob pattern for contract files (default: *.contract.ts) */
  glob?: string;
  /** Enable verbose logging for debugging extraction errors */
  verbose?: boolean;
}

/** Tracks entries that were skipped during extraction */
export interface SkippedEntry {
  file: string;
  line: number;
  reason: string;
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
  const { contractsDir, glob = '*.contract.ts', verbose = false } = options;

  const log = verbose
    ? (msg: string, ...args: unknown[]) => console.log(`[meta-extract] ${msg}`, ...args)
    : () => {};

  // Track skipped entries for warning at the end
  const skipped: SkippedEntry[] = [];

  // Find all contract files using glob (supports ** patterns)
  const tsFiles = await globFn(glob, { cwd: contractsDir, absolute: true }).catch(() => [] as string[]);

  log('Found contract files:', tsFiles.length);

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
      log('Added source file:', filePath);
    } catch (err) {
      log('Failed to parse file:', filePath, err);
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
        if (!arg) {
          skipped.push({
            file: sf.getFilePath(),
            line: call.getStartLineNumber(),
            reason: 'Invalid argument to defineOpMeta - expected object literal',
          });
          continue;
        }

        const opKey = getStringProp(arg, 'op') ?? '';
        if (!opKey) {
          skipped.push({
            file: sf.getFilePath(),
            line: call.getStartLineNumber(),
            reason: 'Missing "op" property in defineOpMeta',
          });
          continue;
        }

        const entry = parseServiceEntry(arg, opKey);
        if (!entry) {
          skipped.push({
            file: sf.getFilePath(),
            line: call.getStartLineNumber(),
            reason: `Failed to parse service entry for op "${opKey}"`,
          });
          continue;
        }

        // Record source file for error context
        entry.sourceFile = sf.getFilePath();

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
        } catch (err) {
          log('Error capturing path/method for op:', opKey, err);
        }

        out.set(opKey, entry);
        log('Extracted op:', opKey);
      }
    } catch (err) {
      log('Failed to process source file:', sf.getFilePath(), err);
    }
  }

  // Warn about skipped entries so developers can identify issues
  if (skipped.length > 0) {
    console.warn(`⚠️  Skipped ${skipped.length} metadata entries during extraction:`);
    for (const entry of skipped) {
      console.warn(`   ${entry.file}:${entry.line} - ${entry.reason}`);
    }
  }

  return out;
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
