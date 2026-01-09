/**
 * Represents a Zod schema reference
 */
export interface ZodRef {
  importPath: string;
  name: string;
}

/**
 * Represents a call argument for service invocation
 */
export interface CallArg {
  name: string;
  from: 'params' | 'query' | 'body' | 'ctx' | 'const';
  key?: string;
  optional?: boolean;
  transform?: 'date' | 'isoDate' | 'number' | 'string' | 'boolean';
  value?: unknown;
  fallback?: {
    kind: 'env' | 'value';
    key?: string;
    value?: unknown;
  };
}

/**
 * Audit configuration for route generation
 */
export interface AuditConfig {
  resourceType: string;
  resourceIdExpr?: string;
  beforeExpr?: string;
  afterExpr?: string;
}

/**
 * Factory configuration for raw handlers
 */
export interface FactoryRef {
  importPath: string;
  name: string;
}

/**
 * Route generation entry extracted from defineOpMeta
 */
export interface RouteGenEntry {
  /** Import path for the service function */
  importPath: string;
  /** Name of the service function */
  fn: string;
  /** Operation key (e.g., 'billing.topup') */
  op?: string;
  /** API path (e.g., '/api/rest/v1/tenants/:tenantId/billing/topup') */
  apiPath?: string;
  /** HTTP method */
  method?: string;
  /** Custom call expression (overrides default) */
  callExpr?: string;
  /** Zod schema for request body */
  zodBody?: ZodRef;
  /** Zod schema for query parameters */
  zodQuery?: ZodRef;
  /** Require tenant ID in path to match context */
  requireTenantMatch?: boolean;
  /** Require super admin role */
  requireSuperAdmin?: boolean;
  /** Require authenticated user */
  requireUser?: boolean;
  /** Allow unauthenticated access */
  allowUnauthed?: boolean;
  /** Permission key (e.g., 'PERM.BILLING_WRITE') */
  perm?: string;
  /** Mark as idempotent operation */
  idempotent?: boolean;
  /** Raw handler (use factory instead of service) */
  raw?: boolean;
  /** Rate limiting key expression */
  rateKeyExpr?: string;
  /** Additional imports for the route */
  extraImports?: Array<{ importPath: string; names: string[] }>;
  /** How to invoke the service: as object or positional args */
  invoke?: 'object' | 'positional';
  /** Arguments to pass to the service */
  callArgs?: ReadonlyArray<CallArg>;
  /** List type: admin, tenant, or public */
  listKind?: 'admin' | 'tenant' | 'public';
  /** Filters schema for list operations */
  filtersSchema?: ZodRef;
  /** Factory for raw handlers */
  factory?: FactoryRef;
  /** Audit configuration */
  audit?: AuditConfig;
}

/**
 * Operation info from router
 */
export interface Op {
  /** Contract group (e.g., 'billing') */
  group: string;
  /** Operation name (e.g., 'topup') */
  name: string;
  /** HTTP method */
  method: string;
  /** API path */
  path: string;
}

/**
 * Combined operation with route generation config
 */
export interface OpWithMeta extends Op {
  meta?: RouteGenEntry;
}
