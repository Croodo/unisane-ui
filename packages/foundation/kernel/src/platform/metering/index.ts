/**
 * Metering platform stub - provides quota enforcement and entitlements
 * Actual implementations are injected by the application
 */

export interface EnforceResult {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  reason?: string;
}

export interface Entitlements {
  plan?: string;
  credits?: Record<string, { grant: number; period: 'month' | 'year' }>;
  features?: Record<string, boolean>;
  capacities?: Record<string, number>;
  [key: string]: unknown;
}

export interface MeteringProvider {
  enforceTokensAndQuota(args: {
    tenantId: string;
    featureKey: string;
    tokens?: number;
  }): Promise<EnforceResult>;

  resolveEntitlements(tenantId: string): Promise<Entitlements>;
  invalidateEntitlements(tenantId: string): Promise<void>;
}

const noopMetering: MeteringProvider = {
  enforceTokensAndQuota: async () => ({ allowed: true }),
  resolveEntitlements: async () => ({}),
  invalidateEntitlements: async () => {},
};

let _metering: MeteringProvider = noopMetering;

export async function enforceTokensAndQuota(args: {
  tenantId: string;
  featureKey: string;
  tokens?: number;
}): Promise<EnforceResult> {
  return _metering.enforceTokensAndQuota(args);
}

export async function resolveEntitlements(tenantId: string): Promise<Entitlements> {
  return _metering.resolveEntitlements(tenantId);
}

export async function invalidateEntitlements(tenantId: string): Promise<void> {
  return _metering.invalidateEntitlements(tenantId);
}

export function setMeteringProvider(impl: MeteringProvider): void {
  _metering = impl;
}
