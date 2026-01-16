/**
 * Centralized Module Event Handler Registration
 *
 * This module provides a centralized way to register and initialize
 * all module event handlers at application bootstrap.
 *
 * ## Problem Solved
 *
 * Without centralization, each module exports its own `registerXxxEventHandlers()`
 * function that must be called individually in bootstrap. Missing a registration
 * is easy and leads to silent failures.
 *
 * ## Usage
 *
 * ```typescript
 * // In each module's index.ts (auto-registers on import)
 * import { registerModuleEventHandlers } from '@unisane/kernel';
 * import { registerBillingEventHandlers } from './event-handlers';
 *
 * registerModuleEventHandlers('billing', registerBillingEventHandlers);
 *
 * // In bootstrap.ts (single call initializes all)
 * import { initAllModuleEventHandlers } from '@unisane/kernel';
 *
 * const cleanup = initAllModuleEventHandlers();
 *
 * // On shutdown
 * cleanup();
 * ```
 */

import { logger } from '../observability/logger';

/**
 * Type for event handler registration function.
 * Returns a cleanup function to unsubscribe handlers.
 */
export type HandlerRegistrar = () => () => void;

/**
 * Registry of module event handlers.
 * Key is module name, value is registration function.
 */
const moduleHandlers = new Map<string, HandlerRegistrar>();

/**
 * Active cleanup functions from initialized handlers.
 */
let activeCleanups: Array<() => void> = [];

/**
 * Whether handlers have been initialized.
 */
let initialized = false;

/**
 * Register a module's event handler registration function.
 *
 * Call this in each module's index.ts to auto-register handlers.
 * The actual handlers won't be registered until `initAllModuleEventHandlers()` is called.
 *
 * @param moduleName - Unique module identifier (e.g., 'billing', 'credits')
 * @param registrar - Function that registers handlers and returns cleanup function
 *
 * @example
 * ```typescript
 * // In @unisane/billing/src/index.ts
 * registerModuleEventHandlers('billing', registerBillingEventHandlers);
 * ```
 */
export function registerModuleEventHandlers(
  moduleName: string,
  registrar: HandlerRegistrar
): void {
  if (moduleHandlers.has(moduleName)) {
    logger.warn('Module event handlers already registered, skipping duplicate', {
      module: 'events',
      moduleName,
    });
    return;
  }
  moduleHandlers.set(moduleName, registrar);
}

/**
 * Initialize all registered module event handlers.
 *
 * Call this once during application bootstrap after all modules are imported.
 * Returns a cleanup function that unsubscribes all handlers.
 *
 * @returns Cleanup function to unsubscribe all handlers
 *
 * @example
 * ```typescript
 * // In bootstrap.ts
 * const cleanup = initAllModuleEventHandlers();
 *
 * // On shutdown
 * cleanup();
 * ```
 */
export function initAllModuleEventHandlers(): () => void {
  if (initialized) {
    logger.warn('Module event handlers already initialized', { module: 'events' });
    return () => {
      // Return existing cleanup
      for (const cleanup of activeCleanups) {
        cleanup();
      }
      activeCleanups = [];
      initialized = false;
    };
  }

  const moduleNames = Array.from(moduleHandlers.keys());
  logger.info('Initializing event handlers', {
    module: 'events',
    count: moduleNames.length,
    modules: moduleNames,
  });

  activeCleanups = [];
  for (const [moduleName, registrar] of moduleHandlers) {
    try {
      const cleanup = registrar();
      activeCleanups.push(cleanup);
      logger.debug('Module handlers registered', { module: 'events', moduleName });
    } catch (error) {
      logger.error('Failed to register module handlers', {
        module: 'events',
        moduleName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  initialized = true;

  return () => {
    logger.info('Cleaning up all module event handlers', { module: 'events' });
    for (const cleanup of activeCleanups) {
      try {
        cleanup();
      } catch (error) {
        logger.error('Error during handler cleanup', {
          module: 'events',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    activeCleanups = [];
    initialized = false;
  };
}

/**
 * Get list of registered module names.
 * Useful for debugging and verification.
 */
export function getRegisteredModules(): string[] {
  return Array.from(moduleHandlers.keys());
}

/**
 * Check if handlers have been initialized.
 */
export function areHandlersInitialized(): boolean {
  return initialized;
}

/**
 * Clear all registrations (for testing only).
 */
export function clearModuleHandlerRegistry(): void {
  if (initialized) {
    for (const cleanup of activeCleanups) {
      try {
        cleanup();
      } catch {}
    }
    activeCleanups = [];
    initialized = false;
  }
  moduleHandlers.clear();
}
