/**
 * Errors Module
 *
 * Provides a domain error hierarchy for consistent error handling.
 *
 * ## Null Handling Convention: `findX` vs `getX`
 *
 * This codebase follows a strict naming convention for null handling:
 *
 * ### Query Functions (Return `null` for missing resources)
 *
 * Use prefix `find` when the absence of data is a **valid, expected outcome**:
 *
 * ```typescript
 * // ✅ Good - caller handles null case
 * const user = await findUserByEmail(email);
 * if (!user) {
 *   // Handle case where user doesn't exist (e.g., during sign-up check)
 * }
 *
 * // Examples:
 * findUserByEmail(email: string): Promise<User | null>
 * findTenantBySlug(slug: string): Promise<Tenant | null>
 * findSubscription(tenantId: string): Promise<Subscription | null>
 * findApiKeyByToken(token: string): Promise<ApiKey | null>
 * ```
 *
 * ### Command/Access Functions (Throw on missing resources)
 *
 * Use prefix `get` when the resource **must exist** for the operation to proceed:
 *
 * ```typescript
 * // ✅ Good - throws NotFoundError if missing
 * const user = await getUser(userId);  // Caller expects user to exist
 *
 * // Examples:
 * getUser(userId: string): Promise<User>              // Throws NotFoundError
 * getTenant(tenantId: string): Promise<Tenant>        // Throws NotFoundError
 * getSubscription(tenantId: string): Promise<Subscription>  // Throws SubscriptionNotFoundError
 * ```
 *
 * ### Error Types to Throw
 *
 * - **Generic resources**: Use `NotFoundError` from kernel
 *   ```typescript
 *   throw new NotFoundError('User', userId);
 *   ```
 *
 * - **Domain-specific**: Create module-specific error classes
 *   ```typescript
 *   // In billing module
 *   export class SubscriptionNotFoundError extends DomainError {
 *     readonly code = ErrorCode.SUBSCRIPTION_NOT_FOUND;
 *     readonly status = 404;
 *     constructor(tenantId: string) {
 *       super(`No subscription found for tenant ${tenantId}`);
 *     }
 *   }
 *   ```
 *
 * ### Summary Table
 *
 * | Pattern    | Returns    | Use When                              |
 * |------------|------------|---------------------------------------|
 * | `findX()`  | `T | null` | Absence is valid (lookups, searches)  |
 * | `getX()`   | `T`        | Resource must exist (throws if not)   |
 *
 * ---
 *
 * ## Error Message Style Guide
 *
 * Write error messages that help developers debug quickly:
 *
 * ### Structure
 *
 * 1. **What went wrong** - Clear statement of the problem
 * 2. **What was received** - The actual value (truncated if large)
 * 3. **What was expected** - The correct format/value
 * 4. **How to fix** - Actionable suggestion (when applicable)
 *
 * ### Examples
 *
 * ```typescript
 * // ❌ Bad - vague, no context
 * throw new Error("Invalid input");
 * throw new Error("filters must be valid JSON");
 *
 * // ✅ Good - specific, actionable
 * throw new BadRequestError(
 *   `Invalid email format. Received: '${email}'. Expected: valid email like 'user@example.com'.`
 * );
 *
 * throw new BadRequestError(
 *   `filters parameter is not valid JSON. ` +
 *   `Received: '${value.slice(0, 50)}...'. ` +
 *   `Expected: JSON array like [{"field":"status","op":"eq","value":"active"}].`
 * );
 * ```
 *
 * ### Guidelines
 *
 * - Use single quotes around values: `Received: 'foo'`
 * - Truncate long values: `'${value.slice(0, 50)}...'`
 * - Include field names when validating objects
 * - Provide concrete examples of valid input
 * - Use backticks for code references in docs
 * - Keep messages under 200 characters when possible
 *
 * ---
 *
 * @example
 * ```typescript
 * import { NotFoundError, ValidationError, ErrorCode, DomainError } from '@unisane/kernel';
 *
 * // Throwing errors
 * throw new NotFoundError('User', userId);
 * throw new ValidationError('Invalid input', { email: 'Invalid format' });
 *
 * // Creating custom module errors
 * export class SubscriptionNotFoundError extends DomainError {
 *   readonly code = ErrorCode.SUBSCRIPTION_NOT_FOUND;
 *   readonly status = 404;
 *
 *   constructor(tenantId: string) {
 *     super(`No subscription found for tenant ${tenantId}`);
 *   }
 * }
 *
 * // Checking error type
 * try {
 *   await getUser(id);
 * } catch (error) {
 *   if (isDomainError(error)) {
 *     console.log(error.code, error.status);
 *   }
 * }
 * ```
 */

// Base class and utilities
export {
  DomainError,
  isDomainError,
  wrapError,
  createDomainError,
} from './base';
export type { ErrorResponse, DomainErrorOptions, CreateErrorConfig, FieldError } from './base';

// Error catalog
export {
  ErrorCode,
  ErrorCatalog,
  getErrorInfo,
  getErrorStatus,
  getErrorMessage,
} from './catalog';
export type { ErrorCatalogEntry } from './catalog';

// Common error classes
export {
  InternalError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  RateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  BadRequestError,
  PreconditionFailedError,
  UnprocessableError,
  ProviderError,
  ConfigurationError,
  AdapterError,
} from './common';
