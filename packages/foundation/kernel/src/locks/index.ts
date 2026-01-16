/**
 * Distributed Locking Module
 *
 * Provides atomic locking for preventing race conditions in distributed systems.
 */
export {
  acquireLock,
  releaseLock,
  withLock,
  type Lock,
  type LockOptions,
} from './distributed-lock';
