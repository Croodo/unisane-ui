/**
 * Platform abstraction layer
 *
 * This module provides interfaces and injectable implementations for
 * platform-specific functionality. Actual implementations are provided
 * by the application at runtime.
 *
 * Usage:
 * 1. Import from '@unisane/kernel/platform'
 * 2. In your application bootstrap, call the set* functions to inject implementations
 */

export * from './telemetry';
export * from './config';
export * from './metering';
export * from './outbox';
export * from './oauth';
export * from './billing';
export * from './email';
export * from './auth';
