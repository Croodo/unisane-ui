import { col, COLLECTIONS } from "@unisane/kernel";
import type { Collection, Document, FindCursor } from "mongodb";
import type { TenantIntegrationsRepo } from "../domain/ports/tenantIntegrations";
import type { TenantIntegrationRef } from "../domain/types";
import type { BillingProvider } from "@unisane/kernel";
import { softDeleteFilter } from "@unisane/kernel";

type TenantIntegrationDoc = {
  _id: unknown;
  tenantId: string;
  provider: BillingProvider;
  customerId?: string | null;
  meta?: Record<string, unknown> | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const tiCol = (): Collection<TenantIntegrationDoc> =>
  col<TenantIntegrationDoc>(COLLECTIONS.TENANT_INTEGRATIONS);

export const mongoTenantIntegrationsRepo: TenantIntegrationsRepo = {
  listByProviderCursor(
    provider: BillingProvider
  ): AsyncIterable<TenantIntegrationRef> {
    const cursor: FindCursor<
      Pick<TenantIntegrationDoc, "tenantId" | "customerId">
    > = tiCol().find(
      { provider, ...softDeleteFilter() },
      { projection: { tenantId: 1, customerId: 1 } }
    );
    const iterable: AsyncIterable<TenantIntegrationRef> = {
      async *[Symbol.asyncIterator]() {
        for await (const value of cursor) {
          const tenantId = String(value?.tenantId ?? "");
          const customerId = String(value?.customerId ?? "");
          if (!tenantId || !customerId) continue;
          yield { tenantId, customerId } as TenantIntegrationRef;
        }
      },
    };
    return iterable;
  },
  async findCustomerId(
    tenantId: string,
    provider: BillingProvider
  ): Promise<string | null> {
    const row = await tiCol().findOne(
      { tenantId, provider, ...softDeleteFilter() },
      { projection: { customerId: 1 } }
    );
    return row?.customerId ?? null;
  },
  async upsertCustomerMapping(
    tenantId: string,
    provider: BillingProvider,
    customerId: string
  ): Promise<void> {
    await tiCol().updateOne(
      { tenantId, provider },
      {
        $set: { customerId, deletedAt: null, updatedAt: new Date() },
        $setOnInsert: { meta: null, createdAt: new Date() },
      },
      { upsert: true }
    );
  },
  async findTenantIdByCustomer(
    provider: BillingProvider,
    customerId: string
  ): Promise<string | null> {
    const ti = await tiCol().findOne(
      { provider, customerId, ...softDeleteFilter() },
      { projection: { tenantId: 1 } }
    );
    return ti?.tenantId ?? null;
  },
  async softDeleteCustomerMapping(
    provider: BillingProvider,
    customerId: string
  ): Promise<void> {
    await tiCol().updateMany(
      { provider, customerId, ...softDeleteFilter() },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );
  },
};
