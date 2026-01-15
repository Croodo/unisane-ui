import {
  listByProviderCursor as listByProviderCursorRepo,
  findCustomerId as findCustomerIdRepo,
  upsertCustomerMapping as upsertCustomerMappingRepo,
  findScopeIdByCustomer as findScopeIdByCustomerRepo,
  softDeleteCustomerMapping as softDeleteCustomerMappingRepo,
} from '../data/scope-integrations.repository';

export const ScopeIntegrationsService = {
  listByProviderCursor: listByProviderCursorRepo,
  findCustomerId: findCustomerIdRepo,
  upsertCustomerMapping: upsertCustomerMappingRepo,
  findScopeIdByCustomer: findScopeIdByCustomerRepo,
  softDeleteCustomerMapping: softDeleteCustomerMappingRepo,
} as const;
