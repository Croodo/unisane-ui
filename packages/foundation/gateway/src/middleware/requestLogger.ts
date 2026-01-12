/**
 * Request/Response Logging Middleware
 *
 * Provides structured logging for HTTP requests with:
 * - Request method, path, duration
 * - Response status code
 * - Correlation ID (requestId) throughout
 * - Configurable body logging (for debugging, off by default for security)
 * - Log sampling for high-traffic endpoints
 *
 * ## Configuration
 *
 * ```typescript
 * import { configureRequestLogging } from '@unisane/gateway';
 *
 * configureRequestLogging({
 *   // Log request/response bodies (security: disable in production)
 *   logBodies: process.env.NODE_ENV === 'development',
 *
 *   // Sample rate for high-traffic endpoints (0.0-1.0)
 *   sampleRate: 1.0, // 100% by default
 *
 *   // Endpoints to always log regardless of sample rate
 *   alwaysLog: ['/api/rest/v1/auth/', '/api/rest/v1/billing/'],
 *
 *   // Endpoints to never log bodies for (sensitive data)
 *   neverLogBodies: ['/api/rest/v1/auth/'],
 *
 *   // Maximum body size to log (bytes)
 *   maxBodySize: 10_000, // 10KB
 *
 *   // Fields to redact from logged bodies
 *   redactFields: ['password', 'token', 'secret', 'apiKey', 'creditCard'],
 * });
 * ```
 *
 * ## Log Format
 *
 * Request start (when logBodies enabled):
 * ```json
 * {
 *   "level": "info",
 *   "msg": "request started",
 *   "requestId": "abc-123",
 *   "method": "POST",
 *   "path": "/api/rest/v1/users",
 *   "op": "users.create",
 *   "tenantId": "tenant_xyz",
 *   "userId": "user_123"
 * }
 * ```
 *
 * Request completed:
 * ```json
 * {
 *   "level": "info",
 *   "msg": "request completed",
 *   "requestId": "abc-123",
 *   "method": "POST",
 *   "path": "/api/rest/v1/users",
 *   "status": 201,
 *   "ms": 45,
 *   "op": "users.create"
 * }
 * ```
 */

import { gatewayLogger } from '../logger';

/**
 * Request logging configuration.
 */
export interface RequestLoggingConfig {
  /** Log request and response bodies. Default: false (security) */
  logBodies?: boolean;

  /** Sample rate for logging (0.0-1.0). Default: 1.0 */
  sampleRate?: number;

  /** Path prefixes to always log regardless of sample rate */
  alwaysLog?: string[];

  /** Path prefixes to never log bodies for (sensitive endpoints) */
  neverLogBodies?: string[];

  /** Maximum body size to log in bytes. Default: 10000 (10KB) */
  maxBodySize?: number;

  /** Field names to redact from logged bodies. Case-insensitive. */
  redactFields?: string[];

  /** Log request start event. Default: false */
  logRequestStart?: boolean;

