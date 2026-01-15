/**
 * Watch command for automatic regeneration on contract changes.
 *
 * Watches contract files and automatically regenerates routes and SDK
 * when changes are detected. Supports debouncing to handle rapid changes.
 */
import { watch } from 'node:fs';
import { join, relative } from 'node:path';
import { glob } from 'glob';
import { loadConfig, resolvePaths } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import { routesGen } from '../routes/gen.js';
import { sdkGen } from '../sdk/gen.js';
import { checkRoutesStaleness, checkSdkStaleness } from '../../utils/staleness.js';

export interface WatchOptions {
  /** Only watch for route changes */
  routes?: boolean;
  /** Only watch for SDK changes */
  sdk?: boolean;
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Run initial generation before watching */
  initial?: boolean;
  /** Working directory */
  cwd?: string;
}

interface WatchState {
  pending: boolean;
  timeout: NodeJS.Timeout | null;
  lastRun: Date | null;
  errors: number;
}

/**
 * Watch contracts and regenerate on changes.
 */
export async function watchContracts(options: WatchOptions = {}): Promise<number> {
  const {
    routes = true,
    sdk = true,
    debounce = 500,
    initial = true,
    cwd = process.cwd(),
  } = options;

  const spinner = log.spinner('Loading configuration...');
  spinner.start();

  try {
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    spinner.text = 'Setting up file watcher...';

    // Get contract files to watch
    const contractFiles = await glob(config.contracts.glob, {
      cwd: paths.contractsDir,
      absolute: true,
    });

    if (contractFiles.length === 0) {
      spinner.fail('No contract files found to watch');
      return 1;
    }

    spinner.succeed(`Watching ${contractFiles.length} contract files`);

    // Run initial generation if requested
    if (initial) {
      log.info('Running initial generation...');

      if (routes) {
        const routesResult = await checkRoutesStaleness({
          contractsDir: paths.contractsDir,
          routesDir: join(cwd, 'src/app/api'),
        });

        if (routesResult.isStale) {
          log.info('Routes are stale, regenerating...');
          await routesGen({ cwd });
        } else {
          log.dim('Routes are up to date');
        }
      }

      if (sdk) {
        const sdkResult = await checkSdkStaleness({
          contractsDir: paths.contractsDir,
          sdkDir: paths.sdkOutput,
        });

        if (sdkResult.isStale) {
          log.info('SDK is stale, regenerating...');
          await sdkGen({ cwd });
        } else {
          log.dim('SDK is up to date');
        }
      }
    }

    // Watch state for debouncing
    const state: WatchState = {
      pending: false,
      timeout: null,
      lastRun: null,
      errors: 0,
    };

    // Regeneration handler with debouncing
    const handleChange = async (eventType: string, filename: string | null) => {
      if (!filename) return;

      const fullPath = join(paths.contractsDir, filename);
      const relPath = relative(cwd, fullPath);

      log.dim(`[${eventType}] ${relPath}`);

      // Clear existing timeout
      if (state.timeout) {
        clearTimeout(state.timeout);
      }

      // Set pending and schedule regeneration
      state.pending = true;
      state.timeout = setTimeout(async () => {
        if (!state.pending) return;
        state.pending = false;

        log.info('Detected changes, regenerating...');
        const startTime = Date.now();

        try {
          if (routes) {
            await routesGen({ cwd });
          }
          if (sdk) {
            await sdkGen({ cwd });
          }

          const elapsed = Date.now() - startTime;
          log.success(`Regenerated in ${elapsed}ms`);
          state.lastRun = new Date();
          state.errors = 0;
        } catch (err) {
          state.errors++;
          log.error(`Regeneration failed: ${err instanceof Error ? err.message : String(err)}`);

          if (state.errors >= 3) {
            log.warn('Multiple failures detected. Check your contracts for errors.');
          }
        }
      }, debounce);
    };

    // Set up watchers for each contract file's directory
    const watchedDirs = new Set<string>();
    const watchers: ReturnType<typeof watch>[] = [];

    for (const file of contractFiles) {
      const dir = join(file, '..');
      if (!watchedDirs.has(dir)) {
        watchedDirs.add(dir);

        const watcher = watch(dir, { recursive: false }, (event, filename) => {
          // Only handle .contract.ts files
          if (filename && filename.endsWith('.contract.ts')) {
            handleChange(event, join(relative(paths.contractsDir, dir), filename));
          }
        });

        watchers.push(watcher);
      }
    }

    // Also watch the contracts directory itself for new files
    const rootWatcher = watch(paths.contractsDir, { recursive: true }, (event, filename) => {
      if (filename && filename.endsWith('.contract.ts')) {
        handleChange(event, filename);
      }
    });
    watchers.push(rootWatcher);

    log.newline();
    log.info('Watching for contract changes...');
    log.dim('Press Ctrl+C to stop');
    log.newline();

    // Keep the process running
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        log.newline();
        log.info('Stopping watcher...');

        // Close all watchers
        for (const w of watchers) {
          w.close();
        }

        resolve();
      });
    });

    return 0;
  } catch (err) {
    spinner.fail(`Watch setup failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

/**
 * Check if generated files are stale and report status.
 */
export async function checkStaleness(options: { cwd?: string } = {}): Promise<number> {
  const { cwd = process.cwd() } = options;

  const spinner = log.spinner('Checking staleness...');
  spinner.start();

  try {
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    const routesResult = await checkRoutesStaleness({
      contractsDir: paths.contractsDir,
      routesDir: join(cwd, 'src/app/api'),
    });

    const sdkResult = await checkSdkStaleness({
      contractsDir: paths.contractsDir,
      sdkDir: paths.sdkOutput,
    });

    spinner.stop();

    log.section('Staleness Check');

    // Routes status
    if (routesResult.isStale) {
      log.error(`Routes: STALE`);
      log.dim(`  ${routesResult.reason}`);
    } else {
      log.success(`Routes: Up to date`);
    }

    // SDK status
    if (sdkResult.isStale) {
      log.error(`SDK: STALE`);
      log.dim(`  ${sdkResult.reason}`);
    } else {
      log.success(`SDK: Up to date`);
    }

    log.newline();

    // Summary
    const isStale = routesResult.isStale || sdkResult.isStale;
    if (isStale) {
      log.warn('Generated files are out of date. Run:');
      if (routesResult.isStale) {
        log.dim('  unisane generate routes');
      }
      if (sdkResult.isStale) {
        log.dim('  unisane generate sdk');
      }
      log.dim('  # Or run both:');
      log.dim('  unisane sync');
      return 1;
    }

    return 0;
  } catch (err) {
    spinner.fail(`Check failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
