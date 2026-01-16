/**
 * Saga Manager
 *
 * Orchestrates multi-step workflows with compensation (rollback) support.
 * Implements the saga pattern for distributed transactions.
 *
 * ## Usage
 *
 * ```typescript
 * import { createSagaManager, defineSaga } from '@unisane/kernel';
 *
 * // Define a saga
 * const tenantDeletionSaga = defineSaga<TenantDeletionContext>({
 *   name: 'tenant.deletion',
 *   steps: [
 *     {
 *       name: 'cancel-subscription',
 *       execute: async (ctx) => { await cancelSubscription(ctx.scopeId); },
 *       compensate: async (ctx) => { await restoreSubscription(ctx.scopeId); },
 *     },
 *     {
 *       name: 'revoke-api-keys',
 *       execute: async (ctx) => { await revokeApiKeys(ctx.scopeId); },
 *     },
 *     // ... more steps
 *   ],
 * });
 *
 * // Create manager and register saga
 * const manager = createSagaManager();
 * manager.register(tenantDeletionSaga);
 *
 * // Run the saga
 * const result = await manager.start('tenant.deletion', { scopeId: 'tenant_123' });
 * if (result.success) {
 *   console.log('Tenant deleted successfully');
 * } else {
 *   console.log('Failed at step:', result.failedStep);
 * }
 * ```
 */

import { generateId } from '../utils/ids';
import { logger } from '../observability/logger';
import type {
  SagaDefinition,
  SagaInstance,
  SagaStorePort,
  SagaResult,
  StartSagaOptions,
  StepRecord,
  SagaStatus,
} from './types';

// =============================================================================
// Global State
// =============================================================================

/**
 * Registered saga definitions.
 */
const sagaRegistry = new Map<string, SagaDefinition<unknown>>();

/**
 * Saga store provider.
 */
let sagaStoreProvider: SagaStorePort | null = null;

/**
 * Default step timeout (30 seconds).
 */
const DEFAULT_STEP_TIMEOUT = 30000;

/**
 * Default saga timeout (5 minutes).
 */
const DEFAULT_SAGA_TIMEOUT = 300000;

// =============================================================================
// Provider Management
// =============================================================================

/**
 * Set the saga store provider.
 * Call this during bootstrap to enable saga persistence.
 */
export function setSagaStoreProvider(provider: SagaStorePort): void {
  sagaStoreProvider = provider;
  logger.debug('Saga store provider configured', { module: 'saga' });
}

/**
 * Get the current saga store provider.
 */
export function getSagaStoreProvider(): SagaStorePort | null {
  return sagaStoreProvider;
}

/**
 * Check if saga persistence is enabled.
 */
export function isSagaPersistenceEnabled(): boolean {
  return sagaStoreProvider !== null;
}

/**
 * Clear the saga store provider (for testing).
 */
export function clearSagaStoreProvider(): void {
  sagaStoreProvider = null;
}

// =============================================================================
// Saga Definition Helper
// =============================================================================

/**
 * Define a saga with type safety.
 * This is a helper that provides better TypeScript inference.
 *
 * @example
 * ```typescript
 * const mySaga = defineSaga<MyContext>({
 *   name: 'my-saga',
 *   steps: [...],
 * });
 * ```
 */
export function defineSaga<TContext>(
  definition: SagaDefinition<TContext>
): SagaDefinition<TContext> {
  return definition;
}

// =============================================================================
// Saga Manager
// =============================================================================

/**
 * Saga manager instance.
 */
export interface SagaManager {
  /**
   * Register a saga definition.
   */
  register<TContext>(definition: SagaDefinition<TContext>): void;

  /**
   * Unregister a saga definition.
   */
  unregister(name: string): void;

  /**
   * Check if a saga is registered.
   */
  isRegistered(name: string): boolean;

  /**
   * Get all registered saga names.
   */
  getRegisteredSagas(): string[];

  /**
   * Start a new saga instance.
   */
  start<TContext>(
    sagaName: string,
    initialContext: TContext,
    options?: StartSagaOptions
  ): Promise<SagaResult<TContext>>;

  /**
   * Resume an incomplete saga (for recovery).
   */
  resume<TContext>(sagaId: string): Promise<SagaResult<TContext>>;

  /**
   * Get a saga instance by ID.
   */
  getInstance<TContext>(sagaId: string): Promise<SagaInstance<TContext> | null>;

  /**
   * Find incomplete sagas for recovery.
   */
  findIncomplete(): Promise<SagaInstance[]>;

  /**
   * Recover all incomplete sagas.
   */
  recoverAll(): Promise<{ recovered: number; failed: number }>;
}

/**
 * Create a saga manager instance.
 */
