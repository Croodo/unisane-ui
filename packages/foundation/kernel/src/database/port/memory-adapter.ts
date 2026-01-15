/**
 * In-Memory Database Adapter
 *
 * Implements the DatabaseProvider interface using in-memory storage.
 * Useful for testing and development without a real database.
 */

import type {
  DatabaseProvider,
  DatabaseCollection,
  DatabaseFilter,
  QueryOptions,
  UpdateOperators,
  CreateResult,
  UpdateResult,
  DeleteResult,
  FindManyResult,
  TransactionSession,
  TransactionOptions,
  DatabaseHealthStatus,
  BaseRecord,
  FilterOperator,
  SessionOptions,
} from './types';
import { ulid } from 'ulid';

/**
 * Generate a unique ID for memory storage.
 */
function generateMemoryId(): string {
  return `mem_${ulid()}`;
}

/**
 * In-memory storage for all collections.
 */
const storage = new Map<string, Map<string, BaseRecord>>();

/**
 * Clear all in-memory data.
 * Useful for test cleanup.
 */
export function clearMemoryStorage(): void {
  storage.clear();
}

/**
 * Get storage for a collection (creates if not exists).
 */
function getCollectionStorage<T extends BaseRecord>(name: string): Map<string, T> {
  let collectionStorage = storage.get(name);
  if (!collectionStorage) {
    collectionStorage = new Map();
    storage.set(name, collectionStorage);
  }
  return collectionStorage as Map<string, T>;
}

/**
 * Check if a value matches a filter operator.
 */
function matchesOperator<T>(value: T, op: FilterOperator<T>): boolean {
  if ('$eq' in op && value !== op.$eq) return false;
  if ('$ne' in op && value === op.$ne) return false;
  if ('$gt' in op && !(value > (op.$gt as T))) return false;
  if ('$gte' in op && !(value >= (op.$gte as T))) return false;
  if ('$lt' in op && !(value < (op.$lt as T))) return false;
  if ('$lte' in op && !(value <= (op.$lte as T))) return false;
  if ('$in' in op && !op.$in?.includes(value)) return false;
  if ('$nin' in op && op.$nin?.includes(value)) return false;
  if ('$exists' in op) {
    const exists = value !== undefined && value !== null;
    if (op.$exists && !exists) return false;
    if (!op.$exists && exists) return false;
  }
  if ('$regex' in op && typeof value === 'string') {
    const regex = new RegExp(op.$regex as string);
    if (!regex.test(value)) return false;
  }
  if ('$like' in op && typeof value === 'string') {
    if (!value.includes(String(op.$like))) return false;
  }
  if ('$ilike' in op && typeof value === 'string') {
    if (!value.toLowerCase().includes(String(op.$ilike).toLowerCase())) return false;
  }

  return true;
}

/**
 * Check if a record matches a filter.
 */
function matchesFilter<T extends BaseRecord>(record: T, filter: DatabaseFilter<T>): boolean {
  // Handle $and
  if ('$and' in filter && filter.$and) {
    if (!filter.$and.every((f) => matchesFilter(record, f))) return false;
  }

  // Handle $or
  if ('$or' in filter && filter.$or) {
    if (!filter.$or.some((f) => matchesFilter(record, f))) return false;
  }

  // Handle $not
  if ('$not' in filter && filter.$not) {
    if (matchesFilter(record, filter.$not)) return false;
  }

  // Check field filters
  for (const [key, filterValue] of Object.entries(filter)) {
    if (key === '$and' || key === '$or' || key === '$not') continue;

    const recordValue = (record as Record<string, unknown>)[key];

    if (typeof filterValue === 'object' && filterValue !== null && !(filterValue instanceof Date)) {
      // Check if it's an operator object
      const ops = filterValue as Record<string, unknown>;
      const hasOperator = Object.keys(ops).some((k) => k.startsWith('$'));

      if (hasOperator) {
        if (!matchesOperator(recordValue as unknown, ops as FilterOperator<unknown>)) {
          return false;
        }
      } else {
        // Deep equality check
        if (JSON.stringify(recordValue) !== JSON.stringify(filterValue)) {
          return false;
        }
      }
    } else {
      // Direct equality
      if (recordValue !== filterValue) return false;
    }
  }

  return true;
}

/**
 * Apply sorting to records.
 */
