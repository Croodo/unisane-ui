import { z } from 'zod';

export const APP_ENVS = ["dev", "stage", "prod", "test"] as const;
export type AppEnv = (typeof APP_ENVS)[number];
export const ZAppEnv = z.enum(APP_ENVS);

export const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export const ZLogLevel = z.enum(LOG_LEVELS);
