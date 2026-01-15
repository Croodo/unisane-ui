/**
 * MongoDB Adapter
 *
 * Implements the DatabaseProvider interface for MongoDB.
 * This adapter translates generic database operations to MongoDB-specific calls.
 */

import type {
  Collection,
  Db,
  Document,
  Filter,
  MongoClient,
  ClientSession,
  TransactionOptions as MongoTransactionOptions,
  WithId,
} from 'mongodb';
import { ObjectId } from 'mongodb';
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
  SortDirection,
  SessionOptions,
} from './types';
import { db, col, closeDb } from '../connection';
import { connectDb } from '../index';
import { logger } from '../../observability';

const log = logger.child({ module: 'database', component: 'mongo-adapter' });

/**
 * Convert a generic DatabaseFilter to MongoDB Filter.
 */
function toMongoFilter<T>(filter: DatabaseFilter<T>): Filter<Document> {
  const result: Filter<Document> = {};

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and' && Array.isArray(value)) {
      result.$and = value.map((f) => toMongoFilter(f));
    } else if (key === '$or' && Array.isArray(value)) {
      result.$or = value.map((f) => toMongoFilter(f));
    } else if (key === '$not' && typeof value === 'object' && value !== null) {
      result.$nor = [toMongoFilter(value as DatabaseFilter<T>)];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      // Check for operator object
      const ops = value as Record<string, unknown>;
      const mongoOps: Record<string, unknown> = {};

      if ('$eq' in ops) mongoOps.$eq = ops.$eq;
      if ('$ne' in ops) mongoOps.$ne = ops.$ne;
      if ('$gt' in ops) mongoOps.$gt = ops.$gt;
      if ('$gte' in ops) mongoOps.$gte = ops.$gte;
      if ('$lt' in ops) mongoOps.$lt = ops.$lt;
      if ('$lte' in ops) mongoOps.$lte = ops.$lte;
      if ('$in' in ops) mongoOps.$in = ops.$in;
      if ('$nin' in ops) mongoOps.$nin = ops.$nin;
      if ('$exists' in ops) mongoOps.$exists = ops.$exists;
      if ('$regex' in ops) mongoOps.$regex = ops.$regex;
      if ('$like' in ops) mongoOps.$regex = `.*${escapeRegex(String(ops.$like))}.*`;
      if ('$ilike' in ops) {
        mongoOps.$regex = `.*${escapeRegex(String(ops.$ilike))}.*`;
        mongoOps.$options = 'i';
      }

      if (Object.keys(mongoOps).length > 0) {
        result[key] = mongoOps;
      } else {
        // No operators - treat as direct value
        result[key] = value;
      }
    } else {
      // Handle _id specially - convert string to ObjectId for id field
      if (key === 'id' && typeof value === 'string') {
        if (ObjectId.isValid(value)) {
          result._id = new ObjectId(value);
        } else {
          result._id = value as unknown as ObjectId;
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Escape regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert sort direction to MongoDB format.
 */
function toMongoSort<T>(sort: Record<string, SortDirection | undefined>): Document {
  const mongoSort: Document = {};
  for (const [key, dir] of Object.entries(sort)) {
    if (dir === undefined) continue;
    const mongoKey = key === 'id' ? '_id' : key;
    mongoSort[mongoKey] = dir === 'asc' || dir === 1 ? 1 : -1;
  }
  return mongoSort;
}

/**
 * Map MongoDB document to BaseRecord format.
 */
function mapDocToRecord<T extends BaseRecord>(doc: WithId<Document>): T {
  const { _id, ...rest } = doc;
  return {
    id: String(_id),
    ...rest,
  } as T;
}

/**
 * Extract MongoDB ClientSession from TransactionSession.
 */
function getMongoSession(options?: SessionOptions): ClientSession | undefined {
  if (!options?.session) return undefined;
  return options.session.native as ClientSession;
}

/**
 * MongoDB Collection Adapter.
 * Implements DatabaseCollection for a specific MongoDB collection.
 *
 * All methods accept an optional session parameter for transaction support.
 * When a session is provided, the operation participates in that transaction.
 */
class MongoCollectionAdapter<T extends BaseRecord> implements DatabaseCollection<T> {
  constructor(
    public readonly name: string,
    private readonly getCollection: () => Collection<Document>
  ) {}

  private softDeleteFilter(includeSoftDeleted?: boolean): Filter<Document> {
    if (includeSoftDeleted) return {};
    return { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
  }

  async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    options?: SessionOptions
  ): Promise<CreateResult<T>> {
    const now = new Date();
    const doc = {
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const session = getMongoSession(options);
    const result = await this.getCollection().insertOne(doc, { session });
    const created = mapDocToRecord<T>({ _id: result.insertedId, ...doc } as WithId<Document>);

    return { data: created, id: created.id };
  }

  /**
   * Create multiple documents in a single batch operation.
   *
   * **Note:** Uses `ordered: false` for performance optimization. This means:
   * - If one insert fails, other inserts in the batch will still be attempted
   * - Partial success is possible (some documents inserted, others failed)
   * - This is the preferred behavior for bulk imports where individual failures
   *   should not block the entire batch
   * - Callers should handle partial success by checking returned results
   */
  async createMany(
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: SessionOptions
  ): Promise<CreateResult<T>[]> {
    if (!data.length) return [];

    const now = new Date();
    const docs = data.map((d) => ({
      ...d,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    const session = getMongoSession(options);
    // ordered: false allows remaining inserts to continue if one fails (performance optimization)
    const result = await this.getCollection().insertMany(docs, { ordered: false, session });

    return docs.map((doc, i) => {
      const insertedId = result.insertedIds[i];
      const created = mapDocToRecord<T>({ _id: insertedId, ...doc } as WithId<Document>);
      return { data: created, id: created.id };
    });
  }

  async findById(
    id: string,
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<T | null> {
    if (!ObjectId.isValid(id)) return null;

    const filter = {
      _id: new ObjectId(id),
      ...this.softDeleteFilter(options?.includeSoftDeleted),
    } as Filter<Document>;

    const session = getMongoSession(options);
    const doc = await this.getCollection().findOne(filter, { session });
    return doc ? mapDocToRecord<T>(doc as WithId<Document>) : null;
  }

  async findByIds(
    ids: string[],
    options?: Omit<QueryOptions<T>, 'pagination' | 'sort'> & SessionOptions
  ): Promise<Map<string, T>> {
    if (!ids.length) return new Map();

    const uniqueIds = [...new Set(ids)];
    const objectIds = uniqueIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (!objectIds.length) return new Map();

    const filter = {
      _id: { $in: objectIds },
      ...this.softDeleteFilter(options?.includeSoftDeleted),
    } as Filter<Document>;

    const session = getMongoSession(options);
    const docs = await this.getCollection().find(filter, { session }).toArray();
    const map = new Map<string, T>();

    for (const doc of docs) {
      const record = mapDocToRecord<T>(doc as WithId<Document>);
      map.set(record.id, record);
    }

    return map;
  }

  async findOne(
    filter: DatabaseFilter<T>,
    options?: Omit<QueryOptions<T>, 'pagination'> & SessionOptions
  ): Promise<T | null> {
    const mongoFilter = {
      ...toMongoFilter(filter),
      ...this.softDeleteFilter(options?.includeSoftDeleted),
    };

    const session = getMongoSession(options);

    if (options?.sort) {
      // findOne doesn't support sort directly, so use find().limit(1)
      const findCursor = this.getCollection()
        .find(mongoFilter, { session })
        .sort(toMongoSort(options.sort))
        .limit(1);
      const docs = await findCursor.toArray();
      const doc = docs[0];
      return doc ? mapDocToRecord<T>(doc as WithId<Document>) : null;
    }

    const doc = await this.getCollection().findOne(mongoFilter, { session });
    return doc ? mapDocToRecord<T>(doc as WithId<Document>) : null;
  }

  async findMany(
    filter: DatabaseFilter<T>,
    options?: QueryOptions<T> & SessionOptions
  ): Promise<FindManyResult<T>> {
    const mongoFilter = {
      ...toMongoFilter(filter),
      ...this.softDeleteFilter(options?.includeSoftDeleted),
    };

    const session = getMongoSession(options);
    let cursor = this.getCollection().find(mongoFilter, { session });

    if (options?.sort) {
      cursor = cursor.sort(toMongoSort(options.sort));
    }

    const limit = options?.pagination?.limit ?? 100;
    const skip = options?.pagination?.skip ?? 0;

    if (skip > 0) {
      cursor = cursor.skip(skip);
    }

    // Fetch one extra to determine hasMore
    cursor = cursor.limit(limit + 1);

    const docs = await cursor.toArray();
    const hasMore = docs.length > limit;
    const data = docs.slice(0, limit).map((doc) => mapDocToRecord<T>(doc as WithId<Document>));

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
    options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    if (!ObjectId.isValid(id)) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const mongoUpdate = this.toMongoUpdate(update);
    const session = getMongoSession(options);

    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) } as Filter<Document>,
      mongoUpdate,
      { returnDocument: 'after', session }
    );

    return {
      data: result ? mapDocToRecord<T>(result as WithId<Document>) : undefined,
      matchedCount: result ? 1 : 0,
      modifiedCount: result ? 1 : 0,
    };
  }

  async updateOne(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    const mongoFilter = toMongoFilter(filter);
    const mongoUpdate = this.toMongoUpdate(update);
    const session = getMongoSession(options);

    const result = await this.getCollection().findOneAndUpdate(
      mongoFilter,
      mongoUpdate,
      { returnDocument: 'after', session }
    );

    return {
      data: result ? mapDocToRecord<T>(result as WithId<Document>) : undefined,
      matchedCount: result ? 1 : 0,
      modifiedCount: result ? 1 : 0,
    };
  }

  async updateMany(
    filter: DatabaseFilter<T>,
    update: UpdateOperators<T>,
    options?: SessionOptions
  ): Promise<UpdateResult<T>> {
    const mongoFilter = toMongoFilter(filter);
    const mongoUpdate = this.toMongoUpdate(update);
    const session = getMongoSession(options);

    const result = await this.getCollection().updateMany(mongoFilter, mongoUpdate, { session });

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async softDelete(id: string, options?: SessionOptions): Promise<UpdateResult<T>> {
    if (!ObjectId.isValid(id)) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const now = new Date();
    const session = getMongoSession(options);

    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), ...this.softDeleteFilter() } as Filter<Document>,
      { $set: { deletedAt: now, updatedAt: now } },
      { returnDocument: 'after', session }
    );

    return {
      data: result ? mapDocToRecord<T>(result as WithId<Document>) : undefined,
      matchedCount: result ? 1 : 0,
      modifiedCount: result ? 1 : 0,
    };
  }

  async softDeleteMany(ids: string[], options?: SessionOptions): Promise<UpdateResult<T>> {
    if (!ids.length) return { matchedCount: 0, modifiedCount: 0 };

    const now = new Date();
    const objectIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (!objectIds.length) return { matchedCount: 0, modifiedCount: 0 };

    const session = getMongoSession(options);
    const result = await this.getCollection().updateMany(
      { _id: { $in: objectIds }, ...this.softDeleteFilter() } as Filter<Document>,
      { $set: { deletedAt: now, updatedAt: now } },
      { session }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async hardDelete(id: string, options?: SessionOptions): Promise<DeleteResult> {
    if (!ObjectId.isValid(id)) {
      return { deletedCount: 0 };
    }

    const session = getMongoSession(options);
    const result = await this.getCollection().deleteOne(
      { _id: new ObjectId(id) } as Filter<Document>,
      { session }
    );
    return { deletedCount: result.deletedCount };
  }

  async hardDeleteMany(ids: string[], options?: SessionOptions): Promise<DeleteResult> {
    if (!ids.length) return { deletedCount: 0 };

    const objectIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (!objectIds.length) return { deletedCount: 0 };

    const session = getMongoSession(options);
    const result = await this.getCollection().deleteMany(
      { _id: { $in: objectIds } } as Filter<Document>,
      { session }
    );
    return { deletedCount: result.deletedCount };
  }

  async count(filter?: DatabaseFilter<T>, options?: SessionOptions): Promise<number> {
    const mongoFilter = {
      ...(filter ? toMongoFilter(filter) : {}),
      ...this.softDeleteFilter(),
    };

    const session = getMongoSession(options);
    return this.getCollection().countDocuments(mongoFilter, { session });
  }

  async exists(filter: DatabaseFilter<T>, options?: SessionOptions): Promise<boolean> {
    const mongoFilter = {
      ...toMongoFilter(filter),
      ...this.softDeleteFilter(),
    };

    const session = getMongoSession(options);
    const count = await this.getCollection().countDocuments(mongoFilter, { limit: 1, session });
    return count > 0;
  }

  private toMongoUpdate(update: UpdateOperators<T>): Document {
    const mongoUpdate: Document = {};

    if (update.$set) {
      mongoUpdate.$set = {
        ...update.$set,
        updatedAt: new Date(),
      };
    } else {
      mongoUpdate.$set = { updatedAt: new Date() };
    }

    if (update.$unset) {
      mongoUpdate.$unset = update.$unset;
    }

    if (update.$inc) {
      mongoUpdate.$inc = update.$inc;
    }

    if (update.$push) {
      mongoUpdate.$push = update.$push;
    }

    if (update.$pull) {
      mongoUpdate.$pull = update.$pull;
    }

    if (update.$addToSet) {
      mongoUpdate.$addToSet = update.$addToSet;
    }

    return mongoUpdate;
  }
}

/**
 * MongoDB Database Provider.
 * Implements DatabaseProvider for MongoDB.
 */
export class MongoDBProvider implements DatabaseProvider {
  readonly type = 'mongo' as const;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;
    await connectDb();
    this.connected = true;
    log.info('MongoDB provider connected');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await closeDb();
    this.connected = false;
    log.info('MongoDB provider disconnected');
  }

  async health(): Promise<DatabaseHealthStatus> {
    try {
      const start = Date.now();
      const database = db();
      await database.command({ ping: 1 });
      const latencyMs = Date.now() - start;

      return { ok: true, latencyMs };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  collection<T extends BaseRecord>(name: string): DatabaseCollection<T> {
    return new MongoCollectionAdapter<T>(name, () => col(name));
  }

  async startTransaction(options?: TransactionOptions): Promise<TransactionSession> {
    const database = db();
    const client = (database as unknown as { client: MongoClient }).client;

    if (!client) {
      throw new Error('MongoDB client not available for transactions');
    }

    const session = client.startSession();

    const mongoOpts: MongoTransactionOptions = {};
    if (options?.readConcern) mongoOpts.readConcern = { level: options.readConcern };
    if (options?.writeConcern) {
      mongoOpts.writeConcern = {
        w: options.writeConcern,
        wtimeout: options.maxCommitTimeMs,
      };
    }

    session.startTransaction(mongoOpts);

    return {
      id: session.id?.id?.toString('hex') ?? 'unknown',
      native: session,
    };
  }

  async commitTransaction(session: TransactionSession): Promise<void> {
    const mongoSession = session.native as ClientSession;
    await mongoSession.commitTransaction();
    await mongoSession.endSession();
  }

  async abortTransaction(session: TransactionSession): Promise<void> {
    const mongoSession = session.native as ClientSession;
    await mongoSession.abortTransaction();
    await mongoSession.endSession();
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
    return db();
  }
}

/**
 * Create a MongoDB provider instance.
 */
export function createMongoDBProvider(): DatabaseProvider {
  return new MongoDBProvider();
}
