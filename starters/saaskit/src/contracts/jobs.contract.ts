import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";

const c = initContract();

export const jobsContract = c.router({
  run: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/admin/jobs/:name/run",
      pathParams: z.object({ name: z.string().min(1) }),
      body: z.object({}).passthrough().optional(),
      responses: {
        200: z.object({ ok: z.literal(true), data: z.unknown().optional() }),
        202: z.object({ ok: z.literal(true) }).optional(),
      },
      summary: "Trigger a registered background job by name (super-admin only)",
    },
    defineOpMeta({
      op: "admin.jobs.run",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        // Provide base service info for generator even when using a raw factory
        importPath: "@/src/platform/jobs/service/triggerFactory",
        fn: "triggerJob",
        raw: true,
        factory: {
          importPath: "@/src/platform/jobs/service/triggerFactory",
          name: "triggerJob",
        },
      },
    })
  ),
});
