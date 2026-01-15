/**
 * Audit Port
 *
 * Port interface for audit logging.
 * Used by all modules that need to log audit events for compliance.
 * Audit module implements this port, consumers depend on the interface.
 */

/**
 * Actor who performed the action
 */
export interface AuditActor {
  type: "user" | "system" | "api" | "webhook";
  id: string;
  email?: string;
  ip?: string;
}

/**
 * Target of the action
 */
export interface AuditTarget {
  type: string; // e.g., 'user', 'tenant', 'subscription'
  id: string;
  name?: string;
}

/**
 * Field change record
 */
export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

/**
 * Audit entry
 */
export interface AuditEntry {
  id: string;
  scopeId: string;
  action: string; // e.g., 'user.created', 'subscription.canceled'
  actor: AuditActor;
  target: AuditTarget;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Input for creating an audit entry (without generated fields)
 */
export type AuditEntryInput = Omit<AuditEntry, "id" | "timestamp">;

/**
 * Port interface for audit operations.
 * Used by all modules for compliance logging.
 */
export interface AuditPort {
  /**
   * Log an audit entry.
   */
  log(entry: AuditEntryInput): Promise<void>;

  /**
   * Query audit log for a scope.
   */
  query(args: {
    scopeId: string;
    filters?: {
      action?: string;
      actorId?: string;
      actorType?: AuditActor["type"];
      targetType?: string;
      targetId?: string;
      from?: Date;
      to?: Date;
    };
    limit?: number;
    offset?: number;
  }): Promise<{ entries: AuditEntry[]; total: number }>;

  /**
   * Get a single audit entry by ID.
   */
  getById?(id: string): Promise<AuditEntry | null>;
}

// Provider storage
let _auditProvider: AuditPort | null = null;

/**
 * Set the audit provider implementation.
 * Call this at app bootstrap.
 */
export function setAuditProvider(provider: AuditPort): void {
  _auditProvider = provider;
}

/**
 * Get the audit provider.
 * Throws if not configured.
 */
export function getAuditProvider(): AuditPort {
  if (!_auditProvider) {
    throw new Error(
      "AuditPort not configured. Call setAuditProvider() at bootstrap."
    );
  }
  return _auditProvider;
}

/**
 * Check if audit provider is configured.
 */
export function hasAuditProvider(): boolean {
  return _auditProvider !== null;
}

/**
 * Convenience function: Log an audit entry via port.
 */
export async function logAuditViaPort(entry: AuditEntryInput): Promise<void> {
  return getAuditProvider().log(entry);
}
