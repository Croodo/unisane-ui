import type { AuditRepoPort, AuditQueryFilters } from "../domain/ports";
import { selectRepo } from "@unisane/kernel";
import { AuditRepoMongo } from "./audit.repository.mongo";
import type { AuditLogView } from "../domain/types";

const repo = selectRepo<AuditRepoPort>({ mongo: AuditRepoMongo });

export async function listPage(args: {
  scopeId: string;
  limit: number;
  cursor?: string;
}) {
  return repo.listPage(args) as Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
}

/**
 * AUDI-001 FIX: Query with filters at database level
 */
export async function queryWithFilters(args: {
  scopeId: string;
  limit: number;
  cursor?: string;
  filters?: AuditQueryFilters;
}) {
  return repo.queryWithFilters(args) as Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    total?: number;
  }>;
}

export async function getScopeLastActivity(scopeIds: string[]) {
  return repo.findScopeLastActivity(scopeIds);
}

/** Admin list - all audit logs, optionally filtered by scopeId */
export async function listPageAdmin(args: {
  limit: number;
  cursor?: string;
  scopeId?: string;
}) {
  return repo.listPageAdmin(args) as Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
}

export async function append(args: {
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
}) {
  return repo.append(args);
}

/**
 * M-011 FIX: Best-effort audit logging that suppresses errors.
 * Use this for audit logging in contexts where failure should not
 * impact the main operation flow.
 *
 * @returns true if logging succeeded, false if it failed
 */
export async function appendBestEffort(args: {
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
}): Promise<boolean> {
  try {
    await repo.append(args);
    return true;
  } catch {
    // Error already logged in repo.append()
    return false;
  }
}
