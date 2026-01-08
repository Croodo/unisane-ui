import type { FieldDef } from './types';

// Client-safe inline (avoids importing kernel which has Node.js-only modules)
const PLANS = ['free', 'pro', 'pro_yearly', 'business', 'business_yearly'] as const;

export const tenantsAdminFieldRegistry: Record<string, FieldDef> = {
  id: { key: '_id', type: 'string', ops: ['eq', 'in'] },
  slug: { key: 'slug', type: 'string', ops: ['eq', 'contains'] },
  name: { key: 'name', type: 'string', ops: ['eq', 'contains'] },
  planId: { key: 'planId', type: 'enum', ops: ['eq', 'in'], enumValues: PLANS },
  membersCount: { key: 'membersCount', type: 'number', ops: ['gte', 'lte'] },
  adminsCount: { key: 'adminsCount', type: 'number', ops: ['gte', 'lte'] },
  apiKeysCount: { key: 'apiKeysCount', type: 'number', ops: ['gte', 'lte'] },
  flagOverridesCount: { key: 'flagOverridesCount', type: 'number', ops: ['gte', 'lte'] },
  invoicesOpenCount: { key: 'invoicesOpenCount', type: 'number', ops: ['gte', 'lte'] },
  webhooksFailed24h: { key: 'webhooksFailed24h', type: 'number', ops: ['gte', 'lte'] },
  creditsAvailable: { key: 'creditsAvailable', type: 'number', ops: ['gte', 'lte'] },
  lastActivityAt: { key: 'lastActivityAt', type: 'date', ops: ['gte', 'lte'] },
};

