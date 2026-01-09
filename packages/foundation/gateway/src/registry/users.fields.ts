import type { FieldDef } from './types';

// Client-safe inlined constants (avoids importing kernel which has Node.js-only modules)
const PLANS = ['free', 'pro', 'pro_yearly', 'business', 'business_yearly'] as const;
const USER_STATUS = ['invited', 'active', 'suspended'] as const;
const USER_STATUS_RANK: Record<string, number> = { invited: 0, active: 1, suspended: 2 };

// Re-export names used by tests for backward compatibility
export const USERS_STATUS = USER_STATUS;
export const USERS_STATUS_RANK = USER_STATUS_RANK;
export const USERS_PLANS = PLANS;

export const usersFieldRegistry: Record<string, FieldDef> = {
  id: { key: '_id', type: 'string', ops: ['eq', 'in'] },
  email: { key: 'email', type: 'string', ops: ['eq', 'contains', 'in'] },
  displayName: { key: 'displayName', type: 'string', ops: ['eq', 'contains'] },
  name: { key: 'name', type: 'string', ops: ['eq', 'contains'] },
  updatedAt: { key: 'updatedAt', type: 'date', ops: ['gte', 'lte'] },
  plan: {
    key: 'plan',
    type: 'enum',
    ops: ['eq', 'in'],
    enumValues: USERS_PLANS,
  },
  status: {
    key: 'status',
    type: 'enum',
    ops: ['eq', 'in'],
    enumValues: USERS_STATUS,
    enumRank: USERS_STATUS_RANK,
  },
};
