/**
 * Audit Port Adapter
 *
 * Implements AuditPort interface from kernel.
 * Wraps the existing audit module service functions.
 * Used by other modules for compliance logging via the kernel port.
 */

import type {
  AuditPort,
  AuditEntry,
  AuditEntryInput,
} from "@unisane/kernel";
import { appendAudit } from "./service/append";
import { listPage } from "./data/audit.repository";

/**
 * AuditPort implementation that wraps the audit module services.
 */
export const auditAdapter: AuditPort = {
  async log(entry: AuditEntryInput) {
    await appendAudit({
      scopeId: entry.scopeId,
      actorId: entry.actor.id,
      action: entry.action,
      resourceType: entry.target.type,
      resourceId: entry.target.id,
      before: entry.changes?.map((c) => ({ field: c.field, value: c.from })),
      after: entry.changes?.map((c) => ({ field: c.field, value: c.to })),
      ip: entry.actor.ip,
    });
  },

  async query(args) {
    const { rows } = await listPage({
      scopeId: args.scopeId,
      limit: args.limit ?? 50,
      cursor: args.offset ? String(args.offset) : undefined,
    });

    // Map from internal audit log format to AuditEntry format
    const entries: AuditEntry[] = rows
      .filter((r) => {
        // Apply filters if provided
        if (args.filters?.action && r.action !== args.filters.action) return false;
        if (args.filters?.actorId && r.actorId !== args.filters.actorId) return false;
        if (args.filters?.targetType && r.resourceType !== args.filters.targetType) return false;
        if (args.filters?.targetId && r.resourceId !== args.filters.targetId) return false;
        if (args.filters?.from && r.createdAt && r.createdAt < args.filters.from) return false;
        if (args.filters?.to && r.createdAt && r.createdAt > args.filters.to) return false;
        return true;
      })
      .map((r) => ({
        id: r.id,
        scopeId: args.scopeId,
        action: r.action,
        actor: {
          type: "user" as const,
          id: r.actorId ?? "system",
        },
        target: {
          type: r.resourceType,
          id: r.resourceId ?? "",
        },
        timestamp: r.createdAt ?? new Date(),
      }));

    return { entries, total: entries.length };
  },
};
