import { connectDb, enforceTokensAndQuota, FEATURE, FLAG, clampInt, getScopeId, getScopePlan, isEnabledForScope, assertActiveSubscriptionForCreditsViaPort } from '@unisane/kernel'
import type { PlanId } from '@unisane/kernel'
import { ERR } from '@unisane/gateway'

export type RenderPdfArgs = {
  pages?: number
  idem?: string
}

export async function renderPdf(args: RenderPdfArgs = {}): Promise<{ url: string; pages: number; metering: unknown }> {
  const scopeId = getScopeId()
  const plan = await getScopePlan() as PlanId

  // Feature gate
  const ok = await isEnabledForScope({ key: FLAG.PDF_RENDER, scopeId, ctx: { plan } })
  if (!ok) throw ERR.forbidden('Feature disabled')
  await connectDb()
  await assertActiveSubscriptionForCreditsViaPort()
  const pages = clampInt(Number(args.pages ?? 1), 1, 200)
  const metering = await enforceTokensAndQuota({
    tenantId: scopeId,
    featureKey: FEATURE.PDF_RENDER,
    tokens: pages,
  })
  const url = `https://example-cdn.invalid/renders/${scopeId}/${Date.now()}.pdf`
  return { url, pages, metering }
}
