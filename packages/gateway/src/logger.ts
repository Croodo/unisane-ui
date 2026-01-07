/**
 * Gateway Logger
 *
 * Re-exports the kernel's context-aware pino logger.
 * The logger automatically includes requestId, tenantId, and userId from context.
 */

import { logger as kernelLogger, createModuleLogger } from '@unisane/kernel';

// Re-export kernel logger as the main logger
export const logger = kernelLogger;

// Gateway-specific child logger
export const gatewayLogger = createModuleLogger('gateway');

export type RequestLogContext = {
  requestId?: string;
  method?: string;
  path?: string;
  url?: string;
  op?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  headers?: Record<string, unknown>;
};

/**
 * Create a child logger with request context.
 * Note: If you're within ctx.run(), the kernel logger already has requestId/tenantId/userId.
 * This function adds additional request-specific fields like method, path, op.
 */
export function withRequest(req: RequestLogContext) {
  return logger.child({
    ...(req.requestId && { requestId: req.requestId }),
    ...(req.method && { method: req.method }),
    ...(req.path ?? req.url ? { path: req.path ?? req.url } : {}),
    ...(req.op !== undefined && { op: req.op }),
    ...(req.tenantId !== undefined && { tenantId: req.tenantId }),
    ...(req.userId !== undefined && { userId: req.userId }),
  });
}
