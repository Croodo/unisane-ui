import { MongoClient, ReadConcern, WriteConcern } from "mongodb";
import type { Db, Collection, Document } from "mongodb";
import { getEnv } from "../env";
import { ProviderError } from "../errors/common";

// --- MongoDB Node.js driver helper ---
// Use global object to share connection state across module instances in Next.js/Turbopack

interface MongoGlobalState {
  mongoClient: MongoClient | null;
  mongoDb: Db | null;
  mongoDbName: string | null;
  // Connection lock to prevent race conditions during concurrent connect calls
  connectingPromise: Promise<MongoClient> | null;
}

const globalForMongo = global as unknown as { __mongoState?: MongoGlobalState };

// Initialize global state if not exists
if (!globalForMongo.__mongoState) {
  globalForMongo.__mongoState = {
    mongoClient: null,
    mongoDb: null,
    mongoDbName: null,
    connectingPromise: null,
  };
}

const state = globalForMongo.__mongoState;

function parseDbName(uri: string): string {
  try {
    const afterProto = uri.split("://")[1] ?? "";
    const path = afterProto.split("/")[1] ?? "";
    const name = path.split("?")[0] ?? "";
    return name || "test";
  } catch {
    return "test";
  }
}

export async function connectDb(): Promise<MongoClient> {
  // Fast path: already connected
  if (state.mongoClient && state.mongoDb) {
    return state.mongoClient;
  }

  // If another call is already connecting, wait for it
  if (state.connectingPromise) {
    return state.connectingPromise;
  }

  const env = getEnv();
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new ProviderError("mongodb", new Error("MONGODB_URI is required when using mongo provider"), { retryable: false });
  }

  const dbName = parseDbName(uri);

  // Use a promise lock to prevent race conditions
  // Only one connection attempt will proceed, others wait for the same promise
  state.connectingPromise = (async () => {
    try {
      // Double-check after acquiring lock (another caller might have connected)
      if (state.mongoClient && state.mongoDb) {
        return state.mongoClient;
      }

      const client = new MongoClient(uri, {
        // ─── CONNECTION POOL SETTINGS ─────────────────────────────────────
        // Pool size tuning for typical SaaS workload
        // Default is 100, which is often too high for serverless/edge environments
        maxPoolSize: env.MONGODB_MAX_POOL_SIZE ?? 50,
        minPoolSize: env.MONGODB_MIN_POOL_SIZE ?? 5,
        // How long a connection can be idle before being closed (5 minutes)
        maxIdleTimeMS: 300_000,
        // Wait time for a connection from the pool (30 seconds)
        waitQueueTimeoutMS: 30_000,

        // ─── TIMEOUT SETTINGS ─────────────────────────────────────────────
        // Timeout set for serverless cold starts - 5 seconds is reasonable for Vercel/Lambda
        serverSelectionTimeoutMS: 5000,
        // Socket timeout for operations (60 seconds for long-running queries)
        socketTimeoutMS: 60_000,
        // Connection timeout (10 seconds)
        connectTimeoutMS: 10_000,

        // ─── RETRY & RELIABILITY ──────────────────────────────────────────
        // Automatic retry on transient network failures
        retryWrites: true,
        retryReads: true,
        // Default write concern: majority ensures data is replicated before acknowledgment
        // Prevents data loss if primary crashes before replication
        writeConcern: new WriteConcern("majority", 10000), // w: majority, wtimeout: 10s
        // Default read concern: majority ensures we only read committed data
        // Prevents reading data that might be rolled back during failover
        readConcern: new ReadConcern("majority"),

        // ─── COMPRESSION ──────────────────────────────────────────────────
        // Enable compression for large payloads (reduce bandwidth)
        compressors: ["zstd", "snappy", "zlib"],
      });

      await client.connect();

      // Verify connection is healthy before storing
      await client.db(dbName).command({ ping: 1 });

      state.mongoClient = client;
      state.mongoDb = client.db(dbName);
      state.mongoDbName = dbName;

      return client;
    } catch (error) {
      // Reset state on connection failure so next attempt can retry
      state.mongoClient = null;
      state.mongoDb = null;
      state.mongoDbName = null;
      // Wrap MongoDB connection errors with ProviderError for consistent error handling
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError("mongodb", error, { retryable: true });
    } finally {
      // Clear the lock so future calls can attempt connection if needed
      state.connectingPromise = null;
    }
  })();

  return state.connectingPromise;
}

export function db(): Db {
  if (!state.mongoDb) {
    throw new ProviderError("mongodb", new Error("Mongo not connected — call connectDb() first"), { retryable: false });
  }
  return state.mongoDb;
}

export function col<TSchema extends Document = Document>(
  name: string
): Collection<TSchema> {
  return db().collection<TSchema>(name);
}

export async function closeDb(): Promise<void> {
  // Clear connecting promise first to prevent new connections during close
  state.connectingPromise = null;

  if (state.mongoClient) {
    try {
      await state.mongoClient.close();
    } catch (error) {
      // Log but don't throw - we want to reset state even if close fails
      console.warn("[mongo] Error during close:", (error as Error).message);
    }
    state.mongoClient = null;
    state.mongoDb = null;
    state.mongoDbName = null;
  }
}

export async function mongoHealth(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const client = await connectDb();
    // Ping to verify connection is still alive
    await client.db(state.mongoDbName ?? "test").command({ ping: 1 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Check if MongoDB is currently connected (non-blocking)
export function isConnected(): boolean {
  return state.mongoClient !== null && state.mongoDb !== null;
}
