import * as path from 'node:path';
import { log } from '../../utils/logger.js';
import { walk, exists, readText, relative } from '../../utils/fs.js';
import { loadConfig, resolvePaths } from '../../config/index.js';

export interface DoctorOptions {
  fix?: boolean;
}

export interface Finding {
  kind: 'error' | 'warn';
  file: string;
  note: string;
}

/**
 * Run health checks on the project
 */
export async function doctor(opts: DoctorOptions = {}): Promise<number> {
  const findings: Finding[] = [];
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const paths = resolvePaths(config, cwd);

  log.section('Running health checks...');

  // Check 1: Config file exists
  const configExists = await exists(path.join(cwd, 'devtools.config.ts'));
  if (!configExists) {
    findings.push({
      kind: 'warn',
      file: 'devtools.config.ts',
      note: 'No devtools.config.ts found. Using default configuration.',
    });
  }

  // Check 2: Contracts directory exists
  const contractsDirExists = await exists(paths.contractsDir);
  if (!contractsDirExists) {
    findings.push({
      kind: 'warn',
      file: config.contracts.dir,
      note: `Contracts directory not found at ${config.contracts.dir}`,
    });
  }

  // Check 3: Router file exists
  const routerExists = await exists(paths.routerPath);
  if (!routerExists) {
    findings.push({
      kind: 'warn',
      file: config.contracts.router,
      note: `Router file not found at ${config.contracts.router}`,
    });
  }

  // Check 4: Check for route.ts files with missing runtime export
  const apiDir = path.join(cwd, 'src/app/api');
  if (await exists(apiDir)) {
    for await (const f of walk(apiDir)) {
      if (!f.endsWith('/route.ts') && !f.endsWith('\\route.ts')) continue;
      const text = await readText(f);
      if (!/export\s+const\s+runtime\s*=/.test(text)) {
        findings.push({
          kind: 'warn',
          file: relative(f),
          note: "Route handler missing `export const runtime = 'nodejs'`",
        });
      }
    }
  }

  // Check 5: Check for package.json
  const pkgJsonPath = path.join(cwd, 'package.json');
  if (!(await exists(pkgJsonPath))) {
    findings.push({
      kind: 'error',
      file: 'package.json',
      note: 'No package.json found in current directory',
    });
  }

  // Check 6: Check for tsconfig.json
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  if (!(await exists(tsconfigPath))) {
    findings.push({
      kind: 'warn',
      file: 'tsconfig.json',
      note: 'No tsconfig.json found',
    });
  }

  // Check 7: Verify SDK output directory structure
  const sdkDir = paths.sdkOutput;
  if (await exists(sdkDir)) {
    const expectedDirs = ['browser', 'server', 'react', 'types'];
    for (const dir of expectedDirs) {
      const dirPath = path.join(sdkDir, dir);
      if (!(await exists(dirPath))) {
        findings.push({
          kind: 'warn',
          file: `${config.sdk.output}/${dir}`,
          note: `SDK directory missing: ${dir}. Run 'devtools sdk:gen' to generate.`,
        });
      }
    }
  }

  // Print findings
  if (findings.length === 0) {
    log.success('No issues found');
    return 0;
  }

  const errors = findings.filter((f) => f.kind === 'error');
  const warnings = findings.filter((f) => f.kind === 'warn');

  if (warnings.length > 0) {
    log.section(`Warnings (${warnings.length})`);
    for (const f of warnings) {
      log.warn(`${f.file}: ${f.note}`);
    }
  }

  if (errors.length > 0) {
    log.section(`Errors (${errors.length})`);
    for (const f of errors) {
      log.error(`${f.file}: ${f.note}`);
    }
  }

  console.log('');
  if (errors.length > 0) {
    log.error(`Found ${errors.length} error(s) and ${warnings.length} warning(s)`);
    return 1;
  }

  log.warn(`Found ${warnings.length} warning(s)`);
  return 0;
}
