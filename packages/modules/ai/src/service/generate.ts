import { connectDb, enforceTokensAndQuota, FEATURE, FLAG, getScopeId, getScopePlan, isEnabledForScope, assertActiveSubscriptionForCreditsViaPort } from "@unisane/kernel";
import type { PlanId } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

export type GenerateArgs = {
  idem?: string;
  prompt?: string;
  options?: Record<string, unknown>;
};

export async function generate(args: GenerateArgs = {}): Promise<{ output: { text: string } }> {
  const scopeId = getScopeId();
  const plan = await getScopePlan() as PlanId;

  // Feature gate: allow per-scope enablement
  const enabled = await isEnabledForScope({ key: FLAG.AI_GENERATE, scopeId, ctx: { plan } });
  if (!enabled) throw ERR.forbidden('Feature disabled');
  // Ensure DB is connected for usage/credits checks
  await connectDb();
  await assertActiveSubscriptionForCreditsViaPort();
  // Charge one unit for demo feature; guard composes usage increment + credits
  const key =
    args.idem && args.idem.trim().length
      ? args.idem
      : (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
  await enforceTokensAndQuota({
    tenantId: scopeId,
    featureKey: FEATURE.AI_GENERATE,
    tokens: 1,
  });
  // Demo output — real providers can be integrated here later
  return { output: { text: "hello" } };
}
