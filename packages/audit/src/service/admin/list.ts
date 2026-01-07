import { listPageAdmin } from "../../data/audit.repository";
import { usersRepository } from "@unisane/identity";

export async function listAuditAdmin(args: {
  cursor?: string;
  limit: number;
  tenantId?: string;
}) {
  const { rows, nextCursor, prevCursor } = await listPageAdmin({
    limit: args.limit,
    ...(args.cursor ? { cursor: args.cursor } : {}),
    ...(args.tenantId ? { tenantId: args.tenantId } : {}),
  });

  // Collect unique actor IDs
  const actorIds = [
    ...new Set(rows.map((r) => r.actorId).filter((id): id is string => !!id)),
  ];

  // Batch fetch actor info
  const actorMap = await usersRepository.findByIds(actorIds);

  // Map rows with actor info
  const items = rows.map((r) => {
    const actor = r.actorId ? actorMap.get(r.actorId) : null;
    return {
      id: r.id,
      tenantId: (r as { tenantId?: string }).tenantId ?? null,
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
