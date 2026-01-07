export type FieldType = 'string' | 'date' | 'enum' | 'number';
export type Op = 'eq' | 'contains' | 'in' | 'gte' | 'lte';

export type FieldDef = {
  key: string;
  type: FieldType;
  ops: Op[];
  enumValues?: readonly string[];
  enumRank?: Record<string, number>;
};

export function pickRegistry<
  T extends Record<string, FieldDef>,
  K extends keyof T,
>(registry: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = registry[k];
  return out;
}

// Optional tiny builders for readability when defining registries
export const str = (key: string, ops: Op[] = ['eq', 'contains']): FieldDef => ({ key, type: 'string', ops });
export const date = (key: string, ops: Op[] = ['gte', 'lte']): FieldDef => ({ key, type: 'date', ops });
export const enm = (
  key: string,
  values: readonly string[],
  ops: Op[] = ['eq', 'in'],
  enumRank?: Record<string, number>
): FieldDef => ({ key, type: 'enum', ops, enumValues: values, ...(enumRank ? { enumRank } : {}) });
