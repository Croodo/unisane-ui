import { col, COLLECTIONS } from "@unisane/kernel";
import type { Exposure } from "../domain/exposure";

type ExposureDoc = {
  _id?: unknown;
  env: string;
  flagKey: string;
  value: boolean;
  reason: string;
  ruleIndex?: number;
  userId?: string;
  scopeId?: string;
  timestamp: Date;
};

const exposuresCol = () => col<ExposureDoc>(COLLECTIONS.FLAG_EXPOSURES);

export const ExposuresRepoMongo = {
  async log(exposure: Exposure) {
    // Fire and forget - we don't await this in the critical path usually,
    // but here we return the promise so the service can decide.
    // In high volume, we might want to batch these or use a message queue.
    await exposuresCol().insertOne({
      env: exposure.env,
      flagKey: exposure.flagKey,
      value: exposure.value,
      reason: exposure.reason,
      ...(exposure.ruleIndex !== undefined
        ? { ruleIndex: exposure.ruleIndex }
        : {}),
      ...(exposure.userId ? { userId: exposure.userId } : {}),
      ...(exposure.tenantId ? { scopeId: exposure.tenantId } : {}),
      timestamp: new Date(exposure.timestamp),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MongoDB document casting
    } as any);
  },

  /**
   * FLAG-001 FIX: Batch log multiple exposures in a single database operation.
   *
   * This reduces N database writes to 1 when evaluating multiple flags.
   * Uses insertMany with ordered: false for best performance.
   */
  async logBatch(exposures: Exposure[]) {
    if (exposures.length === 0) return;

    const docs = exposures.map((exposure) => ({
      env: exposure.env,
      flagKey: exposure.flagKey,
      value: exposure.value,
      reason: exposure.reason,
      ...(exposure.ruleIndex !== undefined
        ? { ruleIndex: exposure.ruleIndex }
        : {}),
      ...(exposure.userId ? { userId: exposure.userId } : {}),
      ...(exposure.tenantId ? { scopeId: exposure.tenantId } : {}),
      timestamp: new Date(exposure.timestamp),
    }));

    // Use ordered: false for better performance - allows parallel inserts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MongoDB document casting
    await exposuresCol().insertMany(docs as any[], { ordered: false });
  },
};
