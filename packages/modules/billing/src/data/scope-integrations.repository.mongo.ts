import {
  col,
  COLLECTIONS,
  softDeleteFilter,
  type Collection,
  type Document,
  type FindCursor,
  type BillingProvider,
} from "@unisane/kernel";
import type { ScopeIntegrationsRepo } from "../domain/ports/scope-integrations";
import type { ScopeIntegrationRef } from "../domain/types";

type TenantIntegrationDoc = {
  _id: unknown;
  scopeId: string;
  provider: BillingProvider;
  customerId?: string | null;
  meta?: Record<string, unknown> | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

const tiCol = (): Collection<TenantIntegrationDoc> =>
  col<TenantIntegrationDoc>(COLLECTIONS.TENANT_INTEGRATIONS);

export const mongoScopeIntegrationsRepo: ScopeIntegrationsRepo = {
  listByProviderCursor(
    provider: BillingProvider
  ): AsyncIterable<ScopeIntegrationRef> {
    const cursor: FindCursor<
      Pick<TenantIntegrationDoc, "scopeId" | "customerId">
    > = tiCol().find(
      { provider, ...softDeleteFilter() },
      { projection: { scopeId: 1, customerId: 1 } }
    );
    const iterable: AsyncIterable<ScopeIntegrationRef> = {
      async *[Symbol.asyncIterator]() {
        for await (const value of cursor) {
          const scopeId = String(value?.scopeId ?? "");
          const customerId = String(value?.customerId ?? "");
          if (!scopeId || !customerId) continue;
          yield { scopeId, customerId } as ScopeIntegrationRef;
        }
      },
    };
    return iterable;
  },
  async findCustomerId(
    scopeId: string,
    provider: BillingProvider
  ): Promise<string | null> {
    const row = await tiCol().findOne(
      { scopeId, provider, ...softDeleteFilter() },
      { projection: { customerId: 1 } }
    );
    return row?.customerId ?? null;
  },
  async upsertCustomerMapping(
    scopeId: string,
    provider: BillingProvider,
    customerId: string
  ): Promise<void> {
    await tiCol().updateOne(
      { scopeId, provider },
      {
        $set: { customerId, deletedAt: null, updatedAt: new Date() },
        $setOnInsert: { meta: null, createdAt: new Date() },
      },
      { upsert: true }
    );
  },
  async findScopeIdByCustomer(
    provider: BillingProvider,
    customerId: string
  ): Promise<string | null> {
    const ti = await tiCol().findOne(
      { provider, customerId, ...softDeleteFilter() },
      { projection: { scopeId: 1 } }
    );
    return ti?.scopeId ?? null;
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
