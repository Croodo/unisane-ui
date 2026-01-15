/**
 * SDK generation command
 *
 * Generates SDK clients, hooks, and types from ts-rest contracts.
 */
import * as path from 'node:path';
import { loadConfig, resolvePaths } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import { existsSync, ensureDir } from '../../utils/fs.js';
import { genTypes } from '../../generators/sdk/gen-types.js';
import { genExtractedTypes } from '../../generators/sdk/gen-extracted-types.js';
import { genBrowser } from '../../generators/sdk/gen-browser.js';
import { genServer } from '../../generators/sdk/gen-server.js';
import { genHooks } from '../../generators/sdk/gen-hooks.js';
import { genVue } from '../../generators/sdk/gen-vue.js';
import { genZod } from '../../generators/sdk/gen-zod.js';
import { genOpenApi } from '../../generators/sdk/gen-openapi.js';
import type { SdkTarget } from '../../generators/sdk/types.js';

export interface SdkGenOptions {
  /** Generate clients only */
  clients?: boolean;
  /** Generate React hooks only */
  hooks?: boolean;
  /** Generate Vue composables only */
  vue?: boolean;
  /** Generate Zod schemas only */
  zod?: boolean;
  /** Generate TypeScript types only */
  types?: boolean;
  /** Generate OpenAPI spec only */
  openapi?: boolean;
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Working directory */
  cwd?: string;
}

/**
 * Generate SDK from contracts
 */
export async function sdkGen(options: SdkGenOptions = {}): Promise<number> {
  const {
    clients = false,
    hooks = false,
    vue = false,
    zod = false,
    types = false,
    openapi = false,
    dryRun = false,
    cwd = process.cwd(),
  } = options;

  // Determine which targets to generate
  const hasSpecificTarget = clients || hooks || vue || zod || types || openapi;
  const targets: SdkTarget[] = hasSpecificTarget
    ? [
        ...(clients ? ['browser', 'server'] as SdkTarget[] : []),
        ...(hooks ? ['hooks'] as SdkTarget[] : []),
        ...(vue ? ['vue'] as SdkTarget[] : []),
        ...(zod ? ['zod'] as SdkTarget[] : []),
        ...(types ? ['types'] as SdkTarget[] : []),
        ...(openapi ? ['openapi'] as SdkTarget[] : []),
      ]
    : ['browser', 'server', 'types', 'hooks']; // Default targets (openapi not included by default)

  const spinner = log.spinner('Loading configuration...');
  spinner.start();

  try {
    // Load configuration
    const config = await loadConfig(cwd);
    const paths = resolvePaths(config, cwd);

    // Check contracts directory exists
    if (!existsSync(paths.contractsDir)) {
      spinner.fail(`Contracts directory not found: ${paths.contractsDir}`);
      return 1;
    }

    // Check router file exists
    if (!existsSync(paths.routerPath)) {
      spinner.fail(`Router file not found: ${paths.routerPath}`);
      return 1;
    }

    spinner.text = 'Loading router...';

    // Dynamic import of the router
    let appRouter: unknown;
    try {
      const { pathToFileURL } = await import('node:url');
      const routerUrl = pathToFileURL(paths.routerPath).href;
      const routerModule = await import(routerUrl);
      appRouter = routerModule.appRouter || routerModule.default;
    } catch (e) {
      spinner.fail(`Failed to load router: ${e instanceof Error ? e.message : String(e)}`);
      log.info('Note: SDK generation requires the contracts to be built first.');
      log.info('Try running: pnpm build in the contracts directory');
      return 1;
    }

    if (!appRouter) {
      spinner.fail('Router does not export appRouter');
      return 1;
    }

    const generated: string[] = [];
    const errors: string[] = [];

    // Ensure output directory exists
    if (!dryRun) {
      await ensureDir(paths.sdkOutput);
    }

    // Generate types
    if (targets.includes('types')) {
      spinner.text = 'Generating types...';
      try {
        const typesOutput = path.join(paths.sdkOutput, 'types.ts');
        await genTypes({
          output: typesOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('types.ts');
      } catch (e) {
        errors.push(`types: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate browser client (domain-structured)
    if (targets.includes('browser')) {
      spinner.text = 'Generating browser client...';
      try {
        const browserOutput = path.join(paths.sdkOutput, 'clients/generated');
        await genBrowser({
          output: browserOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('clients/generated/');
      } catch (e) {
        errors.push(`browser: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate server client (domain-structured)
    if (targets.includes('server')) {
      spinner.text = 'Generating server client...';
      try {
        const serverOutput = path.join(paths.sdkOutput, 'clients/generated');
        await genServer({
          output: serverOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('clients/generated/server.ts');
      } catch (e) {
        errors.push(`server: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate React hooks (requires extracted types first)
    if (targets.includes('hooks')) {
      // First, generate extracted types that hooks depend on
      spinner.text = 'Extracting types for hooks...';
      try {
        const extractedTypesOutput = path.join(paths.sdkOutput, 'types/generated');
        await genExtractedTypes({
          output: extractedTypesOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('types/generated/');
      } catch (e) {
        errors.push(`extracted-types: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Then generate hooks that import from extracted types
      spinner.text = 'Generating React hooks...';
      try {
        const hooksOutput = path.join(paths.sdkOutput, 'hooks/generated');
        await genHooks({
          output: hooksOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('hooks/generated/');
      } catch (e) {
        errors.push(`hooks: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate Vue composables
    if (targets.includes('vue')) {
      spinner.text = 'Generating Vue composables...';
      try {
        const vueOutput = path.join(paths.sdkOutput, 'vue/generated');
        await genVue({
          output: vueOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('vue/generated/');
      } catch (e) {
        errors.push(`vue: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate Zod schemas
    if (targets.includes('zod')) {
      spinner.text = 'Generating Zod schemas...';
      try {
        const zodOutput = path.join(paths.sdkOutput, 'schemas.ts');
        await genZod({
          output: zodOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('schemas.ts');
      } catch (e) {
        errors.push(`zod: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Generate OpenAPI spec
    if (targets.includes('openapi')) {
      spinner.text = 'Generating OpenAPI spec...';
      try {
        const openapiOutput = path.join(paths.sdkOutput, 'openapi.json');
        await genOpenApi({
          output: openapiOutput,
          appRouter,
          routerPath: paths.routerPath,
          dryRun,
        });
        generated.push('openapi.json');
      } catch (e) {
        errors.push(`openapi: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    spinner.stop();

    // Report results
    if (errors.length > 0) {
      log.error(`Failed to generate ${errors.length} targets:`);
      for (const err of errors) {
        log.error(`  - ${err}`);
      }
    }

    if (generated.length > 0) {
      log.success(`Generated ${generated.length} SDK files${dryRun ? ' (dry run)' : ''}`);
      for (const f of generated) {
        log.info(`  - ${f}`);
      }
    }

    return errors.length > 0 ? 1 : 0;
  } catch (e) {
    spinner.fail(`SDK generation failed: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
