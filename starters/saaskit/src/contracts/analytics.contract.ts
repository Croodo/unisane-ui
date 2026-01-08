import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";
import { ZAnalyticsDashboard } from "@unisane/analytics/client";

const c = initContract();

export const analyticsContract = c.router({
  dashboard: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/analytics/dashboard",
      query: z.object({}).optional(), // Empty query to fix SDK codegen
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: ZAnalyticsDashboard,
        }),
      },
      summary: "Get admin analytics dashboard metrics",
    },
    defineOpMeta({
      op: "analytics.dashboard",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/analytics",
        fn: "getAdminAnalyticsDashboard",
        requireSuperAdmin: true,
      },
    })
  ),
});
