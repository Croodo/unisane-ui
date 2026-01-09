import { connectDb, enforceTokensAndQuota, FEATURE, FLAG, getTenantId, ctx } from "@unisane/kernel";
import type { PlanId } from "@unisane/kernel";
import { isEnabledForTenant } from "@unisane/flags";
import { ERR } from "@unisane/gateway";
import { assertActiveSubscriptionForCredits } from "@unisane/billing";

export type GenerateArgs = {
  idem?: string;
  prompt?: string;
  options?: Record<string, unknown>;
};

export async function generate(args: GenerateArgs = {}): Promise<{ output: { text: string } }> {
  const tenantId = getTenantId();
  const plan = await ctx.getPlan() as PlanId;

  // Feature gate: allow per-tenant enablement
  const enabled = await isEnabledForTenant({ key: FLAG.AI_GENERATE, tenantId, ctx: { plan } });
  if (!enabled) throw ERR.forbidden('Feature disabled');
  // Ensure DB is connected for usage/credits checks
  await connectDb();
  await assertActiveSubscriptionForCredits();
  // Charge one unit for demo feature; guard composes usage increment + credits
  const key =
    args.idem && args.idem.trim().length
      ? args.idem
      : (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
  await enforceTokensAndQuota({
    tenantId,
    featureKey: FEATURE.AI_GENERATE,
    tokens: 1,
  });
  // Demo output — real providers can be integrated here later
  return { output: { text: "hello" } };
}
