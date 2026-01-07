/**
 * Telemetry stubs for gateway package.
 * These are no-op implementations that can be overridden by the application.
 * In production, configure actual telemetry in your starter/app.
 */

// Rate limiting metrics
export function incRateLimited(_op: string): void {
  // No-op stub - override in app for actual metrics
}

// Idempotency metrics
export function incIdemReplay(): void {
  // No-op stub
}

export function incIdemWaitTimeout(): void {
  // No-op stub
}

// HTTP observability
export function observeHttp(_data: {
  op: string | null;
  method: string;
  status: number;
  ms: number;
}): void {
  // No-op stub - override in app for actual metrics
}

// Telemetry configuration interface for dependency injection
export interface TelemetryConfig {
  incRateLimited?: (op: string) => void;
  incIdemReplay?: () => void;
  incIdemWaitTimeout?: () => void;
  observeHttp?: (data: { op: string | null; method: string; status: number; ms: number }) => void;
}

let config: TelemetryConfig = {};

export function configureTelemetry(cfg: TelemetryConfig): void {
  config = cfg;
}

export function getTelemetry(): TelemetryConfig {
  return config;
}
