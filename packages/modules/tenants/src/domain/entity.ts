import type { EntitySchema } from "@unisane/kernel";

/**
 * Entity schema definition for the Tenants collection.
 * This serves as the single source of truth for:
 * - Stats facet generation (enum fields become facets)
 * - Type generation (future)
 * - Validation (future)
 *
 * NOTE: This is different from Zod schemas in schemas.ts which define API DTOs.
 * This defines the database entity shape for stats/facets.
 */
export const TenantSchema: EntitySchema = {
  collection: "tenants",
  schema: {
    _id: "string",
    name: "string",
    slug: "string",

    // Enum field - automatically becomes a facet
    planId: { type: "enum", ref: "PlanId" },

    // Tenant status - automatically becomes a facet
    status: { type: "enum", ref: "TenantStatus", default: "active" },
    statusReason: { type: "string", nullable: true },
    statusChangedAt: { type: "date", nullable: true },
    statusChangedBy: { type: "string", nullable: true },

    // Nested object with enum field
    subscription: {
      type: "object",
      schema: {
        // This will become 'subscription_status' facet
        status: { type: "enum", ref: "SubscriptionStatus" },
        quantity: "number",
        currentPeriodEnd: "date",
      },
    },

    membersCount: "number",
    adminsCount: "number",
    apiKeysCount: "number",
    flagOverridesCount: "number",
    invoicesOpenCount: "number",
    webhooksFailed24h: "number",
    creditsAvailable: "number",
    lastActivityAt: { type: "date", nullable: true },
    createdAt: "date",
    updatedAt: "date",
    deletedAt: { type: "date", nullable: true },
  },
};
