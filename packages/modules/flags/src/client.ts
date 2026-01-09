/**
 * @unisane/flags/client
 *
 * Client-safe exports for browser environments.
 */

export {
  ZRuleCondition,
  ZRule,
  ZFlagWrite,
  ZFlagOut,
  ZOverrideWrite,
  ZOverrideOut,
  ZFlagGetQuery,
  ZFlagsListQuery,
} from './domain/schemas';

export type {
  FlagWrite,
  FlagOut,
  OverrideWrite,
  OverrideOut,
} from './domain/schemas';

export * from './domain/types';
export { FLAGS_EVENTS, FLAGS_DEFAULTS } from './domain/constants';
