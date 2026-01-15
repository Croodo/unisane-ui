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
  type TenantStatus,
  setTenantsProvider,
  getTenantsProvider,
  hasTenantsProvider,
  isTenantActiveViaPort,
  getTenantSubscriptionStatusViaPort,
} from "./tenants.port";

export {
  type CreditsPort,
  type CreditBalance,
  type CreditTransaction,
  setCreditsProvider,
  getCreditsProvider,
  hasCreditsProvider,
  consumeCreditsViaPort,
  hasSufficientCreditsViaPort,
} from "./credits.port";

export {
  type AuditPort,
  type AuditEntry,
  type AuditEntryInput,
  type AuditActor,
  type AuditTarget,
  type AuditChange,
  setAuditProvider,
  getAuditProvider,
  hasAuditProvider,
  logAuditViaPort,
} from "./audit.port";

export {
  type UsagePort,
  type UsageRecord,
  type UsageAggregate,
  type CurrentUsage,
  setUsageProvider,
  getUsageProvider,
  hasUsageProvider,
  recordUsageViaPort,
  getCurrentUsageViaPort,
} from "./usage.port";

export {
  type NotifyPort,
  type EmailAttachment,
  type EmailResult,
  type NotificationAction,
  type InAppResult,
  type WebhookResult,
  setNotifyProvider,
  getNotifyProvider,
  hasNotifyProvider,
  sendEmailViaPort,
  sendInAppViaPort,
} from "./notify.port";

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
