import crypto from "node:crypto";
import type { z } from "zod";
import type {
  FlagWrite,
  ZRuleCondition,
} from "../domain/schemas";
import type { EvalCtx } from "../domain/types";

type RuleCond = z.infer<typeof ZRuleCondition>;

export type { EvalCtx };

function hashToPercent(seed: string): number {
  const h = crypto.createHash("sha1").update(seed).digest();
  // Use first 4 bytes to compute a number 0..99
  const n = (h[0]! << 24) | (h[1]! << 16) | (h[2]! << 8) | h[3]!;
  return Math.abs(n) % 100;
}

function emailDomain(email?: string) {
  if (!email) return null;
  const idx = email.lastIndexOf("@");
  return idx >= 0 ? email.slice(idx + 1).toLowerCase() : null;
}

function condOk(cond: RuleCond, ctx: EvalCtx): boolean {
  if ("planIn" in cond) return !!ctx.plan && cond.planIn.includes(ctx.plan);
  if ("countryIn" in cond)
    return (
      !!ctx.country &&
      cond.countryIn.includes(String(ctx.country).toLowerCase())
    );
  if ("emailDomainIn" in cond) {
    const dom = emailDomain(ctx.email);
    return (
      !!dom && cond.emailDomainIn.map((d) => d.toLowerCase()).includes(dom)
    );
  }
  if ("tenantTagIn" in cond) {
    const tags = new Set((ctx.tenantTags ?? []).map((t) => t.toLowerCase()));
    return cond.tenantTagIn.some((t) => tags.has(t.toLowerCase()));
  }
  if ("timeWindow" in cond) {
    const now = ctx.now ?? new Date();
    const from = cond.timeWindow.from ? new Date(cond.timeWindow.from) : null;
    const to = cond.timeWindow.to ? new Date(cond.timeWindow.to) : null;
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  }
  if ("percentage" in cond) {
    const subject = ctx.userId ?? ctx.tenantId ?? "anon";
    const pct = hashToPercent(subject);
    return pct < cond.percentage;
  }
  return false;
}

export function applyThen(flag: FlagWrite, ctx: EvalCtx): boolean {
  // Default value
  let value = flag.enabledDefault;
  for (const rule of flag.rules) {
    const all = rule.if.every((c) => condOk(c as RuleCond, ctx));
    if (all) {
      value = rule.then.value;
      break;
    }
  }
  return value;
}

export const isEnabled = applyThen;
