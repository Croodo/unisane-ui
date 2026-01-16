/**
 * Sync command - runs all generators and health checks.
 *
 * This is the recommended way to ensure all generated code is up to date.
 * It runs routes, SDK, and doctor in sequence.
 */
import { join } from 'node:path';
import { loadConfig, resolvePaths } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import { routesGen } from '../routes/gen.js';
import { sdkGen } from '../sdk/gen.js';
import { doctor } from '../dev/doctor.js';
import {
  checkRoutesStaleness,
  checkSdkStaleness,
  writeStalenessManifest,
} from '../../utils/staleness.js';
import { glob } from 'glob';

export interface SyncOptions {
  /** Skip routes generation */
  skipRoutes?: boolean;
  /** Skip SDK generation */
  skipSdk?: boolean;
  /** Skip doctor checks */
  skipDoctor?: boolean;
  /** Force regeneration even if not stale */
  force?: boolean;
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Auto-fix doctor issues */
  fix?: boolean;
  /** Working directory */
  cwd?: string;
}

export interface SyncResult {
  routes: { success: boolean; skipped: boolean; reason?: string };
  sdk: { success: boolean; skipped: boolean; reason?: string };
  doctor: { success: boolean; skipped: boolean; issues?: number };
  totalTime: number;
}

/**
 * Run all generators and health checks.
 */
export async function sync(options: SyncOptions = {}): Promise<number> {
  const {
    skipRoutes = false,
    skipSdk = false,
    skipDoctor = false,
    force = false,
    dryRun = false,
    fix = false,
    cwd = process.cwd(),
  } = options;

  const startTime = Date.now();
  const results: SyncResult = {
    routes: { success: true, skipped: false },
    sdk: { success: true, skipped: false },
    doctor: { success: true, skipped: false },
    totalTime: 0,
  };

  log.section('Sync');
  log.newline();

  try {
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    // Get all contract source files for manifest
    const contractFiles = await glob(config.contracts.glob, {
      cwd: paths.contractsDir,
      absolute: true,
    });

    // ════════════════════════════════════════════════════════════════════════
    // ROUTES GENERATION
    // ════════════════════════════════════════════════════════════════════════

    if (skipRoutes) {
      results.routes.skipped = true;
      results.routes.reason = 'Skipped by user';
      log.dim('Routes: Skipped');
    } else {
      const routesDir = join(cwd, 'src/app/api');

      // Check staleness unless force is set
      if (!force) {
        const staleness = await checkRoutesStaleness({
          contractsDir: paths.contractsDir,
          routesDir,
        });

        if (!staleness.isStale) {
          results.routes.skipped = true;
          results.routes.reason = 'Up to date';
          log.success('Routes: Up to date (skipped)');
        }
      }

      if (!results.routes.skipped) {
        log.info('Routes: Generating...');
        try {
          const code = await routesGen({ dryRun, cwd });
          results.routes.success = code === 0;

          if (results.routes.success && !dryRun) {
            // Write manifest for future staleness checks
            writeStalenessManifest({
              outputDir: routesDir,
              generator: 'routes',
              sourceFiles: contractFiles,
            });
          }

          if (results.routes.success) {
            log.success('Routes: Generated');
          } else {
            log.error('Routes: Failed');
          }
        } catch (err) {
          results.routes.success = false;
          results.routes.reason = err instanceof Error ? err.message : String(err);
          log.error(`Routes: ${results.routes.reason}`);
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SDK GENERATION
    // ════════════════════════════════════════════════════════════════════════

    if (skipSdk) {
      results.sdk.skipped = true;
      results.sdk.reason = 'Skipped by user';
      log.dim('SDK: Skipped');
    } else {
      // Check staleness unless force is set
      if (!force) {
        const staleness = await checkSdkStaleness({
          contractsDir: paths.contractsDir,
          sdkDir: paths.sdkOutput,
        });

        if (!staleness.isStale) {
          results.sdk.skipped = true;
          results.sdk.reason = 'Up to date';
          log.success('SDK: Up to date (skipped)');
        }
      }

      if (!results.sdk.skipped) {
        log.info('SDK: Generating...');
        try {
          const code = await sdkGen({ dryRun, cwd });
          results.sdk.success = code === 0;

          if (results.sdk.success && !dryRun) {
            // Write manifest for future staleness checks
            writeStalenessManifest({
              outputDir: paths.sdkOutput,
              generator: 'sdk',
              sourceFiles: contractFiles,
            });
          }

          if (results.sdk.success) {
            log.success('SDK: Generated');
          } else {
            log.error('SDK: Failed');
          }
        } catch (err) {
          results.sdk.success = false;
          results.sdk.reason = err instanceof Error ? err.message : String(err);
          log.error(`SDK: ${results.sdk.reason}`);
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR CHECKS
    // ════════════════════════════════════════════════════════════════════════

    if (skipDoctor) {
      results.doctor.skipped = true;
      log.dim('Doctor: Skipped');
    } else {
      log.info('Doctor: Running health checks...');
      try {
        const code = await doctor({ fix });
        results.doctor.success = code === 0;

        if (results.doctor.success) {
          log.success('Doctor: All checks passed');
        } else {
          log.warn('Doctor: Some issues found');
          results.doctor.issues = code;
        }
      } catch (err) {
        results.doctor.success = false;
        log.error(`Doctor: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════════════════════════════════

    results.totalTime = Date.now() - startTime;

    log.newline();
    log.section('Summary');

    const allSuccess =
      results.routes.success && results.sdk.success && results.doctor.success;
    const anySkipped =
      results.routes.skipped || results.sdk.skipped || results.doctor.skipped;

    if (allSuccess) {
      if (anySkipped) {
        log.success(`Sync completed in ${results.totalTime}ms (some steps skipped)`);
      } else {
        log.success(`Sync completed in ${results.totalTime}ms`);
      }
    } else {
      log.error(`Sync completed with errors in ${results.totalTime}ms`);
    }

    return allSuccess ? 0 : 1;
  } catch (err) {
    log.error(`Sync failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

/**
 * Pre-build hook - check staleness and fail if stale.
 * Used in CI/CD to ensure generated code is committed.
 */
export async function preBuildCheck(options: { cwd?: string; strict?: boolean } = {}): Promise<number> {
  const { cwd = process.cwd(), strict = true } = options;

  log.section('Pre-build Check');

  try {
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    const routesDir = join(cwd, 'src/app/api');

    const routesStale = await checkRoutesStaleness({
      contractsDir: paths.contractsDir,
      routesDir,
    });

    const sdkStale = await checkSdkStaleness({
      contractsDir: paths.contractsDir,
      sdkDir: paths.sdkOutput,
    });

    const isStale = routesStale.isStale || sdkStale.isStale;

    if (isStale) {
      log.error('Generated files are out of date!');
      log.newline();

      if (routesStale.isStale) {
        log.warn('Routes are stale:');
        log.dim(`  ${routesStale.reason}`);
      }

      if (sdkStale.isStale) {
        log.warn('SDK is stale:');
        log.dim(`  ${sdkStale.reason}`);
      }

      log.newline();
      log.info('Run `unisane sync` to regenerate and commit the changes.');

      if (strict) {
        return 1;
      }
    } else {
      log.success('All generated files are up to date');
    }

    return 0;
  } catch (err) {
    log.error(`Pre-build check failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
