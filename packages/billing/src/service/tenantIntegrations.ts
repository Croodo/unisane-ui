import {
  listByProviderCursor as listByProviderCursorRepo,
  findCustomerId as findCustomerIdRepo,
  upsertCustomerMapping as upsertCustomerMappingRepo,
  findTenantIdByCustomer as findTenantIdByCustomerRepo,
  softDeleteCustomerMapping as softDeleteCustomerMappingRepo,
} from '../data/tenant-integrations.repository';

export const TenantIntegrationsService = {
  listByProviderCursor: listByProviderCursorRepo,
  findCustomerId: findCustomerIdRepo,
  upsertCustomerMapping: upsertCustomerMappingRepo,
  findTenantIdByCustomer: findTenantIdByCustomerRepo,
  softDeleteCustomerMapping: softDeleteCustomerMappingRepo,
} as const;
