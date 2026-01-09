// ─── Environment ──────────────────────────────────────────────────────────────
export { EnvSchema, getEnv, validateCriticalEnv, assertCriticalEnv } from './env';
export type { Env } from './env';

// ─── Money utilities ──────────────────────────────────────────────────────────
export {
  moneyDecimals,
  parseMinorStr,
  toMinorStr,
  toMinorStrCurrency,
  toMajorNumber,
  toMajorNumberCurrency,
} from './money';

// ─── Time utilities ───────────────────────────────────────────────────────────
export { ZRFC3339, parseRFC3339, clampRangeDays } from './time';

// ─── ID generation ────────────────────────────────────────────────────────────
export { uuid, newTenantId, newUserId, newApiKeyId } from './ids';

// ─── DTO schemas ──────────────────────────────────────────────────────────────
export {
  ZCursor,
  ZLimit,
  ZIdem,
  ZLimitCoerce,
  ZSeekPageQuery,
  ZSeekPageWithSort,
} from './dto';
export type { Cursor, Limit, Idem, SeekPageQuery, SeekPageWithSort } from './dto';

// ─── Constants (re-export entire module for backwards compatibility) ──────────
// NOTE: Consider importing from @/src/shared/constants directly for better tree-shaking
export * from './constants';
