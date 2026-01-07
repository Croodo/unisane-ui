import type { TenantIntegrationRef } from "../types";
import type { BillingProvider } from '@unisane/kernel';

export interface TenantIntegrationsRepo {
  listByProviderCursor(provider: BillingProvider): AsyncIterable<TenantIntegrationRef>;
  /** Return customer id for (tenant, provider) if exists */
  findCustomerId(tenantId: string, provider: BillingProvider): Promise<string | null>;
  /** Upsert mapping between (tenant, provider) and provider customer id */
  upsertCustomerMapping(
    tenantId: string,
    provider: BillingProvider,
    customerId: string
  ): Promise<void>;
  /** Reverse lookup: resolve tenant id by (provider, customerId) */
  findTenantIdByCustomer(
    provider: BillingProvider,
    customerId: string
  ): Promise<string | null>;
  /** Soft-delete mapping(s) for a given provider+customerId (used on customer.deleted) */
  softDeleteCustomerMapping(
    provider: BillingProvider,
    customerId: string
  ): Promise<void>;
}
