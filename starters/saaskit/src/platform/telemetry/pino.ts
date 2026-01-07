import pino from 'pino';
import type { DestinationStream, Logger } from 'pino';
import { HEADER_NAMES } from '@unisane/gateway';
import { getEnv } from '@unisane/kernel';

const redactPaths = [
  `headers.${HEADER_NAMES.AUTHORIZATION}`,
  `headers.${HEADER_NAMES.IDEMPOTENCY_KEY}`,
  'headers.set-cookie',
  'headers.x-api-key',
  `req.headers.${HEADER_NAMES.AUTHORIZATION}`,
  `req.headers.${HEADER_NAMES.IDEMPOTENCY_KEY}`,
  'req.headers.set-cookie',
  'req.headers.x-api-key',
];

// Lazy initialization to avoid calling getEnv() at import time
let _logger: Logger | undefined;
function getLogger(): Logger {
  if (_logger) return _logger;

  const level = getEnv().LOG_LEVEL;
  
  // Pretty printing in non-prod if pino-pretty is available.
  // Use an inline destination stream to avoid worker threads (which can fail under bundlers).
  const wantPretty = getEnv().APP_ENV !== 'prod' && process.env.NODE_ENV !== 'test';
  let destination: DestinationStream | undefined;
  if (wantPretty) {
    try {
       
      const pretty = require('pino-pretty') as (options?: Record<string, unknown>) => DestinationStream;
      destination = pretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        singleLine: false,
        ignore: 'pid,hostname',
        levelFirst: true,
      }) as DestinationStream;
    } catch {
      // pino-pretty not installed or unavailable — continue with JSON logs
    }
  }

  _logger = pino(
    {
      level,
      redact: { paths: redactPaths, censor: '<redacted>' },
      base: null, // keep logs clean in serverless
    },
    destination
  );

  return _logger;
}

export const logger = new Proxy({} as Logger, {
  get(_target, prop) {
    return getLogger()[prop as keyof Logger];
  }
});

export function withRequest(meta: Record<string, unknown>) {
  return getLogger().child(meta);
}
