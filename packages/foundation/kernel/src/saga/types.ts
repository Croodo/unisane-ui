/**
 * Saga Types
 *
 * Type definitions for the saga/process manager pattern.
 * Sagas coordinate multi-step workflows with compensation (rollback) support.
 */

/**
 * Status of a saga execution.
 */
export type SagaStatus =
  | 'pending'      // Not started
  | 'running'      // Currently executing steps
  | 'completed'    // All steps completed successfully
  | 'compensating' // Rolling back after failure
  | 'compensated'  // Successfully rolled back
  | 'failed';      // Failed (compensation may have failed too)

/**
 * Status of a single step within a saga.
 */
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'compensating'
  | 'compensated'
  | 'skipped';

/**
 * A single step in a saga workflow.
 */
export interface SagaStep<TContext> {
  /** Unique name for this step */
  name: string;

  /**
   * Execute the step's forward action.
   * Should be idempotent when possible.
   *
   * @param context - Shared context for the saga
   * @returns Updated context (or void to keep existing)
   */
  execute: (context: TContext) => Promise<TContext | void>;

  /**
   * Compensate (rollback) this step if a later step fails.
   * Optional - steps without compensate are considered non-reversible.
   *
   * @param context - Shared context for the saga
   * @returns Updated context (or void to keep existing)
   */
  compensate?: (context: TContext) => Promise<TContext | void>;

  /**
   * Timeout for this step in milliseconds.
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Number of retry attempts for transient failures.
   * Default: 0 (no retries)
   */
  retries?: number;

  /**
   * Whether this step should run even if previous steps failed.
   * Default: false
   */
  runOnFailure?: boolean;
}

/**
 * Definition of a saga workflow.
 */
export interface SagaDefinition<TContext> {
  /** Unique name for this saga type */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Ordered list of steps to execute */
  steps: SagaStep<TContext>[];

  /**
   * Called when all steps complete successfully.
   */
  onComplete?: (context: TContext) => Promise<void>;

  /**
   * Called when the saga fails (after compensation).
   */
  onFail?: (context: TContext, error: Error, failedStep: string) => Promise<void>;

  /**
   * Global timeout for the entire saga in milliseconds.
   * Default: 300000 (5 minutes)
   */
  timeout?: number;

  /**
   * Whether to persist saga state for recovery.
   * Default: true
   */
  persistent?: boolean;
}

/**
 * Record of a step execution within a saga instance.
 */
export interface StepRecord {
  /** Step name */
  name: string;

  /** Step status */
  status: StepStatus;

  /** When the step started */
  startedAt?: Date;

  /** When the step completed/failed */
  completedAt?: Date;

  /** Error message if failed */
  error?: string;

  /** Number of attempts made */
  attempts: number;
}

/**
 * A running or completed saga instance.
 */
export interface SagaInstance<TContext = unknown> {
  /** Unique ID for this saga instance */
  id: string;

  /** Name of the saga definition */
  sagaName: string;

  /** Current status */
  status: SagaStatus;

  /** Shared context data */
  context: TContext;

  /** Record of each step's execution */
  steps: StepRecord[];

  /** Index of the current/next step to execute */
  currentStepIndex: number;

  /** When the saga was created */
  createdAt: Date;

  /** When the saga was last updated */
  updatedAt: Date;

  /** When the saga completed (if completed) */
  completedAt?: Date;

  /** Error message if failed */
  error?: string;

  /** Step that caused the failure */
  failedStep?: string;

  /** Correlation ID for tracing */
  correlationId?: string;

  /** Scope ID (tenant, user, etc.) */
  scopeId?: string;
}

/**
 * Options for starting a saga.
 */
export interface StartSagaOptions {
  /** Correlation ID for tracing */
  correlationId?: string;

  /** Scope ID (tenant, user, etc.) */
  scopeId?: string;

  /** Custom saga instance ID (default: auto-generated) */
  id?: string;
}

/**
 * Port interface for saga persistence.
 */
export interface SagaStorePort {
  /**
   * Create a new saga instance.
   */
  create<TContext>(instance: SagaInstance<TContext>): Promise<void>;

  /**
   * Update an existing saga instance.
   */
  update<TContext>(instance: SagaInstance<TContext>): Promise<void>;

  /**
   * Get a saga instance by ID.
   */
  getById<TContext>(id: string): Promise<SagaInstance<TContext> | null>;

  /**
   * Find sagas by status.
   */
  findByStatus(status: SagaStatus, limit?: number): Promise<SagaInstance[]>;

  /**
   * Find sagas by name and status.
   */
  findByNameAndStatus(
    sagaName: string,
    status: SagaStatus,
    limit?: number
  ): Promise<SagaInstance[]>;

  /**
   * Find incomplete sagas (for recovery).
   */
  findIncomplete(limit?: number): Promise<SagaInstance[]>;

  /**
   * Delete a saga instance.
   */
  delete(id: string): Promise<boolean>;

  /**
   * Clean up old completed sagas.
   */
  cleanup(olderThan: Date): Promise<number>;
}

/**
 * Result of running a saga.
 */
export type SagaResult<TContext> =
  | { success: true; context: TContext; sagaId: string }
  | { success: false; error: string; failedStep: string; sagaId: string; context: TContext };
