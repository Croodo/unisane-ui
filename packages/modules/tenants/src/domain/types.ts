import type { TenantStatus } from '@unisane/kernel';

export type TenantRow = {
  id: string;
  slug?: string;
  name?: string;
  planId?: string | null;
  status?: TenantStatus;
  statusReason?: string;
  statusChangedAt?: Date;
  statusChangedBy?: string;
};

// Admin view used by services/route to aggregate tenant metrics
export type TenantAdminView = {
  id: string;
  slug: string;
  name: string;
  planId: string;
  status: TenantStatus;
  statusReason?: string;
  statusChangedAt?: Date;
  membersCount: number;
  adminsCount: number;
  apiKeysCount: number;
  flagOverridesCount: number;
  invoicesOpenCount: number;
  webhooksFailed24h: number;
  creditsAvailable: number;
  lastActivityAt: Date | null;
  subscription: {
    status: string | null;
    quantity: number | null;
    currentPeriodEnd: Date | null;
  } | null;
};

export type LatestSub = {
  planId: string | null;
  status: string | null;
  quantity: number | null;
  currentPeriodEnd: Date | null;
};
