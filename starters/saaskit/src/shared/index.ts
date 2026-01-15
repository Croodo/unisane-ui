// ─── App-specific exports ─────────────────────────────────────────────────────
export { KIT_ID, KIT_VERSION, KIT_CHANNEL } from './kitVersion';

// ─── All other utilities are now in @unisane/kernel ───────────────────────────
// Import directly from @unisane/kernel:
// - Environment: EnvSchema, getEnv, validateCriticalEnv, assertCriticalEnv
// - Money utilities: moneyDecimals, parseMinorStr, toMinorStr, etc.
// - Time utilities: ZRFC3339, parseRFC3339, clampRangeDays
// - ID generation: uuid, newTenantId, newUserId, newApiKeyId
// - DTO schemas: ZCursor, ZLimit, ZIdem, etc.
// - Constants: All constants from ./constants/
// - RBAC: PERM, ROLE, etc.
// - Encoding: base64url utilities
// - Schema utilities
