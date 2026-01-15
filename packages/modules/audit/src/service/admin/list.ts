import { getIdentityProvider, hasIdentityProvider } from "@unisane/kernel";
import { listPageAdmin } from "../../data/audit.repository";

export async function listAuditAdmin(args: {
  cursor?: string;
  limit: number;
  scopeId?: string;
}) {
  const { rows, nextCursor, prevCursor } = await listPageAdmin({
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
    ...(args.scopeId ? { scopeId: args.scopeId } : {}),
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
      scopeId: (r as { scopeId?: string }).scopeId ?? null,
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
