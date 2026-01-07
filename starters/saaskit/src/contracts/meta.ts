import type { ZodTypeAny } from "zod";
import type { Permission } from "@unisane/kernel";

export type OpMeta = {
  op: string;
  perm?: Permission;
  requireTenantMatch?: boolean;
  requireSuperAdmin?: boolean;
  requireUser?: boolean;
  allowUnauthed?: boolean;
  idempotent?: boolean;
  queryZod?: ZodTypeAny;
  /** Next.js runtime for the route. Default: 'nodejs'. Set in meta.service.runtime. */
  runtime?: "nodejs" | "edge";
  /** Response schema reference for type-safe codegen (optional). */
  responseSchema?: { importPath: string; name: string };
  invalidate?: Array<
    | { kind: "prefix"; key: [string, ...unknown[]] }
    | { kind: "key"; key: [string, ...unknown[]] }
    | {
        kind: "op";
        target: string;
        from?: "params" | "query" | "body";
        pick?: string[];
      }
  >;
  service?: {
    importPath: string;
    fn: string;
    callExpr?: string;
    zodBody?: { importPath: string; name: string };
    zodQuery?: { importPath: string; name: string };
    requireTenantMatch?: boolean;
    requireSuperAdmin?: boolean;
    raw?: boolean;
    rateKeyExpr?: string;
    extraImports?: Array<{ importPath: string; names: string[] }>;
    // List hints (used by codegen for common parsing patterns)
    listKind?: "admin" | "tenant" | "public";
    filtersSchema?: { importPath: string; name: string };
    // Structured call arguments (preferred over callExpr when present)
    invoke?: "object" | "positional";
    callArgs?: ReadonlyArray<{
      // For invoke:'object', this is the property name. For invoke:'positional', this is the argument index as a string ('0','1',...)
      name: string;
      from: "params" | "query" | "body" | "ctx" | "const";
      key?: string; // key in source object
      optional?: boolean; // include only if defined
      transform?: "date" | "isoDate" | "number" | "string" | "boolean";
      // When from === 'const', provide value
      value?: unknown;
      // Fallback when source missing/undefined
      fallback?: { kind: "env" | "value"; key?: string; value?: unknown };
    }>;
    // Typed factory handler (advanced). When provided, generator imports and calls it.
    factory?: { importPath: string; name: string };
    audit?: {
      resourceType: string;
      resourceIdExpr?: string;
      afterExpr?: string;
    };
  };
};

export function defineOpMeta<T extends OpMeta>(meta: T): T {
  return meta;
}

// Attach metadata to a contract operation (without using `any`).
export function attachOpMeta(
  router: unknown,
  opName: string,
  meta: OpMeta
): void {
  if (!router || typeof router !== "object") return;
  const rec = router as Record<string, unknown>;
  const op = rec[opName] as { meta?: OpMeta } | undefined;
  if (!op || typeof op !== "object") return;
  (op as { meta?: OpMeta }).meta = meta;
}

// Inline helper: attach OpMeta without altering the route type
export function withMeta<T extends object>(def: T, meta: OpMeta): T {
  try {
    Object.defineProperty(def as object, "meta", {
      value: meta,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  } catch {
    // Fallback: assign directly if defineProperty fails (should be rare)
    (def as Record<string, unknown>)["meta"] = meta;
  }
  return def as T;
}