export function createSagaManager(): SagaManager {
  const log = logger.child({ module: 'saga-manager' });

  /**
   * Execute a single step with timeout and retry.
   */
  async function executeStep<TContext>(
    step: SagaDefinition<TContext>['steps'][0],
    context: TContext,
    instance: SagaInstance<TContext>,
    stepRecord: StepRecord
  ): Promise<TContext> {
    const timeout = step.timeout ?? DEFAULT_STEP_TIMEOUT;
    const maxRetries = step.retries ?? 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      stepRecord.attempts = attempt + 1;

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Step '${step.name}' timed out after ${timeout}ms`)), timeout);
        });

        // Execute step with timeout
        const result = await Promise.race([
          step.execute(context),
          timeoutPromise,
        ]);

        return result ?? context;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          log.warn('Step failed, retrying', {
            sagaId: instance.id,
            step: step.name,
            attempt: attempt + 1,
            maxRetries,
            error: err.message,
          });
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw err;
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error(`Step '${step.name}' failed after ${maxRetries + 1} attempts`);
  }

  /**
   * Execute compensation for completed steps.
   */
  async function compensate<TContext>(
    definition: SagaDefinition<TContext>,
    instance: SagaInstance<TContext>,
    failedStepIndex: number
  ): Promise<void> {
    log.info('Starting compensation', {
      sagaId: instance.id,
      sagaName: instance.sagaName,
      failedStepIndex,
    });

    instance.status = 'compensating';
    if (sagaStoreProvider) {
      await sagaStoreProvider.update(instance);
    }

    let context = instance.context;

    // Compensate in reverse order, starting from the step before the failed one
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = definition.steps[i];
      const stepRecord = instance.steps[i];

      if (!step || !stepRecord) continue;

      // Skip if step wasn't completed or has no compensate
      if (stepRecord.status !== 'completed' || !step.compensate) {
        stepRecord.status = 'skipped';
        continue;
      }

      stepRecord.status = 'compensating';
      stepRecord.startedAt = new Date();

      try {
        const result = await step.compensate(context);
        context = result ?? context;
        stepRecord.status = 'compensated';
        stepRecord.completedAt = new Date();

        log.debug('Step compensated', {
          sagaId: instance.id,
          step: step.name,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        stepRecord.status = 'failed';
        stepRecord.error = err.message;
        stepRecord.completedAt = new Date();

        log.error('Compensation failed', {
          sagaId: instance.id,
          step: step.name,
          error: err.message,
        });

        // Continue compensating remaining steps even if one fails
      }
    }

    instance.context = context;
    instance.status = 'compensated';
    instance.updatedAt = new Date();
    instance.completedAt = new Date();

    if (sagaStoreProvider) {
      await sagaStoreProvider.update(instance);
    }
  }

  /**
   * Run a saga to completion.
   */
  async function runSaga<TContext>(
    definition: SagaDefinition<TContext>,
    instance: SagaInstance<TContext>
  ): Promise<SagaResult<TContext>> {
    const sagaTimeout = definition.timeout ?? DEFAULT_SAGA_TIMEOUT;
    const startTime = Date.now();

    log.info('Starting saga', {
      sagaId: instance.id,
      sagaName: instance.sagaName,
      stepsCount: definition.steps.length,
    });

    instance.status = 'running';
    if (sagaStoreProvider) {
      await sagaStoreProvider.update(instance);
    }

    let context = instance.context;

    for (let i = instance.currentStepIndex; i < definition.steps.length; i++) {
      // Check saga timeout
      if (Date.now() - startTime > sagaTimeout) {
        const error = `Saga timed out after ${sagaTimeout}ms`;
        instance.status = 'failed';
        instance.error = error;
        instance.failedStep = definition.steps[i]?.name;
        instance.updatedAt = new Date();

        if (sagaStoreProvider) {
          await sagaStoreProvider.update(instance);
        }

        log.error('Saga timed out', { sagaId: instance.id, sagaName: instance.sagaName });

        await compensate(definition, instance, i);

        if (definition.onFail) {
          await definition.onFail(context, new Error(error), instance.failedStep ?? 'unknown');
        }

        return {
          success: false,
          error,
          failedStep: instance.failedStep ?? 'unknown',
          sagaId: instance.id,
          context,
        };
      }

      const step = definition.steps[i];
      if (!step) continue;

      const stepRecord = instance.steps[i] ?? {
        name: step.name,
        status: 'pending' as const,
        attempts: 0,
      };

      if (!instance.steps[i]) {
        instance.steps[i] = stepRecord;
      }

      stepRecord.status = 'running';
      stepRecord.startedAt = new Date();
      instance.currentStepIndex = i;

      if (sagaStoreProvider) {
        await sagaStoreProvider.update(instance);
      }

      try {
        log.debug('Executing step', { sagaId: instance.id, step: step.name });

        context = await executeStep(step, context, instance, stepRecord);
        instance.context = context;

        stepRecord.status = 'completed';
        stepRecord.completedAt = new Date();

        if (sagaStoreProvider) {
          await sagaStoreProvider.update(instance);
        }

        log.debug('Step completed', { sagaId: instance.id, step: step.name });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        stepRecord.status = 'failed';
        stepRecord.error = err.message;
        stepRecord.completedAt = new Date();

        instance.status = 'failed';
        instance.error = err.message;
        instance.failedStep = step.name;
        instance.updatedAt = new Date();

        if (sagaStoreProvider) {
          await sagaStoreProvider.update(instance);
        }

        log.error('Step failed', {
          sagaId: instance.id,
          step: step.name,
          error: err.message,
        });

        // Compensate completed steps
        await compensate(definition, instance, i);

        if (definition.onFail) {
          await definition.onFail(context, err, step.name);
        }

        return {
          success: false,
          error: err.message,
          failedStep: step.name,
          sagaId: instance.id,
          context,
        };
      }
    }

    // All steps completed successfully
    instance.status = 'completed';
    instance.updatedAt = new Date();
    instance.completedAt = new Date();
    instance.currentStepIndex = definition.steps.length;

    if (sagaStoreProvider) {
      await sagaStoreProvider.update(instance);
    }

    log.info('Saga completed', {
      sagaId: instance.id,
      sagaName: instance.sagaName,
      duration: Date.now() - startTime,
    });

    if (definition.onComplete) {
      await definition.onComplete(context);
    }

    return {
      success: true,
      context,
      sagaId: instance.id,
    };
  }

  return {
    register<TContext>(definition: SagaDefinition<TContext>): void {
      if (sagaRegistry.has(definition.name)) {
        log.warn('Overwriting existing saga definition', { sagaName: definition.name });
      }
      sagaRegistry.set(definition.name, definition as SagaDefinition<unknown>);
      log.debug('Saga registered', { sagaName: definition.name });
    },

    unregister(name: string): void {
      sagaRegistry.delete(name);
    },

    isRegistered(name: string): boolean {
      return sagaRegistry.has(name);
    },

    getRegisteredSagas(): string[] {
      return Array.from(sagaRegistry.keys());
    },

    async start<TContext>(
      sagaName: string,
      initialContext: TContext,
      options?: StartSagaOptions
    ): Promise<SagaResult<TContext>> {
      const definition = sagaRegistry.get(sagaName) as SagaDefinition<TContext> | undefined;

      if (!definition) {
        throw new Error(`Saga '${sagaName}' is not registered`);
      }

      const now = new Date();
      const instance: SagaInstance<TContext> = {
        id: options?.id ?? generateId('saga'),
        sagaName,
        status: 'pending',
        context: initialContext,
        steps: definition.steps.map((step) => ({
          name: step.name,
          status: 'pending' as const,
          attempts: 0,
        })),
        currentStepIndex: 0,
        createdAt: now,
        updatedAt: now,
        correlationId: options?.correlationId,
        scopeId: options?.scopeId,
      };

      if (sagaStoreProvider && definition.persistent !== false) {
        await sagaStoreProvider.create(instance);
      }

      return runSaga(definition, instance);
    },

    async resume<TContext>(sagaId: string): Promise<SagaResult<TContext>> {
      if (!sagaStoreProvider) {
        throw new Error('Saga store provider not configured');
      }

      const instance = await sagaStoreProvider.getById<TContext>(sagaId);
      if (!instance) {
        throw new Error(`Saga instance '${sagaId}' not found`);
      }

      const definition = sagaRegistry.get(instance.sagaName) as SagaDefinition<TContext> | undefined;
      if (!definition) {
        throw new Error(`Saga '${instance.sagaName}' is not registered`);
      }

      log.info('Resuming saga', { sagaId, sagaName: instance.sagaName });

      return runSaga(definition, instance);
    },

    async getInstance<TContext>(sagaId: string): Promise<SagaInstance<TContext> | null> {
      if (!sagaStoreProvider) {
        return null;
      }
      return sagaStoreProvider.getById<TContext>(sagaId);
    },

    async findIncomplete(): Promise<SagaInstance[]> {
      if (!sagaStoreProvider) {
        return [];
      }
      return sagaStoreProvider.findIncomplete();
    },

    async recoverAll(): Promise<{ recovered: number; failed: number }> {
      if (!sagaStoreProvider) {
        return { recovered: 0, failed: 0 };
      }

      const incomplete = await sagaStoreProvider.findIncomplete();
      let recovered = 0;
      let failed = 0;

      for (const instance of incomplete) {
        try {
          const result = await this.resume(instance.id);
          if (result.success) {
            recovered++;
          } else {
            failed++;
          }
        } catch (error) {
          log.error('Failed to recover saga', {
            sagaId: instance.id,
            error: error instanceof Error ? error.message : String(error),
          });
          failed++;
        }
      }

      log.info('Saga recovery completed', { recovered, failed });

      return { recovered, failed };
    },
  };
}

/**
 * Global saga manager instance.
 */
let globalSagaManager: SagaManager | null = null;

/**
 * Get the global saga manager instance.
 * Creates one if it doesn't exist.
 */
export function getSagaManager(): SagaManager {
  if (!globalSagaManager) {
    globalSagaManager = createSagaManager();
  }
  return globalSagaManager;
}

/**
 * Clear the global saga manager (for testing).
 */
export function clearSagaManager(): void {
  globalSagaManager = null;
}
