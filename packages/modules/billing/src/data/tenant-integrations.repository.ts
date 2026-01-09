import type { TenantIntegrationsRepo } from '../domain/ports/tenantIntegrations';
import { selectRepo } from '@unisane/kernel';
import { mongoTenantIntegrationsRepo } from './tenant-integrations.repository.mongo';
import type { BillingProvider } from '@unisane/kernel';

export const TenantIntegrationsRepoFacade = selectRepo<TenantIntegrationsRepo>({ mongo: mongoTenantIntegrationsRepo });

export function listByProviderCursor(provider: BillingProvider) {
  return TenantIntegrationsRepoFacade.listByProviderCursor(provider);
}

export function findCustomerId(tenantId: string, provider: BillingProvider) {
  return TenantIntegrationsRepoFacade.findCustomerId(tenantId, provider);
}

export function upsertCustomerMapping(tenantId: string, provider: BillingProvider, customerId: string) {
  return TenantIntegrationsRepoFacade.upsertCustomerMapping(tenantId, provider, customerId);
}

export function findTenantIdByCustomer(provider: BillingProvider, customerId: string) {
  return TenantIntegrationsRepoFacade.findTenantIdByCustomer(provider, customerId);
}

export function softDeleteCustomerMapping(provider: BillingProvider, customerId: string) {
  return TenantIntegrationsRepoFacade.softDeleteCustomerMapping(provider, customerId);
}
