export type AuditLogView = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  ua?: string | null;
  before?: unknown;
  after?: unknown;
  createdAt?: Date;
};
