import type { AuditLogView } from "./types";

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
