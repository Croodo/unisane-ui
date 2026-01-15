import type { ScopeIntegrationRef } from "../types";
import type { BillingProvider } from '@unisane/kernel';

export interface ScopeIntegrationsRepo {
  listByProviderCursor(provider: BillingProvider): AsyncIterable<ScopeIntegrationRef>;
  /** Return customer id for (scope, provider) if exists */
  findCustomerId(scopeId: string, provider: BillingProvider): Promise<string | null>;
  /** Upsert mapping between (scope, provider) and provider customer id */
  upsertCustomerMapping(
    scopeId: string,
    provider: BillingProvider,
    customerId: string
  ): Promise<void>;
  /** Reverse lookup: resolve scope id by (provider, customerId) */
  findScopeIdByCustomer(
    provider: BillingProvider,
    customerId: string
  ): Promise<string | null>;
  /** Soft-delete mapping(s) for a given provider+customerId (used on customer.deleted) */
  softDeleteCustomerMapping(
    provider: BillingProvider,
    customerId: string
  ): Promise<void>;
}
