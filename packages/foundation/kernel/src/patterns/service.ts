/**
 * Service Layer Patterns
 *
 * Base classes and utilities for building consistent service layers.
 * Services should contain business logic, not just pass-through to repositories.
 *
 * ## Service Responsibilities
 * - Input validation and normalization
 * - Business rule enforcement
 * - Authorization checks
 * - Transaction orchestration
 * - Event emission
 * - Audit logging
 *
 * ## Anti-patterns to Avoid
 * - Thin pass-through services (just delegating to repo)
 * - Business logic in repositories
 * - Direct database access in services
 * - Missing authorization checks
 */

import { createModuleLogger, type Logger } from '../observability/logger';
import type { Permission } from '../rbac/permissions';

/**
 * Base interface for all service operations.
 * Services should be stateless and receive context per-call.
 */
export interface ServiceContext {
  /** Current scope (tenant) ID */
  scopeId: string;
  /** Current user ID (null for system operations) */
  userId: string | null;
  /** Request ID for tracing */
  requestId?: string;
  /** User's effective permissions (resolved from roles + grants) */
  permissions?: Permission[];
  /** Whether user is a super admin (bypasses permission checks) */
  isSuperAdmin?: boolean;
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Result type for service operations that can fail gracefully.
 */
export type ServiceResult<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Helper to create success result
 */
export function ok<T>(data: T): ServiceResult<T, never> {
  return { ok: true, data };
}

/**
 * Helper to create error result
 */
export function err<E>(error: E): ServiceResult<never, E> {
  return { ok: false, error };
}

/**
 * Service operation metadata for documentation and introspection.
 */
export interface ServiceOperationMeta {
  /** Operation name (e.g., 'users.create') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Required permission (e.g., 'users:write') */
  permission?: string;
  /** Whether operation is idempotent */
  idempotent?: boolean;
  /** Whether operation requires authentication */
  requiresAuth?: boolean;
  /** Rate limit configuration */
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

/**
 * Base class for service implementations.
 *
 * Provides common patterns for:
 * - Context management
 * - Error handling
 * - Logging
 * - Metrics
 *
 * @example
 * ```typescript
 * class UserService extends BaseService {
 *   constructor(
 *     private readonly userRepo: UserRepository,
 *     private readonly emailService: EmailService,
 *   ) {
 *     super('users');
 *   }
 *
 *   async createUser(ctx: ServiceContext, input: CreateUserInput): Promise<User> {
 *     // 1. Validate input
 *     const validated = ZCreateUserInput.parse(input);
 *
 *     // 2. Check business rules
 *     const existing = await this.userRepo.findByEmail(validated.email);
 *     if (existing) {
 *       throw new ConflictError('User already exists');
 *     }
 *
 *     // 3. Execute operation
 *     const user = await this.userRepo.create({
 *       ...validated,
 *       createdBy: ctx.userId,
 *     });
 *
 *     // 4. Side effects (events, notifications)
 *     await this.emailService.sendWelcome(user.email);
 *
 *     return user;
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  protected readonly serviceName: string;
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = createModuleLogger(serviceName);
  }

  /**
   * Log a service operation with structured logging.
   * Automatically includes service name and operation context.
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    operation: string,
    data?: Record<string, unknown>
  ): void {
    this.logger[level](`${operation}`, { op: `${this.serviceName}.${operation}`, ...data });
  }

  /**
   * Wrap an operation with error handling and structured logging.
   * Logs duration, success/failure, and error details.
   */
  protected async withLogging<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      this.log('debug', operation, { durationMs: Date.now() - startTime, success: true });
      return result;
    } catch (error) {
      this.log('error', operation, {
        durationMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Check if context has a specific permission.
   * Super admins bypass all permission checks.
   */
  protected hasPermission(ctx: ServiceContext, permission: Permission): boolean {
    if (ctx.isSuperAdmin) return true;
    return ctx.permissions?.includes(permission) ?? false;
  }

  /**
   * Assert that context has a specific permission.
   * Throws PermissionDeniedError if check fails.
   */
  protected assertPermission(ctx: ServiceContext, permission: Permission): void {
    if (!this.hasPermission(ctx, permission)) {
      throw new PermissionDeniedError(permission, ctx.userId);
    }
  }
}

/**
 * Error thrown when a required permission is missing.
 */
export class PermissionDeniedError extends Error {
  readonly permission: Permission;
  readonly userId: string | null;

  constructor(permission: Permission, userId: string | null) {
    super(`Permission denied: ${permission} required`);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
    this.userId = userId;
  }
}

/**
 * Error thrown when authentication is required but missing.
 */
export class AuthenticationRequiredError extends Error {
  constructor(operation?: string) {
    super(operation ? `Authentication required for ${operation}` : 'Authentication required');
    this.name = 'AuthenticationRequiredError';
  }
}

/**
 * Decorator for service methods that require authentication.
 * Throws AuthenticationRequiredError if ctx.userId is null.
 */
export function requiresAuth(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (ctx: ServiceContext, ...args: unknown[]) {
    if (!ctx.userId) {
      throw new AuthenticationRequiredError();
    }
    return originalMethod.apply(this, [ctx, ...args]);
  };

  return descriptor;
}

/**
 * Decorator for service methods that require a specific permission.
 *
 * Checks ctx.permissions array for the required permission.
 * Super admins (ctx.isSuperAdmin) bypass all permission checks.
 * Throws PermissionDeniedError if check fails.
 *
 * @example
 * ```typescript
 * class SettingsService extends BaseService {
 *   @requiresPermission(PERM.SETTINGS_WRITE)
 *   async updateSetting(ctx: ServiceContext, key: string, value: unknown) {
 *     // Only users with settings:write permission can call this
 *   }
 * }
 * ```
 */
export function requiresPermission(permission: Permission) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: ServiceContext, ...args: unknown[]) {
      // Super admins bypass all permission checks
      if (ctx.isSuperAdmin) {
        return originalMethod.apply(this, [ctx, ...args]);
      }

      // Check if user has the required permission
      if (!ctx.permissions?.includes(permission)) {
        throw new PermissionDeniedError(permission, ctx.userId);
      }

      return originalMethod.apply(this, [ctx, ...args]);
    };

    return descriptor;
  };
}

