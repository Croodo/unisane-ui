/**
 * Architecture Patterns
 *
 * Base classes, interfaces, and utilities for building consistent
 * service and data access layers across all modules.
 *
 * @module @unisane/kernel/patterns
 */

// Service Layer Patterns
export {
  BaseService,
  BusinessRules,
  BusinessRuleError,
  PermissionDeniedError,
  AuthenticationRequiredError,
  createService,
  composeServices,
  requiresAuth,
  requiresPermission,
  ok,
  err,
} from "./service";

export type {
  ServiceContext,
  ServiceResult,
  ServiceOperationMeta,
  ServiceFactory,
} from "./service";

// Repository Patterns
// Note: BaseMongoRepository and selectRepo are exported from ../database
export {
  InMemoryRepository,
  InMemoryUnitOfWork,
  QueryBuilder,
  toMongoFilter,
  UpdateBuilder,
  toMongoUpdate,
  toSqlWhere,
  toSqlUpdate,
  toSqlSelect,
  camelToSnake,
  createUnitOfWork,
} from "./repository";

export type {
  RepositoryPort,
  QueryableRepositoryPort,
  ScopedRepositoryPort,
  PaginationOptions,
  PaginatedResult,
  UnitOfWork,
  TransactionExecutor,
  EntityMapper,
  QueryFilterOp,
  FilterCondition,
  QuerySpec,
  OrGroup,
  UpdateOp,
  UpdateSpec,
  SqlOptions,
  SqlResult,
} from "./repository";
