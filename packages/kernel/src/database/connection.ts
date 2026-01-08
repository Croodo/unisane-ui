import { MongoClient, ReadConcern, WriteConcern } from "mongodb";
import type { Db, Collection, Document } from "mongodb";
import { getEnv } from "../env";

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
    throw new Error("MONGODB_URI is required when using mongo provider");
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
        // Timeout set for serverless cold starts - 5 seconds is reasonable for Vercel/Lambda
        serverSelectionTimeoutMS: 5000,
        // Automatic retry on transient network failures
        retryWrites: true,
        retryReads: true,
        // Default write concern: majority ensures data is replicated before acknowledgment
        // Prevents data loss if primary crashes before replication
        writeConcern: new WriteConcern("majority", 10000), // w: majority, wtimeout: 10s
        // Default read concern: majority ensures we only read committed data
        // Prevents reading data that might be rolled back during failover
        readConcern: new ReadConcern("majority"),
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
      throw error;
    } finally {
      // Clear the lock so future calls can attempt connection if needed
      state.connectingPromise = null;
    }
  })();

  return state.connectingPromise;
}

export function db(): Db {
  if (!state.mongoDb) {
    throw new Error("Mongo not connected — call connectDb() first");
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
