import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";

const c = initContract();

const ZAiOptions = z.record(z.string(), z.unknown());
export const ZAiBody = z
  .object({
    prompt: z.string().min(1).optional(),
    options: ZAiOptions.optional(),
  })
  .optional();
const ZAiOutput = z.object({ output: z.object({ text: z.string() }) });

export const aiContract = c.router({
  generate: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/ai/generate",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZAiBody,
      responses: { 200: z.object({ ok: z.literal(true), data: ZAiOutput }) },
      summary: "AI generate",
    },
    defineOpMeta({
      op: "ai.generate",
      idempotent: true,
      service: {
        importPath: "@unisane/ai",
        fn: "generate",
        zodBody: { importPath: "./ai.contract", name: "ZAiBody" },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "plan", from: "ctx", key: "plan", optional: true, fallback: { kind: 'value', value: 'pro' } },
          { name: "prompt", from: "body", key: "prompt", optional: true },
          { name: "options", from: "body", key: "options", optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
});
