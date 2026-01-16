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
import { queryWithFilters } from "./data/audit.repository";

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

  /**
   * AUDI-001 FIX: Use queryWithFilters to push filtering to database level
   * instead of filtering in-memory after fetching all records.
   */
  async query(args) {
    const { rows } = await queryWithFilters({
      scopeId: args.scopeId,
      limit: args.limit ?? 50,
      cursor: args.offset ? String(args.offset) : undefined,
      filters: args.filters ? {
        action: args.filters.action,
        actorId: args.filters.actorId,
        targetType: args.filters.targetType,
        targetId: args.filters.targetId,
        from: args.filters.from,
        to: args.filters.to,
      } : undefined,
    });

    // Map from internal audit log format to AuditEntry format
    const entries: AuditEntry[] = rows.map((r) => ({
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
