/**
 * Parsers for extracting structured data from AST nodes
 */
import { SyntaxKind } from 'ts-morph';
import type { ObjectLiteralExpression, Node } from 'ts-morph';
import type { ZodRef, CallArg, AuditConfig, FactoryRef, RouteGenEntry } from './types.js';
import { getStringProp, getBoolProp, getObjProp, getRawProp, parseLiteralValue, stripQuotes } from './ast-helpers.js';

/**
 * Parse a Zod schema reference from an object literal
 */
export function parseZodRef(obj?: ObjectLiteralExpression): ZodRef | undefined {
  if (!obj) return undefined;
  const importPath = getStringProp(obj, 'importPath');
  const name = getStringProp(obj, 'name');
  if (importPath && name) return { importPath, name };
  return undefined;
}

/**
 * Parse a factory reference from an object literal
 */
export function parseFactoryRef(obj?: ObjectLiteralExpression): FactoryRef | undefined {
  if (!obj) return undefined;
  const importPath = getStringProp(obj, 'importPath');
  const name = getStringProp(obj, 'name');
  if (importPath && name) return { importPath, name };
  return undefined;
}

/**
 * Parse audit configuration from an object literal
 */
export function parseAuditConfig(obj?: ObjectLiteralExpression): AuditConfig | undefined {
  if (!obj) return undefined;

  const resourceType = getStringProp(obj, 'resourceType') ?? '';
  if (!resourceType) return undefined;

  const resourceIdExpr = stripQuotes(
    obj
      .getProperty('resourceIdExpr')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer()
      ?.getText()
      ?.trim()
  );
  const beforeExpr = stripQuotes(
    obj
      .getProperty('beforeExpr')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer()
      ?.getText()
      ?.trim()
  );
  const afterExpr = stripQuotes(
    obj
      .getProperty('afterExpr')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer()
      ?.getText()
      ?.trim()
  );

  return {
    resourceType,
    ...(resourceIdExpr ? { resourceIdExpr } : {}),
    ...(beforeExpr ? { beforeExpr } : {}),
    ...(afterExpr ? { afterExpr } : {}),
  };
}

/**
 * Parse call arguments array from an AST node
 */
export function parseCallArgs(arrNode: Node | undefined): ReadonlyArray<CallArg> | undefined {
  if (!arrNode) return undefined;
  const arr = arrNode.asKind(SyntaxKind.ArrayLiteralExpression);
  if (!arr) return undefined;

  const items: CallArg[] = [];

  for (const el of arr.getElements()) {
    const obj = el.asKind(SyntaxKind.ObjectLiteralExpression);
    if (!obj) continue;

    const name = getStringProp(obj, 'name') ?? '';
    const from = getStringProp(obj, 'from') as CallArg['from'];
    if (!name || !from) continue;

    const key = getStringProp(obj, 'key');
    const transform = getStringProp(obj, 'transform') as CallArg['transform'];
    const optional = getBoolProp(obj, 'optional');

    // Parse value literal if present
    let value: unknown;
    const valProp = obj
      .getProperty('value')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer();
    if (valProp) {
      value = parseLiteralValue(valProp.getText());
    }

    // Parse fallback object if present
    const fbObj = getObjProp(obj, 'fallback');
    let fallback: CallArg['fallback'];
    if (fbObj) {
      const kind = getStringProp(fbObj, 'kind') as 'env' | 'value';
      if (kind) {
        const fkey = getStringProp(fbObj, 'key');
        let fval: unknown;
        const fvalInit = fbObj
          .getProperty('value')
          ?.asKind(SyntaxKind.PropertyAssignment)
          ?.getInitializer();
        if (fvalInit) {
          fval = parseLiteralValue(fvalInit.getText());
        }
        fallback = {
          kind,
          ...(fkey ? { key: fkey } : {}),
          ...(typeof fval !== 'undefined' ? { value: fval } : {}),
        };
      }
    }

    items.push({
      name,
      from,
      ...(key ? { key } : {}),
      ...(optional ? { optional } : {}),
      ...(transform ? { transform } : {}),
      ...(typeof value !== 'undefined' ? { value } : {}),
      ...(fallback ? { fallback } : {}),
    });
  }

  return items.length > 0 ? items : undefined;
}

/**
 * Parse extra imports array from an AST node
 */
