/**
 * Parameter handling utilities for route generation
 */
import type { RouteGenEntry, CallArg } from '../../extraction/types.js';

/**
 * DEV-010 FIX: Validate that a key is a safe JavaScript identifier.
 * This prevents code injection through malicious keys like "foo']; evil(); //".
 */
const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function assertSafeKey(key: string | undefined | null, context: string): void {
  if (key && !SAFE_IDENTIFIER_REGEX.test(key)) {
    throw new Error(`Unsafe key '${key}' in ${context}: must be a valid identifier`);
  }
}

/**
 * Extracts all param keys used in callArgs and audit expressions
 */
export function collectParamKeys(cfg: RouteGenEntry): string[] {
  const keys = new Set<string>();

  // From callArgs
  if (cfg.callArgs) {
    for (const arg of cfg.callArgs) {
      if (arg.from === 'params' && arg.key) {
        keys.add(arg.key);
      }
    }
  }

  // From audit resourceIdExpr (look for params.xyz patterns)
  if (cfg.audit?.resourceIdExpr) {
    const expr = cfg.audit.resourceIdExpr;
    const matches = expr.match(/params\.(\w+)/g);
    if (matches) {
      for (const m of matches) {
        const key = m.replace('params.', '');
        keys.add(key);
      }
    }
  }

  return Array.from(keys);
}

/**
 * Generates a strongly-typed params interface based on used keys
 * Always includes optional tenantId for audit tenantId fallback
 */
export function generateParamsType(
  keys: string[],
  includeOptionalTenantId: boolean
): string {
  if (keys.length === 0 && !includeOptionalTenantId) {
    return 'Record<string, string>';
  }

  const props = keys.map((k) => `${k}: string`);

  // Always add optional tenantId for audit tenantId fallback if audit is enabled
  if (includeOptionalTenantId && !keys.includes('tenantId')) {
    props.push('tenantId?: string');
  }

  if (props.length === 0) return 'Record<string, string>';
  return `{ ${props.join('; ')} }`;
}

/**
 * Generate value accessor expression based on source
 */
export function generateValueAccessor(
  arg: CallArg,
  bodyRef: string,
  hasBody: boolean
): string {
  const { from, key } = arg;

  // DEV-010 FIX: Validate key is a safe identifier before using in generated code
  assertSafeKey(key, `generateValueAccessor(${from})`);

  if (from === 'const') {
    return 'undefined'; // Will be overridden by JSON.stringify of value
  }

  if (from === 'body') {
    if (hasBody && key) {
      // Use safe property access for discriminated union compatibility
      return `(${bodyRef} as Record<string, unknown>)['${key}']`;
    }
    if (!key) return bodyRef;
    return `(${bodyRef} as Record<string, unknown>)?.['${key}']`;
  }

  if (from === 'params' && key) {
    return `__params.${key}`;
  }

  if (from === 'query') {
    if (key) return `__query?.${key}`;
    return '__query';
  }

  if (from === 'ctx' && key) {
    return `ctx?.${key}`;
  }

  const accessor = key ? `?.${key}` : '';
  return `${from}${accessor}`;
}

/**
 * Apply transform to a value expression
 */
export function applyTransform(expr: string, transform?: CallArg['transform']): string {
  switch (transform) {
    case 'date':
      return `new Date(${expr} as string)`;
    case 'isoDate':
      return `new Date(${expr} as string)`;
    case 'number':
      return `Number(${expr})`;
    case 'string':
      return `String(${expr})`;
    case 'boolean':
      return `Boolean(${expr})`;
    default:
      return expr;
  }
}

/**
 * Apply fallback to a value expression
 */
export function applyFallback(
  expr: string,
  fallback?: CallArg['fallback'],
  envImportPath: string = '@unisane/kernel'
): string {
  if (!fallback) return expr;

  if (fallback.kind === 'env' && fallback.key) {
    return `(${expr} ?? (await import('${envImportPath}')).getEnv().${fallback.key})`;
  }

  if (fallback.kind === 'value') {
    return `(${expr} ?? ${JSON.stringify(fallback.value)})`;
  }

  return expr;
}
