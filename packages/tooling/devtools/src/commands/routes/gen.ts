/**
 * Route generation command
 *
 * Generates Next.js App Router route handlers from ts-rest contracts.
 */
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { loadConfig, resolvePaths } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import { writeText, ensureDir, existsSync } from '../../utils/fs.js';

/** Check if source file is newer than dist file */
function isStale(srcPath: string, distPath: string): boolean {
  try {
    const srcStat = statSync(srcPath);
    const distStat = statSync(distPath);
    return srcStat.mtimeMs > distStat.mtimeMs;
  } catch {
    return true; // If we can't stat, assume stale
  }
}
import {
  extractRouteMeta,
  summarizeMeta,
  collectOps,
  mergeOpsWithMeta,
  toWrapperPath,
  toSidecarPath,
  groupOpsByPath,
} from '../../extraction/index.js';
import { renderRouteHandler, mergeImports } from '../../generators/routes/index.js';
import type { OpWithMeta } from '../../extraction/types.js';

export interface RoutesGenOptions {
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Force rewrite all routes */
  rewrite?: boolean;
  /** Skip creating wrapper files */
  scaffold?: boolean;
  /** Working directory */
  cwd?: string;
  /**
   * Continue route generation even if contract build fails.
   * WARNING: This may generate routes from stale contracts.
   * Only use this flag when you're certain the existing built contracts are correct.
   */
  ignoreBuildErrors?: boolean;
}

/**
 * Generate routes from contracts
 */