export function parseExtraImports(
  arrNode: Node | undefined
): Array<{ importPath: string; names: string[] }> | undefined {
  if (!arrNode) return undefined;
  const arr = arrNode.asKind(SyntaxKind.ArrayLiteralExpression);
  if (!arr) return undefined;

  const items: Array<{ importPath: string; names: string[] }> = [];

  for (const el of arr.getElements()) {
    const obj = el.asKind(SyntaxKind.ObjectLiteralExpression);
    if (!obj) continue;

    const importPath = getStringProp(obj, 'importPath');
    if (!importPath) continue;

    const namesArr = obj
      .getProperty('names')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer()
      ?.asKind(SyntaxKind.ArrayLiteralExpression);

    const names: string[] = [];
    if (namesArr) {
      for (const nameEl of namesArr.getElements()) {
        const txt = nameEl.getText().trim();
        if (txt.startsWith('"') || txt.startsWith("'")) {
          names.push(txt.slice(1, -1));
        }
      }
    }

    if (names.length > 0) {
      items.push({ importPath, names });
    }
  }

  return items.length > 0 ? items : undefined;
}

/**
 * Parse a service entry from a defineOpMeta call argument
 */
export function parseServiceEntry(
  obj: ObjectLiteralExpression,
  opKey: string
): RouteGenEntry | undefined {
  const service = getObjProp(obj, 'service');
  if (!service) return undefined;

  const importPath = getStringProp(service, 'importPath') ?? '';
  const fn = getStringProp(service, 'fn') ?? '';
  if (!importPath || !fn) return undefined;

  const entry: RouteGenEntry = {
    importPath,
    fn,
    op: opKey,
  };

  // Zod schemas
  const zodBody = parseZodRef(getObjProp(service, 'zodBody'));
  const zodQuery = parseZodRef(getObjProp(service, 'zodQuery'));
  if (zodBody) entry.zodBody = zodBody;
  if (zodQuery) entry.zodQuery = zodQuery;

  // Invocation style
  const invoke = getStringProp(service, 'invoke') as 'object' | 'positional' | undefined;
  if (invoke) entry.invoke = invoke;

  // Call arguments
  const callArgsProp = service
    .getProperty('callArgs')
    ?.asKind(SyntaxKind.PropertyAssignment)
    ?.getInitializer();
  const parsedArgs = parseCallArgs(callArgsProp);
  if (parsedArgs && parsedArgs.length) entry.callArgs = parsedArgs;

  // List configuration
  const listKind = getStringProp(service, 'listKind') as RouteGenEntry['listKind'];
  if (listKind) entry.listKind = listKind;

  // Filters schema
  const filtersSchema = getObjProp(service, 'filtersSchema');
  if (filtersSchema) {
    const ref = parseZodRef(filtersSchema);
    if (ref) entry.filtersSchema = ref;
  }

  // Service-level flags
  if (getBoolProp(service, 'requireTenantMatch')) entry.requireTenantMatch = true;
  if (getBoolProp(service, 'requireSuperAdmin')) entry.requireSuperAdmin = true;
  if (getBoolProp(service, 'raw')) entry.raw = true;

  // Factory for raw handlers
  const factory = getObjProp(service, 'factory');
  if (factory) {
    const ref = parseFactoryRef(factory);
    if (ref) entry.factory = ref;
  }

  // Audit configuration
  const audit = getObjProp(service, 'audit');
  if (audit) {
    const auditConfig = parseAuditConfig(audit);
    if (auditConfig) entry.audit = auditConfig;
  }

  // Extra imports
  const extraImportsProp = service
    .getProperty('extraImports')
    ?.asKind(SyntaxKind.PropertyAssignment)
    ?.getInitializer();
  const extraImports = parseExtraImports(extraImportsProp);
  if (extraImports) entry.extraImports = extraImports;

  // Call expression override
  const callExpr = getStringProp(service, 'callExpr');
  if (callExpr) entry.callExpr = callExpr;

  // Rate key expression
  const rateKeyExpr = getStringProp(service, 'rateKeyExpr');
  if (rateKeyExpr) entry.rateKeyExpr = rateKeyExpr;

  // Top-level flags on defineOpMeta object
  if (getBoolProp(obj, 'allowUnauthed')) entry.allowUnauthed = true;
  if (getBoolProp(obj, 'requireUser')) entry.requireUser = true;
  if (getBoolProp(obj, 'requireSuperAdmin')) entry.requireSuperAdmin = true;
  if (getBoolProp(obj, 'idempotent')) entry.idempotent = true;

  // Permission (raw identifier like PERM.BILLING_WRITE)
  const perm = getRawProp(obj, 'perm');
  if (perm) entry.perm = perm;

  return entry;
}
