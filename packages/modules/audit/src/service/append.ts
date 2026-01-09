import { getTenantId, ctx } from '@unisane/kernel';
import { append as appendRepo } from '../data/audit.repository';

export type AppendAuditArgs = {
  tenantId?: string; // Optional: uses context if not provided
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  requestId?: string | null;
  ip?: string | null;
  ua?: string | null;
};

export async function appendAudit(args: AppendAuditArgs) {
  // Use provided tenantId or get from context
  const tenantId = args.tenantId ?? getTenantId();
  // Use provided actorId or try to get userId from context
  const actorId = args.actorId ?? ctx.tryGet()?.userId;
  // Use provided requestId or get from context
  const requestId = args.requestId ?? ctx.tryGet()?.requestId ?? null;

  await appendRepo({
    ...args,
    tenantId,
    ...(actorId ? { actorId } : {}),
    requestId,
  });
}