function sortRecords<T extends BaseRecord>(records: T[], sort?: QueryOptions<T>['sort']): T[] {
  if (!sort) return records;

  return [...records].sort((a, b) => {
    for (const [key, dir] of Object.entries(sort)) {
      const aVal = (a as Record<string, unknown>)[key] as string | number | Date | undefined;
      const bVal = (b as Record<string, unknown>)[key] as string | number | Date | undefined;

      const direction = dir === 'asc' || dir === 1 ? 1 : -1;

      if (aVal === undefined && bVal === undefined) continue;
      if (aVal === undefined) return 1 * direction;
      if (bVal === undefined) return -1 * direction;
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
    }
    return 0;
  });
}

/**
 * In-Memory Collection Adapter.
 *
 * Note: Session parameters are accepted for interface compliance but are ignored
 * since the in-memory adapter doesn't support real transactions.
 */
class MemoryCollectionAdapter<T extends BaseRecord> implements DatabaseCollection<T> {
  constructor(public readonly name: string) {}

  private getStorage(): Map<string, T> {
    return getCollectionStorage<T>(this.name);
  }

  private isNotDeleted(record: T, includeSoftDeleted?: boolean): boolean {
    if (includeSoftDeleted) return true;
    return record.deletedAt === null || record.deletedAt === undefined;
  }

  async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    _options?: SessionOptions
  ): Promise<CreateResult<T>> {
    const now = new Date();
    const id = generateMemoryId();
    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as T;

    this.getStorage().set(id, record);
    return { data: record, id };
  }

  async createMany(
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: SessionOptions
  ): Promise<CreateResult<T>[]> {
    const results: CreateResult<T>[] = [];
    for (const item of data) {
      results.push(await this.create(item, options));
    }
    return results;
  }

  async findById(
    id: string,
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<T | null> {
    const record = this.getStorage().get(id);
    if (!record) return null;
    if (!this.isNotDeleted(record, options?.includeSoftDeleted)) return null;
    return { ...record };
  }

  async findByIds(
    ids: string[],
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    for (const id of ids) {
      const record = await this.findById(id, options);
      if (record) result.set(id, record);
    }
    return result;
  }

  async findOne(
    filter: DatabaseFilter<T>,
    options?: Omit<QueryOptions<T>, 'pagination'> & SessionOptions
  ): Promise<T | null> {
    let records = Array.from(this.getStorage().values())
      .filter((r) => this.isNotDeleted(r, options?.includeSoftDeleted))
      .filter((r) => matchesFilter(r, filter));

    if (options?.sort) {
      records = sortRecords(records, options.sort);
    }

    return records[0] ? { ...records[0] } : null;
  }

  async findMany(
    filter: DatabaseFilter<T>,
    options?: QueryOptions<T> & SessionOptions
  ): Promise<FindManyResult<T>> {
    let records = Array.from(this.getStorage().values())
      .filter((r) => this.isNotDeleted(r, options?.includeSoftDeleted))
      .filter((r) => matchesFilter(r, filter));

    if (options?.sort) {
      records = sortRecords(records, options.sort);
    }

    const limit = options?.pagination?.limit ?? 100;
    const skip = options?.pagination?.skip ?? 0;

    const skipped = records.slice(skip);
    const hasMore = skipped.length > limit;
    const data = skipped.slice(0, limit).map((r) => ({ ...r }));

    const lastItem = data[data.length - 1];
    return {
      data,
      hasMore,
      nextCursor: hasMore && lastItem ? lastItem.id : undefined,
    };
  }

  async updateById(
    id: string,
    update: UpdateOperators<T>,
    _options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    const record = this.getStorage().get(id);
    if (!record) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const updated = this.applyUpdate(record, update);
    this.getStorage().set(id, updated);

    return {
      data: { ...updated },
      matchedCount: 1,
      modifiedCount: 1,
    };
  }

  async updateOne(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    const record = await this.findOne(filter, { includeSoftDeleted: true });
    if (!record) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    return this.updateById(record.id, update, options);
  }

  async updateMany(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    _options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    const { data: records } = await this.findMany(filter, { includeSoftDeleted: true, pagination: { limit: 10000 } });
    let modifiedCount = 0;

    for (const record of records) {
      const updated = this.applyUpdate(record, update);
      this.getStorage().set(record.id, updated);
      modifiedCount++;
    }

    return {
      matchedCount: records.length,
      modifiedCount,
    };
  }

  async softDelete(id: string, options?: SessionOptions): Promise<UpdateResult<T>> {
    const record = this.getStorage().get(id);
    if (!record || record.deletedAt) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    return this.updateById(id, { $set: { deletedAt: new Date() } as Partial<T> }, options);
  }

  async softDeleteMany(ids: string[], options?: SessionOptions): Promise<UpdateResult<T>> {
    let matchedCount = 0;
    let modifiedCount = 0;

    for (const id of ids) {
      const result = await this.softDelete(id, options);
      matchedCount += result.matchedCount;
      modifiedCount += result.modifiedCount;
    }

    return { matchedCount, modifiedCount };
  }

  async hardDelete(id: string, _options?: SessionOptions): Promise<DeleteResult> {
    const deleted = this.getStorage().delete(id);
    return { deletedCount: deleted ? 1 : 0 };
  }

  async hardDeleteMany(ids: string[], options?: SessionOptions): Promise<DeleteResult> {
    let deletedCount = 0;
    for (const id of ids) {
      const result = await this.hardDelete(id, options);
      deletedCount += result.deletedCount;
    }
    return { deletedCount };
  }

  async count(filter?: DatabaseFilter<T>, _options?: SessionOptions): Promise<number> {
    if (!filter) {
      return Array.from(this.getStorage().values())
        .filter((r) => this.isNotDeleted(r))
        .length;
    }

    return Array.from(this.getStorage().values())
      .filter((r) => this.isNotDeleted(r))
      .filter((r) => matchesFilter(r, filter))
      .length;
  }

  async exists(filter: DatabaseFilter<T>, options?: SessionOptions): Promise<boolean> {
    const record = await this.findOne(filter, options);
    return record !== null;
  }

  private applyUpdate(record: T, update: UpdateOperators<T>): T {
    // Create a mutable copy - use spread to create a plain object first
    const result: Record<string, unknown> = { ...JSON.parse(JSON.stringify(record)), updatedAt: new Date() };

    if (update.$set) {
      Object.assign(result, update.$set);
    }

    if (update.$unset) {
      for (const key of Object.keys(update.$unset)) {
        delete result[key];
      }
    }

    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        const current = (result[key] as number) ?? 0;
        result[key] = current + (val as number);
      }
    }

    if (update.$push) {
      for (const [key, val] of Object.entries(update.$push)) {
        const arr = (result[key] as unknown[]) ?? [];
        result[key] = [...arr, val];
      }
    }

    if (update.$pull) {
      for (const [key, val] of Object.entries(update.$pull)) {
        const arr = (result[key] as unknown[]) ?? [];
        result[key] = arr.filter((item) => item !== val);
      }
    }

    if (update.$addToSet) {
      for (const [key, val] of Object.entries(update.$addToSet)) {
        const arr = (result[key] as unknown[]) ?? [];
        if (!arr.includes(val)) {
          result[key] = [...arr, val];
        }
      }
    }

    return result as T;
  }
}

