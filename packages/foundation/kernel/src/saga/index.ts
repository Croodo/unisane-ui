/**
 * Saga Module
 *
 * Provides the saga/process manager pattern for coordinating
 * multi-step workflows with compensation (rollback) support.
 *
 * ## Overview
 *
 * A saga is a sequence of steps that must all complete successfully,
 * or all be rolled back (compensated) if any step fails.
 *
 * ## Usage
 *
 * ```typescript
 * import { defineSaga, getSagaManager, setSagaStoreProvider } from '@unisane/kernel';
 *
 * // Define a saga
 * const orderSaga = defineSaga<OrderContext>({
 *   name: 'order.process',
 *   steps: [
 *     {
 *       name: 'reserve-inventory',
 *       execute: async (ctx) => { await reserveInventory(ctx.items); },
 *       compensate: async (ctx) => { await releaseInventory(ctx.items); },
 *     },
 *     {
 *       name: 'charge-payment',
 *       execute: async (ctx) => { await chargeCard(ctx.payment); },
 *       compensate: async (ctx) => { await refundCard(ctx.payment); },
 *     },
 *     {
 *       name: 'ship-order',
 *       execute: async (ctx) => { await createShipment(ctx.orderId); },
 *       // No compensate - shipping can't be undone
 *     },
 *   ],
 *   onComplete: async (ctx) => {
 *     await sendOrderConfirmation(ctx.orderId);
 *   },
 *   onFail: async (ctx, error, failedStep) => {
 *     await notifyOrderFailure(ctx.orderId, error, failedStep);
 *   },
 * });
 *
 * // Register and run
 * const manager = getSagaManager();
 * manager.register(orderSaga);
 *
 * const result = await manager.start('order.process', {
 *   orderId: 'order_123',
 *   items: [...],
 *   payment: {...},
 * });
 *
 * if (!result.success) {
 *   console.log('Order failed at step:', result.failedStep);
 * }
 * ```
 *
 * ## Recovery
 *
 * With saga persistence enabled, incomplete sagas can be recovered
 * after a crash:
 *
 * ```typescript
 * // During startup
 * const manager = getSagaManager();
 * const { recovered, failed } = await manager.recoverAll();
 * console.log(`Recovered ${recovered} sagas, ${failed} failed`);
 * ```
 */

// Types
export type {
  SagaStatus,
  StepStatus,
  SagaStep,
  SagaDefinition,
  StepRecord,
  SagaInstance,
  StartSagaOptions,
  SagaStorePort,
  SagaResult,
} from './types';

// Saga Manager
export {
  setSagaStoreProvider,
  getSagaStoreProvider,
  isSagaPersistenceEnabled,
  clearSagaStoreProvider,
  defineSaga,
  createSagaManager,
  getSagaManager,
  clearSagaManager,
} from './saga-manager';
export type { SagaManager } from './saga-manager';
