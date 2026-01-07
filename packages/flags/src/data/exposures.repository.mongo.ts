import { col } from "@unisane/kernel";
import type { Exposure } from "../domain/exposure";

type ExposureDoc = {
  _id?: unknown;
  env: string;
  flagKey: string;
  value: boolean;
  reason: string;
  ruleIndex?: number;
  userId?: string;
  tenantId?: string;
  timestamp: Date;
};

const exposuresCol = () => col<ExposureDoc>("feature_flag_exposures");

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
      ...(exposure.tenantId ? { tenantId: exposure.tenantId } : {}),
      timestamp: new Date(exposure.timestamp),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MongoDB document casting
    } as any);
  },
};
