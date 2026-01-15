import type { ScopeIntegrationsRepo } from '../domain/ports/scope-integrations';
import { selectRepo } from '@unisane/kernel';
import { mongoScopeIntegrationsRepo } from './scope-integrations.repository.mongo';
import type { BillingProvider } from '@unisane/kernel';

export const ScopeIntegrationsRepoFacade = selectRepo<ScopeIntegrationsRepo>({ mongo: mongoScopeIntegrationsRepo });

export function listByProviderCursor(provider: BillingProvider) {
  return ScopeIntegrationsRepoFacade.listByProviderCursor(provider);
}

export function findCustomerId(scopeId: string, provider: BillingProvider) {
  return ScopeIntegrationsRepoFacade.findCustomerId(scopeId, provider);
}

export function upsertCustomerMapping(scopeId: string, provider: BillingProvider, customerId: string) {
  return ScopeIntegrationsRepoFacade.upsertCustomerMapping(scopeId, provider, customerId);
}

export function findScopeIdByCustomer(provider: BillingProvider, customerId: string) {
  return ScopeIntegrationsRepoFacade.findScopeIdByCustomer(provider, customerId);
}

export function softDeleteCustomerMapping(provider: BillingProvider, customerId: string) {
  return ScopeIntegrationsRepoFacade.softDeleteCustomerMapping(provider, customerId);
}
