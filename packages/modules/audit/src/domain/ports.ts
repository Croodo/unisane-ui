import type { AuditLogView } from "./types";

/**
 * AUDI-001 FIX: Query filters for audit logs - pushed to repository level
 */
export interface AuditQueryFilters {
  action?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
}

export interface AuditRepoPort {
  listPage(args: {
    scopeId: string;
    limit: number;
    cursor?: string;
  }): Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;

  /**
   * AUDI-001 FIX: Query with filters at database level for efficiency
   */
  queryWithFilters(args: {
    scopeId: string;
    limit: number;
    cursor?: string;
    filters?: AuditQueryFilters;
  }): Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    total?: number;
  }>;

  findScopeLastActivity(scopeIds: string[]): Promise<Map<string, Date | null>>;
  /** Admin list - all audit logs, optionally filtered by scopeId */
  listPageAdmin(args: {
    limit: number;
    cursor?: string;
    scopeId?: string;
  }): Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
  append(args: {
    scopeId: string;
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    before?: unknown;
    after?: unknown;
    requestId?: string | null;
    ip?: string | null;
    ua?: string | null;
  }): Promise<void>;
}
