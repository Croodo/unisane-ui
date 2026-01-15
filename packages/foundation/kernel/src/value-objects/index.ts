/**
 * Value Objects
 *
 * Immutable domain primitives that encapsulate validation and behavior.
 * All Value Objects follow the same pattern:
 * - Private constructor with validation
 * - Factory methods (create, tryCreate, fromNormalized)
 * - Zod integration for schema validation
 * - equals() for comparison
 * - toString() for serialization
 */

// Money - monetary values with precision handling
export { Money, ZMoney, ZMoneyInput, ZCurrencyCode } from './money';
export type { CurrencyCode } from './money';

// Email - validated email addresses
export { Email, ZEmail, ZEmailString } from './email';

// Phone - E.164 format phone numbers
export { PhoneE164, ZPhoneE164, ZPhoneE164String } from './phone';

// Slug - URL-safe identifiers
export { Slug, ZSlug, ZSlugString } from './slug';

// Username - user identifiers
export { Username, ZUsername, ZUsernameString } from './username';
