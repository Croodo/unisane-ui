import { getScopeId, getIdentityProvider, hasIdentityProvider } from "@unisane/kernel";
import type { ListPageArgs } from "@unisane/kernel";
import { listPage } from "../data/audit.repository";

// ════════════════════════════════════════════════════════════════════════════
// List Audit
// ════════════════════════════════════════════════════════════════════════════

export async function listAudit(args: ListPageArgs) {
  const scopeId = getScopeId();
  const { rows, nextCursor, prevCursor } = await listPage({
    scopeId,
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
  });

  // Collect unique actor IDs
  const actorIds = [
    ...new Set(rows.map((r) => r.actorId).filter((id): id is string => !!id)),
  ];

  // Batch fetch actor info via port (gracefully handles missing provider)
  const actorMap = hasIdentityProvider()
    ? await getIdentityProvider().findUsersByIds(actorIds)
    : new Map<string, { id: string; email?: string; displayName?: string | null }>();

  // Map rows with actor info
  const items = rows.map((r) => {
    const actor = r.actorId ? actorMap.get(r.actorId) : null;
    return {
      id: r.id,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId ?? null,
      actorId: r.actorId ?? null,
      actorName: actor?.displayName ?? null,
      actorEmail: actor?.email ?? null,
      requestId: r.requestId ?? null,
      createdAt: r.createdAt,
    };
  });

  return {
    items,
    ...(nextCursor ? { nextCursor } : {}),
    ...(prevCursor ? { prevCursor } : {}),
  } as const;
}
