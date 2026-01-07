import { MongoClient, ReadConcern, WriteConcern } from "mongodb";
import type { Db, Collection, Document } from "mongodb";
import { getEnv } from "../env";

// --- MongoDB Node.js driver helper ---
let __driverClient: MongoClient | null = null;
let __driverDb: Db | null = null;

const globalForMongo = global as unknown as { mongoClient: MongoClient | null };

export async function connectDb(): Promise<MongoClient> {
  if (globalForMongo.mongoClient && __driverDb)
    return globalForMongo.mongoClient;

  const env = getEnv();
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required when using mongo provider");
  }
  const dbName = (() => {
    // Otherwise derive from URI path
    try {
      const afterProto = uri.split("://")[1] ?? "";
      const path = afterProto.split("/")[1] ?? "";
      const name = path.split("?")[0] ?? "";
      return name || "test";
    } catch {
      return "test";
    }
  })();

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri, {
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
    await globalForMongo.mongoClient.connect();
  }

  __driverClient = globalForMongo.mongoClient;
  __driverDb = __driverClient.db(dbName);
  return __driverClient;
}

export function db(): Db {
  if (!__driverDb)
    throw new Error("Mongo not connected — call connectDb() first");
  return __driverDb;
}

export function col<TSchema extends Document = Document>(
  name: string
): Collection<TSchema> {
  return db().collection<TSchema>(name);
}

export async function closeDb(): Promise<void> {
  if (__driverClient) {
    await __driverClient.close().catch(() => {});
    __driverClient = null;
    __driverDb = null;
  }
}

export async function mongoHealth() {
  try {
    await connectDb();
    return { ok: true } as const;
  } catch (e) {
    return { ok: false, error: (e as Error).message } as const;
  }
}
