/**
 * Outbox platform stub - provides transactional outbox pattern for reliable messaging
 * Actual implementations are injected by the application
 */

export interface OutboxMessage {
  scopeId: string;
  kind: string;
  payload: Record<string, unknown>;
  scheduledFor?: Date;
}

export interface OutboxServiceInterface {
  enqueue(message: OutboxMessage): Promise<{ id: string }>;
  process(batchSize?: number): Promise<number>;
}

export interface OutboxRepoInterface {
  insert(message: OutboxMessage): Promise<{ id: string }>;
  findPending(limit: number): Promise<Array<OutboxMessage & { id: string }>>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

const noopOutboxService: OutboxServiceInterface = {
  enqueue: async () => ({ id: 'noop' }),
  process: async () => 0,
};

const noopOutboxRepo: OutboxRepoInterface = {
  insert: async () => ({ id: 'noop' }),
  findPending: async () => [],
  markProcessed: async () => {},
  markFailed: async () => {},
};

let _outboxService: OutboxServiceInterface = noopOutboxService;
let _outboxRepo: OutboxRepoInterface = noopOutboxRepo;

export const OutboxService: OutboxServiceInterface = {
  enqueue: (msg) => _outboxService.enqueue(msg),
  process: (batchSize) => _outboxService.process(batchSize),
};

export const OutboxRepo: OutboxRepoInterface = {
  insert: (msg) => _outboxRepo.insert(msg),
  findPending: (limit) => _outboxRepo.findPending(limit),
  markProcessed: (id) => _outboxRepo.markProcessed(id),
  markFailed: (id, error) => _outboxRepo.markFailed(id, error),
};

export function setOutboxService(impl: OutboxServiceInterface): void {
  _outboxService = impl;
}

export function setOutboxRepo(impl: OutboxRepoInterface): void {
  _outboxRepo = impl;
}
