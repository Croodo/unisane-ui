/**
 * AST helper functions for ts-morph parsing
 */
import { SyntaxKind } from 'ts-morph';
import type { ObjectLiteralExpression, Node } from 'ts-morph';

/**
 * Get a string property from an object literal
 */
export function getStringProp(
  obj: ObjectLiteralExpression,
  name: string
): string | undefined {
  const p = obj.getProperty(name);
  if (!p || !p.asKind(SyntaxKind.PropertyAssignment)) return undefined;
  const init = p.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
  if (!init) return undefined;
  const lit = init.getText().trim();
  if (lit.startsWith("'") || lit.startsWith('"')) return lit.slice(1, -1);
  return undefined;
}

/**
 * Get a boolean property from an object literal
 */
export function getBoolProp(
  obj: ObjectLiteralExpression,
  name: string
): boolean | undefined {
  const p = obj.getProperty(name);
  if (!p || !p.asKind(SyntaxKind.PropertyAssignment)) return undefined;
  const init = p.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
  if (!init) return undefined;
  const txt = init.getText().trim();
  if (txt === 'true') return true;
  if (txt === 'false') return false;
  return undefined;
}

/**
 * Get an object literal property from an object literal
 */
export function getObjProp(
  obj: ObjectLiteralExpression,
  name: string
): ObjectLiteralExpression | undefined {
  const p = obj.getProperty(name);
  if (!p || !p.asKind(SyntaxKind.PropertyAssignment)) return undefined;
  const init = p.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
  if (!init) return undefined;
  return init.asKind(SyntaxKind.ObjectLiteralExpression) ?? undefined;
}

/**
 * Get raw property initializer text (for identifiers like PERM.BILLING_WRITE)
 */
export function getRawProp(
  obj: ObjectLiteralExpression,
  name: string
): string | undefined {
  const p = obj.getProperty(name);
  if (!p || !p.asKind(SyntaxKind.PropertyAssignment)) return undefined;
  const init = p.asKind(SyntaxKind.PropertyAssignment)!.getInitializer();
  if (!init) return undefined;
  return init.getText().trim();
}

/**
 * Parse a literal value from AST node text
 */
export function parseLiteralValue(text: string): unknown {
  const t = text.trim();
  if (t.startsWith('"') || t.startsWith("'")) return t.slice(1, -1);
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  return undefined;
}

/**
 * Strip quotes from a string literal, handling concatenation patterns
 */
export function stripQuotes(s?: string): string | undefined {
  if (!s) return undefined;
  const t = s.trim();

  // Handle simple string literals: 'foo' or "foo"
  if (
    (t.startsWith("'") && t.endsWith("'")) ||
    (t.startsWith('"') && t.endsWith('"'))
  ) {
    return t.slice(1, -1);
  }

  // Handle string concatenation like '`' + "${...}" + '`' -> evaluate to template literal
  if (t.includes("' + \"") || t.includes("\" + '")) {
    const concatMatch = t.match(/^'`'\s*\+\s*"([^"]+)"\s*\+\s*'`'$/);
    if (concatMatch && concatMatch[1]) {
      return `\`${concatMatch[1]}\``;
    }
    try {
      const cleaned = t
        .replace(/^'`'\s*\+\s*"/g, '`')
        .replace(/"\s*\+\s*'`'$/g, '`');
      return cleaned;
    } catch {
      // Ignore errors
    }
  }

  return t;
}
