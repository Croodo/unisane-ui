import { getScopeId, tryGetScopeContext } from '@unisane/kernel';
import { append as appendRepo } from '../data/audit.repository';

export type AppendAuditArgs = {
  scopeId?: string; // Optional: uses context if not provided
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
  // Use provided scopeId or get from context
  const scopeId = args.scopeId ?? getScopeId();
  // Use provided actorId or try to get userId from context
  const scopeCtx = tryGetScopeContext();
  const actorId = args.actorId ?? scopeCtx?.userId;
  // Use provided requestId or get from context
  const requestId = args.requestId ?? scopeCtx?.requestId ?? null;

  await appendRepo({
    ...args,
    scopeId,
    ...(actorId ? { actorId } : {}),
    requestId,
  });
}