/**
 * Service factory type for dependency injection.
 */
export type ServiceFactory<T> = (deps: Record<string, unknown>) => T;

/**
 * Create a service with dependency injection.
 *
 * @example
 * ```typescript
 * const createUserService = createService(
 *   'users',
 *   (deps) => new UserService(
 *     deps.userRepo as UserRepository,
 *     deps.emailService as EmailService,
 *   )
 * );
 *
 * const userService = createUserService({
 *   userRepo: new MongoUserRepository(),
 *   emailService: new ResendEmailService(),
 * });
 * ```
 */
export function createService<T>(
  name: string,
  factory: ServiceFactory<T>
): ServiceFactory<T> {
  return (deps) => {
    const service = factory(deps);
    // Could add instrumentation, logging, etc. here
    return service;
  };
}

/**
 * Compose multiple services into a single facade.
 *
 * @example
 * ```typescript
 * const services = composeServices({
 *   users: userService,
 *   billing: billingService,
 *   notifications: notificationService,
 * });
 *
 * await services.users.create(ctx, input);
 * ```
 */
export function composeServices<T extends Record<string, unknown>>(
  services: T
): T {
  return services;
}

/**
 * Business rule validation helper.
 * Collects multiple validation errors before throwing.
 *
 * @example
 * ```typescript
 * const rules = new BusinessRules('createOrder');
 *
 * rules.check(
 *   order.items.length > 0,
 *   'Order must have at least one item'
 * );
 *
 * rules.check(
 *   order.total >= 0,
 *   'Order total cannot be negative'
 * );
 *
 * rules.check(
 *   customer.creditLimit >= order.total,
 *   'Order exceeds customer credit limit'
 * );
 *
 * rules.throwIfInvalid(); // Throws with all failed rules
 * ```
 */
export class BusinessRules {
  private readonly operation: string;
  private readonly errors: string[] = [];

  constructor(operation: string) {
    this.operation = operation;
  }

  /**
   * Add a business rule check.
   */
  check(condition: boolean, message: string): this {
    if (!condition) {
      this.errors.push(message);
    }
    return this;
  }

  /**
   * Check if all rules passed.
   */
  get isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Get all validation errors.
   */
  get validationErrors(): readonly string[] {
    return this.errors;
  }

  /**
   * Throw if any rules failed.
   */
  throwIfInvalid(): void {
    if (this.errors.length > 0) {
      throw new BusinessRuleError(this.operation, this.errors);
    }
  }
}

/**
 * Error thrown when business rules are violated.
 */
export class BusinessRuleError extends Error {
  readonly operation: string;
  readonly violations: readonly string[];

  constructor(operation: string, violations: string[]) {
    const message = `Business rule violation in ${operation}: ${violations.join('; ')}`;
    super(message);
    this.name = 'BusinessRuleError';
    this.operation = operation;
    this.violations = violations;
  }
}
