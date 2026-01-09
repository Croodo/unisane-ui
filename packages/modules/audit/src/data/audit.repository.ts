import type { AuditRepoPort } from "../domain/ports";
import { selectRepo } from "@unisane/kernel";
import { AuditRepoMongo } from "./audit.repository.mongo";
import type { AuditLogView } from "../domain/types";

const repo = selectRepo<AuditRepoPort>({ mongo: AuditRepoMongo });

export async function listPage(args: {
  tenantId: string;
  limit: number;
  cursor?: string;
}) {
  return repo.listPage(args) as Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
}

export async function getTenantLastActivity(tenantIds: string[]) {
  return repo.getTenantLastActivity(tenantIds);
}

/** Admin list - all audit logs, optionally filtered by tenantId */
export async function listPageAdmin(args: {
  limit: number;
  cursor?: string;
  tenantId?: string;
}) {
  return repo.listPageAdmin(args) as Promise<{
    rows: AuditLogView[];
    nextCursor?: string;
    prevCursor?: string;
  }>;
}

export async function append(args: {
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
}) {
  return repo.append(args);
}
