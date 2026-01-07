import type { AuditLogView } from "./types";

export interface AuditRepoPort {
  listPage(args: {
    tenantId: string;
    limit: number;
    cursor?: string;
  }): Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
  getTenantLastActivity(tenantIds: string[]): Promise<Map<string, Date | null>>;
  /** Admin list - all audit logs, optionally filtered by tenantId */
  listPageAdmin(args: {
    limit: number;
    cursor?: string;
    tenantId?: string;
  }): Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
  append(args: {
    tenantId: string;
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
