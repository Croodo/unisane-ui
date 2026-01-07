// Shared utilities for webhook event processing

export function getString(obj: unknown, path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function getNumber(obj: unknown, path: string[]): number | undefined {
  const v = getAny(obj, path);
  return typeof v === 'number' ? v : undefined;
}

export function getAny(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}
