/**
 * Route handler code generation
 *
 * **Type Cast Note:**
 * Generated code uses `as unknown as Parameters<typeof fn>[0]` casts in service calls.
 * This is necessary because:
 * 1. The generator constructs call arguments dynamically from contract metadata
 * 2. TypeScript can't verify the relationship between extracted metadata and function types
 * 3. Runtime validation is handled by Zod schemas before the service is called
 *
 * The pattern is safe because:
 * - Zod validates all inputs at the gateway layer before service calls
 * - Type mismatches will fail at runtime with clear validation errors
 * - The generator follows a tested, consistent pattern for argument mapping
 */
import type { RouteGenEntry } from '../../extraction/types.js';
import { ImportBuilder, toModuleImport } from './imports.js';
import {
  collectParamKeys,
  generateParamsType,
  generateValueAccessor,
  applyTransform,
  applyFallback,
} from './params.js';

/**
 * SEC-006 FIX: Sanitize strings before interpolation into generated code.
 * This prevents code injection via malicious configuration values.
 */
function sanitizeStringLiteral(value: string): string {
  // Escape characters that could break out of string literals or inject code
  return value
    .replace(/\\/g, '\\\\')      // Escape backslashes first
    .replace(/'/g, "\\'")        // Escape single quotes
    .replace(/"/g, '\\"')        // Escape double quotes
    .replace(/`/g, '\\`')        // Escape backticks
    .replace(/\$/g, '\\$')       // Escape $ to prevent template literal injection
    .replace(/\n/g, '\\n')       // Escape newlines
    .replace(/\r/g, '\\r')       // Escape carriage returns
    .replace(/\t/g, '\\t')       // Escape tabs
    .replace(/[\x00-\x1f\x7f]/g, ''); // Remove other control characters
}

/**
 * SEC-006 FIX: Validate that an identifier is safe for code generation.
 * Only allows valid JavaScript identifiers and property access chains.
 */
function validateIdentifier(value: string, context: string): string {
  // Allow valid JS identifiers and property access (e.g., PERM.READ_USERS)
  const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;
  if (!identifierPattern.test(value)) {
    throw new Error(
      `[gen-routes] Invalid identifier in ${context}: "${value}". Only valid JavaScript identifiers are allowed.`
    );
  }
  return value;
}

/**
 * SEC-006 FIX: Validate that an expression doesn't contain dangerous patterns.
 * This is a basic sanity check for code expressions that must be interpolated.
 * It blocks obvious attack vectors but allows legitimate code.
 */
function validateExpression(value: string, context: string): string {
  const trimmed = value.trim();

  // Block obviously dangerous patterns
  const dangerousPatterns = [
    /\beval\s*\(/i,           // eval()
    /\bFunction\s*\(/i,       // Function constructor
    /\bimport\s*\(/i,         // dynamic import
    /\brequire\s*\(/i,        // require
    /\b__proto__\b/i,         // prototype pollution
    /\bconstructor\s*\[/i,    // constructor access
    /\bprocess\s*\.\s*exit/i, // process.exit
    /\bchild_process\b/i,     // child_process
    /\bexec\s*\(/i,           // exec()
    /\bspawn\s*\(/i,          // spawn()
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      throw new Error(
        `[gen-routes] Potentially dangerous expression in ${context}: "${value}". This pattern is not allowed.`
      );
    }
  }

  return value;
}

/**
 * DEV-005 FIX: Validate resourceIdExpr format more strictly.
 *
 * resourceIdExpr is used to extract a resource ID for audit logging.
 * It must follow one of these safe patterns:
 * - 'null' (literal null)
 * - params.xxx (route parameter access)
 * - body.xxx or bodySafe.xxx (body field access)
 * - result.xxx (service call result access)
 * - A string literal ('...', "...", `...`)
 * - A template literal with params/body/result interpolation
 *
 * This prevents arbitrary code execution through the resourceIdExpr config.
 */
function validateResourceIdExpr(value: string, context: string): string {
  const trimmed = value.trim();

  // Allow 'null' literal
  if (trimmed === 'null') {
    return value;
  }

  // Run general dangerous pattern check first
  validateExpression(value, context);

  // Safe patterns for resourceIdExpr
  const safePatterns = [
    /^params\.[a-zA-Z_][a-zA-Z0-9_]*$/,                   // params.id
    /^body\.[a-zA-Z_][a-zA-Z0-9_]*$/,                     // body.id
    /^bodySafe\.[a-zA-Z_][a-zA-Z0-9_]*$/,                 // bodySafe.id
    /^result\.[a-zA-Z_][a-zA-Z0-9_.]*$/,                  // result.id or result.data.id
    /^'[^']*'$/,                                          // 'string literal'
    /^"[^"]*"$/,                                          // "string literal"
    /^`[^`]*`$/,                                          // `template literal`
    /^`\$\{(params|body|bodySafe|result)\.[a-zA-Z0-9_.]+\}`$/, // `${params.id}`
  ];

  // Check if it matches any safe pattern
  const isSafeSimple = safePatterns.some(p => p.test(trimmed));
  if (isSafeSimple) {
    return value;
  }

  // For complex template literals, validate the interpolations
  // Pattern: `prefix${body.field}suffix` or similar with multiple interpolations
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    // Extract all ${...} interpolations
    const interpolations = trimmed.match(/\$\{[^}]+\}/g) || [];

    // Each interpolation must be a safe property access
    const safeInterpolation = /^\$\{(params|body|bodySafe|result)\.[a-zA-Z0-9_.]+\}$/;

    for (const interp of interpolations) {
      if (!safeInterpolation.test(interp)) {
        throw new Error(
          `[gen-routes] Unsafe interpolation in ${context}: "${interp}". ` +
          `Only params.*, body.*, bodySafe.*, or result.* property access is allowed.`
        );
      }
    }

    return value;
  }

  // If none of the safe patterns match, reject
  throw new Error(
    `[gen-routes] Invalid resourceIdExpr format in ${context}: "${value}". ` +
    `Must be null, a string literal, or a property access (params.x, body.x, result.x).`
  );
}

export interface RenderOptions {
  /** Use @unisane/* package imports (true) or @/src/modules/* (false) */
  usePackages?: boolean;
  /** Gateway import path for httpHandler */
  gatewayPath?: string;
  /** Audit module import path */
  auditPath?: string;
  /** RBAC module import path */
  rbacPath?: string;
  /** Query DSL import path */
  queryDslPath?: string;
  /** Query parser import path */
  queryPath?: string;
  /** Env import path for fallback values */
  envPath?: string;
}

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  usePackages: true,
  gatewayPath: '@unisane/gateway',
  auditPath: '@unisane/audit',
  rbacPath: '@unisane/gateway/rbac',
  queryDslPath: '@unisane/gateway/queryDsl',
  queryPath: '@unisane/gateway/query',
  envPath: '@unisane/kernel',
};

/**
 * Render a route handler for a single operation
 */
export async function renderRouteHandler(args: {
  opKey: string;
  method: string;
  cfg: RouteGenEntry;
  options?: RenderOptions;
  /** Source file path for error context */
  sourcePath?: string;
}): Promise<string> {
  const { opKey, method, cfg, options = {}, sourcePath } = args;
  const fileContext = sourcePath ? ` (from ${sourcePath})` : '';
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const header = `/* AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT */`;
  const hasBody = !!cfg.zodBody;
  const hasQuery = !!cfg.zodQuery;
  const hasParams = !!cfg.zodParams;
  const handlerName = method.toUpperCase();
  const bodyAlias = hasBody ? `__BodySchema_${handlerName}` : '';
  const queryAlias = hasQuery ? `__QuerySchema_${handlerName}` : '';
  const paramsAlias = hasParams ? `__ParamsSchema_${handlerName}` : '';

  const imports = new ImportBuilder(opts.usePackages);

  // Add httpHandler import
  imports.add(opts.gatewayPath, cfg.raw ? 'makeHandlerRaw' : 'makeHandler');

  // Add service import
  const serviceImportPath = toModuleImport(cfg.importPath, opts.usePackages);
  const factoryImportPath = cfg.factory
    ? toModuleImport(cfg.factory.importPath, opts.usePackages)
    : null;
  const factoryClobbersService =
    factoryImportPath &&
    factoryImportPath === serviceImportPath &&
    cfg.factory?.name === cfg.fn;

  if (!factoryClobbersService) {
    imports.add(serviceImportPath, cfg.fn);
  }

  // Add extra imports
  if (cfg.extraImports && cfg.extraImports.length) {
    for (const e of cfg.extraImports) {
      imports.add(toModuleImport(e.importPath, opts.usePackages), e.names);
    }
  }

  // Add audit import if needed
  if (cfg.audit) {
    imports.add(opts.auditPath, 'appendAudit');
  }

  // Build guard configuration
  const guardBits: string[] = [];
  // SEC-006 FIX: Sanitize operation name to prevent code injection
  const safeOp = sanitizeStringLiteral(cfg.op ?? opKey);
  guardBits.push(`op: "${safeOp}"`);
  if (cfg.allowUnauthed) guardBits.push('allowUnauthed: true');
  if (cfg.requireUser) guardBits.push('requireUser: true');
  if (cfg.requireTenantMatch) guardBits.push('requireTenantMatch: true');
  if (cfg.requireSuperAdmin) guardBits.push('requireSuperAdmin: true');

  // Add permission (as identifier, not string)
  // SEC-006 FIX: Validate perm is a valid identifier to prevent code injection
  if (cfg.perm) {
    const safePerm = validateIdentifier(cfg.perm, `${opKey}.perm`);
    guardBits.push(`perm: ${safePerm}`);
    if (safePerm.startsWith('PERM.')) {
      imports.add(opts.rbacPath, 'PERM');
    }
  }
  if (cfg.idempotent) guardBits.push('idempotent: true');

  // Build guard string with optional zod schemas
  const zodParts: string[] = [];
  if (hasBody) zodParts.push(`zod: ${bodyAlias}`);
  if (hasParams) zodParts.push(`zodParams: ${paramsAlias}`);
  const guard = `{ ${guardBits.join(', ')}${zodParts.length ? `, ${zodParts.join(', ')}` : ''} }`;

  const beforeCall: string[] = [];
  let bodySchemaDecl: string | null = null;
  let querySchemaDecl: string | null = null;
  let paramsSchemaDecl: string | null = null;

  // Collect param keys for typed params
  const paramKeys = collectParamKeys(cfg);
  const paramsType = generateParamsType(paramKeys, !!cfg.audit);
  const needsTypedParams = paramKeys.length > 0 || cfg.audit;

  if (needsTypedParams) {
    beforeCall.push(`const __params = params as ${paramsType};`);
  }

  // Path params schema handling (for runtime validation)
  if (hasParams) {
    imports.add('zod', 'z');
    const ip = toModuleImport(cfg.zodParams!.importPath, opts.usePackages);
    const nm = cfg.zodParams!.name;
    const isIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm);
    if (isIdent) {
      imports.add(ip, `${nm} as ${paramsAlias}`);
    } else {
      imports.add(ip, nm);
      paramsSchemaDecl = `const ${paramsAlias} = ${nm};`;
    }
  }

  // Body handling
  let bodyRef = 'body';
  if (hasBody) {
    imports.add('zod', 'z');
    const ip = toModuleImport(cfg.zodBody!.importPath, opts.usePackages);
    const nm = cfg.zodBody!.name;
    const isIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm);
    if (isIdent) {
      imports.add(ip, `${nm} as ${bodyAlias}`);
    } else {
      imports.add(ip, nm);
      bodySchemaDecl = `const ${bodyAlias} = ${nm};`;
    }
    bodyRef = '__body';
    beforeCall.push(`const ${bodyRef}: z.output<typeof ${bodyAlias}> = body!;`);
  }

  // List handling
  const listKind = cfg.listKind;
  const filtersSchema = cfg.filtersSchema;
  const isAdminList = listKind === 'admin';
  // Support filter parsing for non-list endpoints (e.g., stats) that have filtersSchema
  const needsFilterParsing = !!filtersSchema && !isAdminList;

  if (isAdminList) {
    imports.add(opts.queryDslPath, 'parseListParams');
    if (filtersSchema) {
      imports.add(toModuleImport(filtersSchema.importPath, opts.usePackages), filtersSchema.name);
    }
  } else if (needsFilterParsing) {
    // For non-list endpoints with filters (e.g., stats), add filter schema import
    imports.add(toModuleImport(filtersSchema.importPath, opts.usePackages), filtersSchema.name);
  }

  // Query handling
  if (hasQuery) {
    const ip = toModuleImport(cfg.zodQuery!.importPath, opts.usePackages);
    const nm = cfg.zodQuery!.name;
    const isIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm);
    if (isIdent) {
      imports.add(ip, `${nm} as ${queryAlias}`);
    } else {
      imports.add(ip, nm);
      querySchemaDecl = `const ${queryAlias} = ${nm};`;
    }
  }

  // Check if callArgs reference 'query' but no zodQuery provided
  const needsQuery =
    Array.isArray(cfg.callArgs) &&
    cfg.callArgs.some((a) => a.from === 'query');

  if (isAdminList) {
    // DEV-008 FIX: Add size limit before base64 decoding to prevent DoS
    beforeCall.push(
      `const url = new URL(req.url);`,
      `const { limit, cursor, sort, filtersRaw } = parseListParams(url.searchParams, { defaultLimit: 50, maxLimit: 50 });`,
      `let filters: unknown;`,
      `if (filtersRaw) {`,
      `  // DEV-008 FIX: Limit filters string size to prevent DoS`,
      `  const MAX_FILTERS_SIZE = 8192;`,
      `  if (filtersRaw.length > MAX_FILTERS_SIZE) {`,
      `    throw new Error('filters parameter too large');`,
      `  }`,
      `  try {`,
      `    filters = JSON.parse(filtersRaw);`,
      `  } catch {`,
      `    try {`,
      `      const decoded = Buffer.from(filtersRaw, 'base64url').toString('utf8');`,
      `      filters = JSON.parse(decoded);`,
      `    } catch {`,
      `      throw new Error('filters must be valid JSON or base64url JSON');`,
      `    }`,
      `  }`,
      `}`,
      `const filtersTyped = ${filtersSchema ? `${filtersSchema.name}.parse(filters ?? {})` : 'filters'};`,
      `const queryInput = { limit, ...(cursor ? { cursor } : {}), ...(sort ? { sort } : {}), ...(filtersTyped ? { filters: filtersTyped } : {}) };`,
      `const __query = ${hasQuery ? `${queryAlias}.parse(queryInput)` : 'queryInput'};`
    );
  } else if (needsFilterParsing && hasQuery) {
    // Non-list endpoint with filters (e.g., stats) - parse filters from query param
    // DEV-008 FIX: Add size limit before base64 decoding to prevent DoS
    beforeCall.push(
      `const url = new URL(req.url);`,
      `const filtersRaw = url.searchParams.get('filters');`,
      `let filters: unknown;`,
      `if (filtersRaw) {`,
      `  // DEV-008 FIX: Limit filters string size to prevent DoS`,
      `  const MAX_FILTERS_SIZE = 8192;`,
      `  if (filtersRaw.length > MAX_FILTERS_SIZE) {`,
      `    throw new Error('filters parameter too large');`,
      `  }`,
      `  try {`,
      `    filters = JSON.parse(filtersRaw);`,
      `  } catch {`,
      `    try {`,
      `      const decoded = Buffer.from(filtersRaw, 'base64url').toString('utf8');`,
      `      filters = JSON.parse(decoded);`,
      `    } catch {`,
      `      throw new Error('filters must be valid JSON or base64url JSON');`,
      `    }`,
      `  }`,
      `}`,
      `const filtersTyped = ${filtersSchema!.name}.parse(filters ?? {});`,
      `const __query = { filters: filtersTyped };`
    );
  } else if (hasQuery) {
    imports.add(opts.queryPath, 'parseQuery as parseQueryZ');
    beforeCall.push(`const __query = parseQueryZ(req, ${queryAlias});`);
  } else if (needsQuery) {
    beforeCall.push(
      `const __query = Object.fromEntries(new URL(req.url).searchParams.entries());`
    );
  }

  // Build the service call
  let callBuilt = '';
  const isValidCallExpr = (v: unknown): v is string => {
    if (typeof v !== 'string') return false;
    const t = v.trim();
    if (!t.length) return false;
    if (t === 'undefined' || t === 'void 0' || t === 'null') return false;
    return true;
  };

  if (cfg.invoke && Array.isArray(cfg.callArgs) && cfg.callArgs.length) {
    const argDecls: string[] = [];
    const objProps: string[] = [];
    const posArgs: string[] = [];

    for (const arg of cfg.callArgs) {
      const varName = `__arg_${String(arg.name).replace(/[^a-zA-Z0-9_]/g, '_')}`;
      let src =
        arg.from === 'const'
          ? JSON.stringify(arg.value)
          : generateValueAccessor(arg, bodyRef, hasBody);

      src = applyFallback(src, arg.fallback, opts.envPath);
      src = applyTransform(src, arg.transform);

      argDecls.push(`const ${varName} = ${src};`);

      if (cfg.invoke === 'object') {
        const hasFallback = !!arg.fallback;
        if (arg.optional && !hasFallback) {
          objProps.push(`...(${varName} !== undefined ? { ${arg.name}: ${varName} } : {})`);
        } else {
          objProps.push(`${arg.name}: ${varName}`);
        }
      } else {
        posArgs.push(varName);
      }
    }

    beforeCall.push(...argDecls);

    // Capture audit "before" state BEFORE service call
    // SEC-006 FIX: Validate beforeExpr to prevent code injection
    if (cfg.audit && cfg.audit.beforeExpr) {
      const safeBeforeExpr = validateExpression(cfg.audit.beforeExpr, `${opKey}.audit.beforeExpr`);
      beforeCall.push(
        `const __auditBefore = await Promise.resolve(${safeBeforeExpr});`
      );
    }

    // Build the function call
    callBuilt =
      cfg.invoke === 'object'
        ? `${cfg.fn}({ ${objProps.join(', ')} } as unknown as Parameters<typeof ${cfg.fn}>[0])`
        : `${cfg.fn}(${posArgs.join(', ')})`;
    beforeCall.push(`const result = await (${callBuilt});`);
  } else if (
    cfg.factory &&
    typeof cfg.factory.importPath === 'string' &&
    typeof cfg.factory.name === 'string'
  ) {
    const facPath = toModuleImport(cfg.factory.importPath, opts.usePackages);
    const facName = cfg.factory.name;
    const alias = factoryClobbersService ? `${facName} as __factory` : facName;
    imports.add(facPath, alias);
    const passQuery = cfg.zodQuery ? ', query: __query' : '';
    const passBody = cfg.zodBody
      ? `, ...(body !== undefined ? { body } : {})`
      : '';
    const factoryIdent = factoryClobbersService ? '__factory' : facName;
    beforeCall.push(
      `const result = await (${factoryIdent}({ req, ctx, ...(params ? { params: params as Record<string, unknown> } : {})${passBody}${passQuery}, requestId } as Parameters<typeof ${factoryIdent}>[0]));`
    );
  } else if (isValidCallExpr(cfg.callExpr)) {
    // SEC-006 FIX: Validate callExpr to prevent code injection
    const safeCallExpr = validateExpression(cfg.callExpr, `${opKey}.callExpr`);
    beforeCall.push(`const result = await (${safeCallExpr});`);
  }

  // Audit handling
  if (cfg.audit) {
    // DEV-005 FIX: Use strict resourceIdExpr validation instead of general expression validation
    const ridExpr = cfg.audit.resourceIdExpr ?? 'null';
    validateResourceIdExpr(ridExpr, `${opKey}.audit.resourceIdExpr`);
    const trimmedRid = ridExpr.trim();

    let rid: string;
    if (ridExpr === 'null') {
      rid = 'null';
    } else if (
      trimmedRid.startsWith('`') &&
      (ridExpr.includes('bodySafe.') || ridExpr.includes('body.'))
    ) {
      rid = ridExpr
        .replace(/bodySafe\./g, `${bodyRef}.`)
        .replace(/\bbody\./g, `${bodyRef}.`);
    } else if (
      trimmedRid.startsWith("'") ||
      trimmedRid.startsWith('"') ||
      trimmedRid.startsWith('`')
    ) {
      rid = ridExpr;
    } else if (trimmedRid.startsWith('params.')) {
      const key = trimmedRid.replace('params.', '');
      rid = `__params.${key} ?? null`;
    } else if (
      trimmedRid.startsWith('body.') ||
      trimmedRid.startsWith('bodySafe.')
    ) {
      const key = trimmedRid.replace(/^body(Safe)?\./, '');
      rid = hasBody ? `String(${bodyRef}.${key} ?? '') || null` : 'null';
    } else if (ridExpr.includes('bodySafe.') || ridExpr.includes('body.')) {
      const replaced = ridExpr
        .replace(/bodySafe\./g, `${bodyRef}.`)
        .replace(/\bbody\./g, `${bodyRef}.`);
      rid = `(${replaced} != null ? String(${replaced}) : null)`;
    } else {
      rid = `(${ridExpr} != null ? String(${ridExpr}) : null)`;
    }

    const afterExpr = cfg.audit.afterExpr;
    const beforeRef = cfg.audit.beforeExpr ? '__auditBefore' : 'undefined';

    // SEC-006 FIX: Sanitize audit action and resourceType to prevent code injection
    const safeAction = sanitizeStringLiteral(opKey);
    const safeResourceType = sanitizeStringLiteral(cfg.audit.resourceType);
    const auditParts: string[] = [
      `scopeId: __params?.tenantId ?? ctx.tenantId ?? '-'`,
      `...(ctx.userId ? { actorId: ctx.userId } : {})`,
      `action: '${safeAction}'`,
      `resourceType: '${safeResourceType}'`,
      `resourceId: ${rid}`,
    ];

    if (beforeRef !== 'undefined') {
      auditParts.push(
        `...(${beforeRef} !== undefined ? { before: ${beforeRef} } : {})`
      );
    }

    if (afterExpr) {
      // SEC-006 FIX: Validate afterExpr to prevent code injection
      const safeAfterExpr = validateExpression(afterExpr, `${opKey}.audit.afterExpr`);
      const trimmedAfter = safeAfterExpr.trim();
      if (trimmedAfter.startsWith('{')) {
        auditParts.push(`after: ${safeAfterExpr}`);
      } else {
        auditParts.push(
          `...(${safeAfterExpr} !== undefined ? { after: ${safeAfterExpr} } : {})`
        );
      }
    }

    auditParts.push(`requestId`, `ip`, `ua`);

    beforeCall.push(
      `const ip = req.headers.get('x-forwarded-for') ?? null;`,
      `const ua = req.headers.get('user-agent') ?? null;`,
      `await appendAudit({ ${auditParts.join(', ')} });`
    );
  }

  // Ensure we have a call
  const hasCallExpr = isValidCallExpr(cfg.callExpr);
  const hasCallArgs =
    !!cfg.invoke && Array.isArray(cfg.callArgs) && cfg.callArgs.length > 0;
  const hasFactory =
    !!cfg.factory &&
    typeof cfg.factory.importPath === 'string' &&
    typeof cfg.factory.name === 'string';

  if (!hasCallExpr && !hasCallArgs && !hasFactory) {
    if (cfg.fn && !cfg.invoke) {
      beforeCall.push(`const result = await (${cfg.fn}());`);
    } else {
      throw new Error(
        `[gen-routes] ${opKey}${fileContext}: no call defined. Provide one of: service.callExpr, service.callArgs+invoke, or service.factory`
      );
    }
  }

  // Build final imports
  const importLines = imports.build();
  // Add newline before userCode and proper indentation
  const userCode = beforeCall.length > 0
    ? '\n    ' + beforeCall.join('\n    ')
    : '';

  // Generate handler
  if (cfg.raw) {
    const rawGuardBits = [...guardBits];
    if (hasBody) rawGuardBits.push(`zod: ${bodyAlias}`);
    if (hasParams) rawGuardBits.push(`zodParams: ${paramsAlias}`);
    // SEC-006 FIX: Validate rateKeyExpr to prevent code injection
    const safeRateKeyExpr = cfg.rateKeyExpr ? validateExpression(cfg.rateKeyExpr, `${opKey}.rateKeyExpr`) : null;
    const rawGuard = `({ ${rawGuardBits.join(', ')}${safeRateKeyExpr ? `, rateKey: ({ req, ctx, body, params }) => (${safeRateKeyExpr})` : ''} })`;

    const rawBody = `export const ${handlerName} = makeHandlerRaw${hasBody ? `<typeof ${bodyAlias}>` : '<unknown>'}(
  ${rawGuard},
  async ({ req, params, body, ctx, requestId }) => {${userCode}
    return result as Response;
  }
);`;

    const allImports = [...importLines];
    if (paramsSchemaDecl) allImports.push(paramsSchemaDecl);
    if (bodySchemaDecl) allImports.push(bodySchemaDecl);
    if (querySchemaDecl) allImports.push(querySchemaDecl);
    return [allImports.join('\n'), header, rawBody]
      .filter(Boolean)
      .join('\n\n');
  } else {
    const bodyCode = `export const ${handlerName} = makeHandler${hasBody ? `<typeof ${bodyAlias}>` : '<unknown>'}(
  ${guard},
  async ({ req, params, body, ctx, requestId }) => {${userCode}
    return result as unknown;
  }
);`;

    const allImports = [...importLines];
    if (paramsSchemaDecl) allImports.push(paramsSchemaDecl);
    if (bodySchemaDecl) allImports.push(bodySchemaDecl);
    if (querySchemaDecl) allImports.push(querySchemaDecl);
    return [allImports.join('\n'), header, bodyCode]
      .filter(Boolean)
      .join('\n\n');
  }
}
