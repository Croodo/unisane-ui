import {
  getScopeId,
  connectDb,
  getTenantsProvider,
  hasTenantsProvider,
  PLAN_DEFS,
  type PlanId,
} from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import type { StorageUsage } from "../domain/ports";

/**
 * Extended storage usage with quota information
 */
export interface StorageUsageWithQuota extends StorageUsage {
  /** Maximum storage bytes allowed for this tenant's plan */
  quotaBytes: number;
  /** Percentage of quota used (0-100) */
  percentUsed: number;
}

/**
 * Helper to format bytes in human-readable form
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get storage quota limit for a given plan
 */
function getStorageQuotaForPlan(planId: PlanId): number {
  const planDef = PLAN_DEFS[planId];
  const storageBytes = planDef?.entitlements?.capacities?.storageBytes;
  const defaultBytes = PLAN_DEFS.free.entitlements?.capacities?.storageBytes ?? 0;
  return storageBytes ?? defaultBytes;
}

/**
 * Get current storage usage for the scope.
 * Returns total bytes used and file count.
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  await connectDb();
  return StorageRepo.getStorageUsage();
}

/**
 * Get storage usage along with quota information for the current scope.
 * Useful for displaying usage dashboards to users.
 */
export async function getStorageUsageWithQuota(): Promise<StorageUsageWithQuota> {
  const scopeId = getScopeId();
  await connectDb();

  const usage = await StorageRepo.getStorageUsage();

  const defaultQuota = PLAN_DEFS.free.entitlements?.capacities?.storageBytes ?? 0;
  let quotaBytes: number = defaultQuota;

  if (hasTenantsProvider()) {
    const tenantsProvider = getTenantsProvider();
    const tenant = await tenantsProvider.findById(scopeId);
    const planId = (tenant?.planId as PlanId) ?? "free";
    quotaBytes = getStorageQuotaForPlan(planId);
  }

  const percentUsed = quotaBytes > 0
    ? Math.min(100, Math.round((usage.totalBytes / quotaBytes) * 100))
    : 0;

  return {
    ...usage,
    quotaBytes,
    percentUsed,
  };
}
