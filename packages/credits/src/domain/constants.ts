/**
 * Credits Domain Constants
 */

export const CREDITS_EVENTS = {
  GRANTED: 'credits.granted',
  CONSUMED: 'credits.consumed',
  EXPIRED: 'credits.expired',
  REFUNDED: 'credits.refunded',
} as const;

export const CREDITS_DEFAULTS = {
  DEFAULT_EXPIRY_DAYS: 365,
} as const;

export const CREDITS_COLLECTIONS = {
  LEDGER: 'credits_ledger',
  BALANCES: 'credits_balances',
} as const;