export async function routesGen(options: RoutesGenOptions = {}): Promise<number> {
  const {
    dryRun = false,
    rewrite = false,
    scaffold = true,
    cwd = process.cwd(),
    ignoreBuildErrors = false,
  } = options;
  const spinner = log.spinner('Loading configuration...');
  spinner.start();

  try {
    // Load configuration
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    spinner.text = 'Extracting contract metadata...';

    // Check contracts directory exists
    if (!existsSync(paths.contractsDir)) {
      spinner.fail(`Contracts directory not found: ${paths.contractsDir}`);
      return 1;
    }

    // Extract metadata from defineOpMeta calls
    const meta = await extractRouteMeta({
      contractsDir: paths.contractsDir,
      glob: config.contracts.glob,
    });

    const summary = summarizeMeta(meta);
    spinner.text = `Found ${summary.total} operations in contracts`;

    // Load and collect ops from router
    spinner.text = 'Loading router...';

    if (!existsSync(paths.routerPath)) {
      spinner.fail(`Router file not found: ${paths.routerPath}`);
      return 1;
    }

    // Auto-build contracts if needed
    const routerDistPath = paths.routerPath;
    const routerSrcPath = routerDistPath.replace(/\/dist\//, '/src/').replace(/\.js$/, '.ts');
    const needsBuild = !existsSync(routerDistPath) || (existsSync(routerSrcPath) && isStale(routerSrcPath, routerDistPath));

    if (needsBuild) {
      spinner.text = 'Building contracts...';
      try {
        // Try to build from the contracts directory
        const contractsPkgDir = path.dirname(path.dirname(routerDistPath));
        execSync('pnpm build', { cwd: contractsPkgDir, stdio: 'pipe' });
        spinner.text = 'Contracts built successfully';
      } catch (buildErr) {
        const errorMessage = buildErr instanceof Error ? buildErr.message : String(buildErr);

        if (ignoreBuildErrors) {
          spinner.warn('Contract build failed but --ignore-build-errors is set, continuing with existing build...');
          log.warn('WARNING: Routes may be generated from stale contracts!');
          log.warn(`Build error: ${errorMessage}`);
        } else {
          spinner.fail('Contract build failed. Fix build errors before generating routes.');
          log.error(`Build error: ${errorMessage}`);
          log.info('');
          log.info('To fix this:');
          log.info('  1. Run "pnpm build" in the contracts directory and fix any errors');
          log.info('  2. Or run with --ignore-build-errors to use existing built contracts (not recommended)');
          return 1;
        }
      }
    }

    // Dynamic import of the router
    let appRouter: unknown;
    try {
      // We need to use dynamic import with the file URL
      const { pathToFileURL } = await import('node:url');
      const routerUrl = pathToFileURL(paths.routerPath).href;
      const routerModule = await import(routerUrl);
      appRouter = routerModule.appRouter || routerModule.default;
    } catch (e) {
      spinner.fail(`Failed to load router: ${e instanceof Error ? e.message : String(e)}`);
      log.info('Note: Route generation requires the contracts to be built first.');
      log.info('Try running: pnpm build in the contracts directory');
      return 1;
    }

    if (!appRouter) {
      spinner.fail('Router does not export appRouter');
      return 1;
    }

    // Collect operations from router
    const ops = collectOps(appRouter);
    spinner.text = `Found ${ops.length} API routes`;

    // Merge operations with metadata
    const opsWithMeta = mergeOpsWithMeta(ops, meta);
    const withMeta = opsWithMeta.filter((op) => op.meta);
    const withoutMeta = opsWithMeta.filter((op) => !op.meta);

    if (withoutMeta.length > 0) {
      spinner.warn(`${withoutMeta.length} operations missing metadata`);
      for (const op of withoutMeta.slice(0, 5)) {
        log.warn(`  - ${op.group}.${op.name}`);
      }
      if (withoutMeta.length > 5) {
        log.warn(`  ... and ${withoutMeta.length - 5} more`);
      }
    }

    // Group operations by route path
    const byRoute = groupOpsByPath(withMeta, cwd);
    spinner.text = `Generating ${byRoute.size} route files...`;

    const generated: string[] = [];
    const errors: Array<{ path: string; error: string }> = [];

    // Generate routes
    for (const [routePath, routeOps] of byRoute) {
      try {
        const result = await generateRouteFile({
          routePath,
          ops: routeOps,
          runtime: config.routes.runtime,
          dryRun,
          rewrite,
        });

        if (result.generated) {
          generated.push(routePath);
        }
      } catch (e) {
        errors.push({
          path: routePath,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    spinner.stop();

    // Report results
    if (errors.length > 0) {
      log.error(`Failed to generate ${errors.length} routes:`);
      for (const { path: p, error } of errors) {
        log.error(`  - ${p}: ${error}`);
      }
    }

    if (generated.length > 0) {
      log.success(`Generated ${generated.length} route files${dryRun ? ' (dry run)' : ''}`);
      if (generated.length <= 10) {
        for (const p of generated) {
          const rel = path.relative(cwd, p);
          log.info(`  - ${rel}`);
        }
      }
    } else if (errors.length === 0) {
      log.info('No routes generated (all up to date or no metadata)');
    }

    return errors.length > 0 ? 1 : 0;
  } catch (e) {
    spinner.fail(`Route generation failed: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

interface GenerateRouteFileResult {
  generated: boolean;
  path: string;
}

async function generateRouteFile(args: {
  routePath: string;
  ops: OpWithMeta[];
  runtime: 'nodejs' | 'edge';
  dryRun: boolean;
  rewrite: boolean;
}): Promise<GenerateRouteFileResult> {
  const { routePath, ops, runtime, dryRun, rewrite } = args;

  // Generate handler for each operation
  const importLines: string[] = [];
  const methodBlocks: string[] = [];
  let effectiveRuntime = runtime;

  for (const op of ops) {
    if (!op.meta) continue;

    const opKey = `${op.group}.${op.name}`;
    const full = await renderRouteHandler({
      opKey,
      method: op.method,
      cfg: op.meta,
      sourcePath: op.meta.sourceFile,
    });

    // Split into import section + method block
    const headerStr = "/* AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT */";
    const idx = full.indexOf(headerStr);
    const imp = full.slice(0, idx).trim();
    const body = full.slice(idx + headerStr.length).trim();

    if (imp) importLines.push(...imp.split('\n').filter(Boolean));
    if (body) methodBlocks.push(body.replace(/^\n+/, ''));
  }

  if (methodBlocks.length === 0) {
    return { generated: false, path: routePath };
  }

  // Build final content
  const mergedImports = mergeImports(importLines);
  const header = "/* AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT */";
  const runtimeExport = `export const runtime = '${effectiveRuntime}';`;
  const content = [
    mergedImports.join('\n'),
    header,
    runtimeExport,
    methodBlocks.join('\n\n'),
  ]
    .filter(Boolean)
    .join('\n\n');

  // Check if file needs update
  if (!rewrite && existsSync(routePath)) {
    // TODO: Compare content to avoid unnecessary writes
  }

  if (!dryRun) {
    await ensureDir(path.dirname(routePath));
    await writeText(routePath, content);
  }

  return { generated: true, path: routePath };
}
