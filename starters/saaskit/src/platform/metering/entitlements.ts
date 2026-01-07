import { resolveEntitlements } from '@/src/platform/metering/policy';
import { getWindow } from '@unisane/usage';

export type GetEntitlementsWithUsageArgs = {
  tenantId: string;
};

export async function getEntitlementsWithUsage(args: GetEntitlementsWithUsageArgs): Promise<{
  entitlements: {
    toggles: Record<string, boolean>
    capacities: Record<string, number>
    quotas: Record<string, { limit: number; window: 'day'|'month'|'year'; used?: number|null }>
    credits: Record<string, { grant: number; period: 'month'|'year' }>
  }
}> {
  const ent = await resolveEntitlements(args.tenantId);
  const quotas = Object.fromEntries(
    await Promise.all(
      Object.entries(ent.quotas).map(async ([key, q]) => {
        if (q.window === 'day') {
          const used = await getWindow({ tenantId: args.tenantId, feature: key, window: 'day' });
          return [key, { ...q, used }]
        }
        return [key, { ...q, used: null }]
      })
    )
  )
  return { entitlements: { ...ent, quotas } }
}
