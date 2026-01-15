import { z, type ZodTypeAny } from "zod";
import type { Permission } from "@unisane/kernel/client";

/**
 * Zod schema for OpMeta validation.
 * Used by codegen and optionally at dev-time for stricter validation.
 */
const ZZodRef = z.object({
  importPath: z.string().min(1),
  name: z.string().min(1),
});

const ZCallArg = z.object({
  name: z.string().min(1),
  from: z.enum(["params", "query", "body", "ctx", "const"]),
  key: z.string().optional(),
  optional: z.boolean().optional(),
  transform: z.enum(["date", "isoDate", "number", "string", "boolean"]).optional(),
  value: z.unknown().optional(),
  fallback: z.object({
    kind: z.enum(["env", "value"]),
    key: z.string().optional(),
    value: z.unknown().optional(),
  }).optional(),
});

const ZServiceMeta = z.object({
  importPath: z.string().min(1),
  fn: z.string().min(1),
  callExpr: z.string().optional(),
  zodBody: ZZodRef.optional(),
  zodQuery: ZZodRef.optional(),
  requireTenantMatch: z.boolean().optional(),
  requireSuperAdmin: z.boolean().optional(),
  raw: z.boolean().optional(),
  rateKeyExpr: z.string().optional(),
  extraImports: z.array(z.object({ importPath: z.string(), names: z.array(z.string()) })).optional(),
  listKind: z.enum(["admin", "tenant", "public"]).optional(),
  filtersSchema: ZZodRef.optional(),
  invoke: z.enum(["object", "positional"]).optional(),
  callArgs: z.array(ZCallArg).optional(),
  factory: ZZodRef.optional(),
  audit: z.object({
    resourceType: z.string(),
    resourceIdExpr: z.string().optional(),
    afterExpr: z.string().optional(),
  }).optional(),
});

export const ZOpMeta = z.object({
  op: z.string().min(1),
  perm: z.string().optional(),
  requireTenantMatch: z.boolean().optional(),
  requireSuperAdmin: z.boolean().optional(),
  requireUser: z.boolean().optional(),
  allowUnauthed: z.boolean().optional(),
  idempotent: z.boolean().optional(),
  queryZod: z.unknown().optional(), // ZodTypeAny at runtime
  runtime: z.enum(["nodejs", "edge"]).optional(),
  responseSchema: ZZodRef.optional(),
  invalidate: z.array(z.union([
    z.object({ kind: z.literal("prefix"), key: z.tuple([z.string()]).rest(z.unknown()) }),
    z.object({ kind: z.literal("key"), key: z.tuple([z.string()]).rest(z.unknown()) }),
    z.object({
      kind: z.literal("op"),
      target: z.string(),
      from: z.enum(["params", "query", "body"]).optional(),
      pick: z.array(z.string()).optional(),
    }),
  ])).optional(),
  service: ZServiceMeta.optional(),
}).strict(); // strict() rejects unknown keys

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

/**
 * Define operation metadata with compile-time type checking.
 * In development, also validates against ZOpMeta schema to catch typos.
 */
export function defineOpMeta<T extends OpMeta>(meta: T): T {
  // Validate in development to catch typos and invalid fields early
  if (process.env.NODE_ENV !== 'production') {
    const result = ZOpMeta.safeParse(meta);
    if (!result.success) {
      console.warn(
        `[defineOpMeta] Invalid metadata for op "${meta.op}":`,
        result.error.flatten().fieldErrors
      );
    }
  }
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

/**
 * Attach OpMeta to a route definition using ts-rest's standard 'metadata' property.
 *
 * ts-rest natively supports a `metadata?: unknown` field on all route definitions.
 * By using 'metadata' directly (not 'meta'), we ensure the value is preserved
 * through ts-rest's router processing and accessible at runtime.
 *
 * The metadata is used during code generation to extract service configuration,
 * authorization requirements, and other route-specific information.
 */
export function withMeta<T extends object>(def: T, meta: OpMeta): T {
  // Use ts-rest's native metadata field directly
  (def as Record<string, unknown>)["metadata"] = meta;
  return def as T;
}
