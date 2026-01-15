/**
 * Kernel Ports
 *
 * Port interfaces for hexagonal architecture.
 * Modules depend on these interfaces, implementations are injected at bootstrap.
 */

export {
  type AuthIdentityPort,
  type AuthUserRef,
  type AuthCreateUserInput,
  type AuthUpdateUserInput,
  setAuthIdentityProvider,
  getAuthIdentityProvider,
  hasAuthIdentityProvider,
} from "./auth-identity.port";

export {
  type SettingsPort,
  setSettingsProvider,
  getSettingsProvider,
  hasSettingsProvider,
  getTypedSetting,
  getSetting,
  patchSetting,
} from "./settings.port";

export {
  type FlagsPort,
  type FlagEvalCtx,
  type IsEnabledForScopeArgs,
  setFlagsProvider,
  getFlagsProvider,
  hasFlagsProvider,
  isEnabledForScope,
} from "./flags.port";

export {
  type BillingServicePort,
  setBillingServiceProvider,
  getBillingServiceProvider,
  hasBillingServiceProvider,
  getBillingModeViaPort,
  assertActiveSubscriptionForCreditsViaPort,
  findScopeIdByCustomerViaPort,
} from "./billing.port";

export {
  type IdentityPort,
  type UserView,
  setIdentityProvider,
  getIdentityProvider,
  hasIdentityProvider,
} from "./identity.port";

export {
  type TenantsPort,
  type TenantView,
  setTenantsProvider,
  getTenantsProvider,
  hasTenantsProvider,
} from "./tenants.port";

export {
  type JobsPort,
  type JobEvent,
  setJobsProvider,
  getJobsProvider,
  hasJobsProvider,
  sendJob,
  sendJobBatch,
} from "./jobs.port";

export {
  type OutboxPort,
  type OutboxItem,
  type OutboxRow,
  type OutboxDeadAdminRow,
  // Note: OutboxKind and OutboxStatus are exported from constants/outbox.ts
  setOutboxProvider,
  getOutboxProvider,
  hasOutboxProvider,
  enqueueOutbox,
  claimOutboxBatch,
} from "./outbox.port";
