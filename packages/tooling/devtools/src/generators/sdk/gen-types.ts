/**
 * SDK type generation
 *
 * Generates TypeScript type definitions from contracts.
 */
import * as path from 'node:path';
import { header, pascalCase } from './utils.js';
import { parseRouterImports } from './router-parser.js';
import { writeText, ensureDir } from '../../utils/fs.js';

export interface GenTypesOptions {
  /** Output file path */
  output: string;
  /** App router object */
  appRouter: unknown;
  /** Path to router source file */
  routerPath: string;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Generate SDK type definitions
 */
export async function genTypes(options: GenTypesOptions): Promise<void> {
  const { output, appRouter, routerPath, dryRun } = options;

  const importMap = await parseRouterImports(routerPath);
  const routerObj = appRouter as Record<string, Record<string, unknown>>;
  const groups = Object.keys(routerObj);

  const headerComment = header('sdk:gen --types');

  // Generate imports
  const imports = groups
    .map((g) => {
      const im = importMap[g];
      if (!im) return `// import { ${g}Contract } from '@/src/contracts/${g}.contract';`;
      return `import { ${im.varName} } from '${im.importPath}';`;
    })
    .join('\n');

  // Generate type helpers
  const typeHelpers = `
import type { ClientInferResponseBody } from '@ts-rest/core';
type DataOf<T> = T extends { data: infer D } ? D : T;
type RouteOf<T> = Extract<T, import('@ts-rest/core').AppRoute>;
`;

  // Generate types for each operation
  const lines: string[] = [];
  for (const g of groups) {
    const varName = importMap[g]?.varName ?? `${g}Contract`;
    const entries = Object.keys(routerObj[g] ?? {});

    for (const op of entries) {
      const Group = pascalCase(g);
      const Op = pascalCase(op);
      const Resp = `${Group}${Op}Response`;
      const Item = `${Group}${Op}Item`;

      lines.push(
        `export type ${Resp} = DataOf<ClientInferResponseBody<RouteOf<typeof ${varName}['${op}']>, 200>>;`
      );
      lines.push(
        `export type ${Item} = ${Resp} extends { items: infer I } ? I extends Array<infer U> ? U : never : never;`
      );
    }
  }

  // Friendly aliases for common admin lists
  const adminAliases = [
    ['tenants', 'adminList', 'AdminTenantsListItem'],
    ['users', 'adminList', 'AdminUsersListItem'],
  ] as const;

  for (const [group, op, alias] of adminAliases) {
    if (routerObj[group]?.[op]) {
      const Group = pascalCase(group);
      const Op = pascalCase(op);
      lines.push(`export type ${alias} = ${Group}${Op}Item;`);
    }
  }

  // Assemble output
  const content = [headerComment, imports, typeHelpers, '', lines.join('\n')].join('\n');

  if (!dryRun) {
    await ensureDir(path.dirname(output));
    await writeText(output, content);
  }
}
