import { connectDb, enforceTokensAndQuota, FEATURE, FLAG, clampInt, getTenantId, ctx } from '@unisane/kernel'
import type { PlanId } from '@unisane/kernel'
import { isEnabledForTenant } from '@unisane/flags'
import { ERR } from '@unisane/gateway'
import { assertActiveSubscriptionForCredits } from '@unisane/billing'

export type RenderPdfArgs = {
  pages?: number
  idem?: string
}

export async function renderPdf(args: RenderPdfArgs = {}): Promise<{ url: string; pages: number; metering: unknown }> {
  const tenantId = getTenantId()
  const plan = await ctx.getPlan() as PlanId

  // Feature gate
  const ok = await isEnabledForTenant({ key: FLAG.PDF_RENDER, tenantId, ctx: { plan } })
  if (!ok) throw ERR.forbidden('Feature disabled')
  await connectDb()
  await assertActiveSubscriptionForCredits()
  const pages = clampInt(Number(args.pages ?? 1), 1, 200)
  const metering = await enforceTokensAndQuota({
    tenantId,
    featureKey: FEATURE.PDF_RENDER,
    tokens: pages,
  })
  const url = `https://example-cdn.invalid/renders/${tenantId}/${Date.now()}.pdf`
  return { url, pages, metering }
}
