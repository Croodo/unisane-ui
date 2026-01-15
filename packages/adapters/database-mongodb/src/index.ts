/**
 * MongoDB Database Adapter
 *
 * Implements a pluggable MongoDB adapter for the hexagonal architecture.
 * This adapter exposes MongoDB's native Collection API directly.
 *
 * @example
 * ```typescript
 * import { MongoDBAdapter } from '@unisane/database-mongodb';
 *
 * const adapter = new MongoDBAdapter({
 *   uri: process.env.MONGODB_URI!,
 *   dbName: 'myapp',
 *   maxPoolSize: 50,
 *   minPoolSize: 5,
 * });
 *
 * await adapter.connect();
 *
 * // Use directly
 * const users = await adapter.collection('users').find({ active: true }).toArray();
 * ```
 */

import { MongoClient, ReadConcern, WriteConcern } from 'mongodb';
import type {
  Db,
  Collection,
  Document,
  MongoClientOptions,
  ClientSession,
} from 'mongodb';

export interface MongoDBAdapterConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name (defaults to name from URI) */
  dbName?: string;
  /** Maximum number of connections in the pool */
  maxPoolSize?: number;
  /** Minimum number of connections in the pool */
  minPoolSize?: number;
  /** Maximum time a connection can be idle (ms) */
  maxIdleTimeMS?: number;
  /** Timeout for server selection (ms) */
  serverSelectionTimeoutMS?: number;
  /** Socket timeout for operations (ms) */
  socketTimeoutMS?: number;
  /** Connection timeout (ms) */
  connectTimeoutMS?: number;
  /** Enable automatic retry on transient failures */
  retryWrites?: boolean;
  /** Enable automatic retry on read failures */
  retryReads?: boolean;
}

function parseDbName(uri: string): string {
  try {
    const afterProto = uri.split('://')[1] ?? '';
    const path = afterProto.split('/')[1] ?? '';
    const name = path.split('?')[0] ?? '';
    return name || 'test';
  } catch {
    return 'test';
  }
}

/**
 * MongoDB adapter providing connection management and native collection access.
 * This is a standalone adapter that can be used independently of the kernel.
 */
export class MongoDBAdapter {
  readonly type = 'mongodb' as const;

  private client: MongoClient | null = null;
  private database: Db | null = null;
  private connectingPromise: Promise<void> | null = null;
  private readonly config: MongoDBAdapterConfig;
  private readonly dbName: string;

  constructor(config: MongoDBAdapterConfig) {
    this.config = config;
    this.dbName = config.dbName ?? parseDbName(config.uri);
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    // Fast path: already connected
    if (this.client && this.database) {
      return;
    }

    // If another call is already connecting, wait for it
    if (this.connectingPromise) {
      await this.connectingPromise;
      return;
    }

    // Create and store the connection promise
    // We need to track which promise "owns" the connection attempt to avoid race conditions
    const connectionAttempt = this._doConnect();
    this.connectingPromise = connectionAttempt;

    try {
      await connectionAttempt;
    } finally {
      // Only clear if this is still the current promise
      // Another caller may have started a new attempt after we failed
      if (this.connectingPromise === connectionAttempt) {
        this.connectingPromise = null;
      }
    }
  }

  /**
   * Internal connection logic - separated for race condition handling
   */
  private async _doConnect(): Promise<void> {
    // Double-check after acquiring lock
    if (this.client && this.database) {
      return;
    }

    try {
      const options: MongoClientOptions = {
        maxPoolSize: this.config.maxPoolSize ?? 50,
        minPoolSize: this.config.minPoolSize ?? 5,
        maxIdleTimeMS: this.config.maxIdleTimeMS ?? 300_000,
        waitQueueTimeoutMS: 30_000,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS ?? 5000,
        socketTimeoutMS: this.config.socketTimeoutMS ?? 60_000,
        connectTimeoutMS: this.config.connectTimeoutMS ?? 10_000,
        retryWrites: this.config.retryWrites ?? true,
        retryReads: this.config.retryReads ?? true,
        writeConcern: new WriteConcern('majority', 10000),
        readConcern: new ReadConcern('majority'),
        compressors: ['zstd', 'snappy', 'zlib'],
      };

      const client = new MongoClient(this.config.uri, options);
      await client.connect();

      // Verify connection is healthy
      await client.db(this.dbName).command({ ping: 1 });

      this.client = client;
      this.database = client.db(this.dbName);
    } catch (error) {
      this.client = null;
      this.database = null;
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    this.connectingPromise = null;

    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.warn('[mongodb] Error during close:', (error as Error).message);
      }
      this.client = null;
      this.database = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client !== null && this.database !== null;
  }

  /**
   * Get the database instance (internal use)
   */
  private getDb(): Db {
    if (!this.database) {
      throw new Error('MongoDB not connected - call connect() first');
    }
    return this.database;
  }

  /**
   * Get a collection by name.
   * Returns the native MongoDB collection.
   */
  collection<T extends Document = Document>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }

  /**
   * Start a session for transactions
   */
  startSession(): ClientSession {
    if (!this.client) {
      throw new Error('MongoDB not connected - call connect() first');
    }
    return this.client.startSession();
  }

  /**
   * Run a callback within a transaction
   */
  async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.startSession();

    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Execute a raw MongoDB command
   */
  async raw<T = unknown>(query: object): Promise<T> {
    const result = await this.getDb().command(query as Document);
    return result as T;
  }

  /**
   * Run a health check
   */
  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();

    try {
      if (!this.client || !this.database) {
        return { ok: false, latencyMs: 0, error: 'Not connected' };
      }
      await this.database.command({ ping: 1 });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, error: (e as Error).message };
    }
  }

  /**
   * Get database statistics
   */
  async stats(): Promise<{
    collections: number;
    documents: number;
    storageSize: number;
    indexes: number;
  }> {
    const dbStats = await this.getDb().stats();
    return {
      collections: dbStats.collections ?? 0,
      documents: dbStats.objects ?? 0,
      storageSize: dbStats.storageSize ?? 0,
      indexes: dbStats.indexes ?? 0,
    };
  }

  /**
   * Drop a collection
   */
  async dropCollection(name: string): Promise<void> {
    await this.getDb().dropCollection(name);
  }

  /**
   * List all collection names
   */
  async listCollections(): Promise<string[]> {
    const collections = await this.getDb().listCollections().toArray();
    return collections.map((c) => c.name);
  }

  /**
   * Get the underlying MongoClient (for advanced use)
   */
  getClient(): MongoClient | null {
    return this.client;
  }

  /**
   * Get the underlying Db instance (for advanced use)
   */
  db(): Db {
    return this.getDb();
  }
}

// Re-export types from mongodb for convenience
export type { Db, Collection, Document, MongoClient, ClientSession } from 'mongodb';