  /** Custom sampler function (overrides sampleRate) */
  sampler?: (path: string, op: string | null) => boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<Omit<RequestLoggingConfig, 'sampler'>> & { sampler?: RequestLoggingConfig['sampler'] } = {
  logBodies: false,
  sampleRate: 1.0,
  alwaysLog: [],
  neverLogBodies: ['/api/rest/v1/auth/'],
  maxBodySize: 10_000,
  redactFields: ['password', 'token', 'secret', 'apiKey', 'api_key', 'creditCard', 'credit_card', 'ssn', 'cvv'],
  logRequestStart: false,
  sampler: undefined,
};

let config: typeof DEFAULT_CONFIG = { ...DEFAULT_CONFIG };

/**
 * Configure request logging behavior.
 *
 * @example
 * ```typescript
 * configureRequestLogging({
 *   logBodies: process.env.NODE_ENV === 'development',
 *   sampleRate: 0.1, // Log 10% of requests
 *   alwaysLog: ['/api/rest/v1/billing/'], // Always log billing
 * });
 * ```
 */
export function configureRequestLogging(cfg: RequestLoggingConfig): void {
  config = { ...DEFAULT_CONFIG, ...cfg };
}

/**
 * Get current request logging configuration.
 */
export function getRequestLoggingConfig(): Readonly<typeof config> {
  return config;
}

/**
 * Reset request logging configuration to defaults.
 */
export function resetRequestLoggingConfig(): void {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Check if a request should be logged based on sampling configuration.
 */
export function shouldLogRequest(path: string, op: string | null = null): boolean {
  // Custom sampler takes precedence
  if (config.sampler) {
    return config.sampler(path, op);
  }

  // Always log certain paths
  if (config.alwaysLog.some(prefix => path.startsWith(prefix))) {
    return true;
  }

  // Apply sample rate
  if (config.sampleRate >= 1.0) {
    return true;
  }
  if (config.sampleRate <= 0) {
    return false;
  }

  return Math.random() < config.sampleRate;
}

/**
 * Check if bodies should be logged for a given path.
 */
export function shouldLogBodies(path: string): boolean {
  if (!config.logBodies) {
    return false;
  }

  // Never log bodies for sensitive endpoints
  if (config.neverLogBodies.some(prefix => path.startsWith(prefix))) {
    return false;
  }

  return true;
}

/**
 * Redact sensitive fields from an object for logging.
 * Returns a new object with sensitive fields replaced by '[REDACTED]'.
 */
export function redactSensitiveFields<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redactedFields = new Set(config.redactFields.map(f => f.toLowerCase()));
  const result = { ...obj };

  for (const key of Object.keys(result)) {
    if (redactedFields.has(key.toLowerCase())) {
      (result as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      (result as Record<string, unknown>)[key] = redactSensitiveFields(result[key] as Record<string, unknown>);
    }
  }

  return result;
}

/**
 * Truncate body for logging if it exceeds max size.
 */
export function truncateBody(body: unknown): unknown {
  if (body === null || body === undefined) {
    return body;
  }

  const str = typeof body === 'string' ? body : JSON.stringify(body);
  if (str.length <= config.maxBodySize) {
    return body;
  }

  return {
    _truncated: true,
    _originalSize: str.length,
    _preview: str.slice(0, config.maxBodySize),
  };
}

/**
 * Prepare a body for logging (redact + truncate).
 */
export function prepareBodyForLogging(body: unknown): unknown {
  if (body === null || body === undefined) {
    return undefined;
  }

  let prepared = body;

  // Redact if it's an object
  if (typeof body === 'object' && body !== null) {
    prepared = redactSensitiveFields(body as Record<string, unknown>);
  }

  // Truncate if too large
  return truncateBody(prepared);
}

/**
 * Request logging context.
 */
export interface RequestLogData {
  requestId: string;
  method: string;
  path: string;
  op?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  startedAt: number;
}

/**
 * Log request start event.
 */
export function logRequestStart(data: RequestLogData, body?: unknown): void {
  if (!shouldLogRequest(data.path, data.op)) {
    return;
  }

  const logData: Record<string, unknown> = {
    requestId: data.requestId,
    method: data.method,
    path: data.path,
    ...(data.op && { op: data.op }),
    ...(data.tenantId && { tenantId: data.tenantId }),
    ...(data.userId && { userId: data.userId }),
  };

  if (body !== undefined && shouldLogBodies(data.path)) {
    logData.body = prepareBodyForLogging(body);
  }

  gatewayLogger.info('request started', logData);
}

/**
 * Log request completion event.
 */
export function logRequestCompleted(
  data: RequestLogData,
  response: { status: number; body?: unknown }
): void {
  if (!shouldLogRequest(data.path, data.op)) {
    return;
  }

  const ms = Date.now() - data.startedAt;

  const logData: Record<string, unknown> = {
    requestId: data.requestId,
    method: data.method,
    path: data.path,
    status: response.status,
    ms,
    ...(data.op && { op: data.op }),
    ...(data.tenantId && { tenantId: data.tenantId }),
    ...(data.userId && { userId: data.userId }),
  };

  if (response.body !== undefined && shouldLogBodies(data.path)) {
    logData.responseBody = prepareBodyForLogging(response.body);
  }

  // Use different log levels based on status
  if (response.status >= 500) {
    gatewayLogger.error('request failed', logData);
  } else if (response.status >= 400) {
    gatewayLogger.warn('request client error', logData);
  } else {
    gatewayLogger.info('request completed', logData);
  }
}

/**
 * Log request error event.
 */
export function logRequestError(
  data: RequestLogData,
  error: unknown,
  status: number
): void {
  if (!shouldLogRequest(data.path, data.op)) {
    return;
  }

  const ms = Date.now() - data.startedAt;

  const logData: Record<string, unknown> = {
    requestId: data.requestId,
    method: data.method,
    path: data.path,
    status,
    ms,
    ...(data.op && { op: data.op }),
    ...(data.tenantId && { tenantId: data.tenantId }),
    ...(data.userId && { userId: data.userId }),
  };

  // Add error details
  if (error instanceof Error) {
    logData.error = {
      name: error.name,
      message: error.message,
      cause: error.cause ? String(error.cause) : undefined,
    };
  }

  if (status >= 500) {
    gatewayLogger.error('request failed', logData);
  } else {
    gatewayLogger.warn('request error', logData);
  }
}

/**
 * Create a request logger context for tracking a request lifecycle.
 */
export function createRequestLogger(data: Omit<RequestLogData, 'startedAt'>): {
  data: RequestLogData;
  start: (body?: unknown) => void;
  complete: (response: { status: number; body?: unknown }) => void;
  error: (error: unknown, status: number) => void;
} {
  const fullData: RequestLogData = {
    ...data,
    startedAt: Date.now(),
  };

  return {
    data: fullData,
    start: (body?: unknown) => {
      if (config.logRequestStart) {
        logRequestStart(fullData, body);
      }
    },
    complete: (response) => logRequestCompleted(fullData, response),
    error: (err, status) => logRequestError(fullData, err, status),
  };
}