/**
 * In-Memory Database Provider.
 */
export class MemoryDatabaseProvider implements DatabaseProvider {
  readonly type = 'memory' as const;
  private txCounter = 0;

  async connect(): Promise<void> {
    // No-op for memory
  }

  async disconnect(): Promise<void> {
    // Optionally clear storage
  }

  async health(): Promise<DatabaseHealthStatus> {
    return { ok: true, latencyMs: 0 };
  }

  collection<T extends BaseRecord>(name: string): DatabaseCollection<T> {
    return new MemoryCollectionAdapter<T>(name);
  }

  async startTransaction(_options?: TransactionOptions): Promise<TransactionSession> {
    return {
      id: `mem-tx-${++this.txCounter}`,
      native: null,
    };
  }

  async commitTransaction(_session: TransactionSession): Promise<void> {
    // No-op for memory (no real transactions)
  }

  async abortTransaction(_session: TransactionSession): Promise<void> {
    // No-op for memory
  }

  async withTransaction<T>(
    fn: (session: TransactionSession) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const session = await this.startTransaction(options);
    try {
      const result = await fn(session);
      await this.commitTransaction(session);
      return result;
    } catch (error) {
      await this.abortTransaction(session);
      throw error;
    }
  }

  getNativeClient(): unknown {
    return storage;
  }
}

/**
 * Create a memory database provider instance.
 */
export function createMemoryDatabaseProvider(): DatabaseProvider {
  return new MemoryDatabaseProvider();
}
