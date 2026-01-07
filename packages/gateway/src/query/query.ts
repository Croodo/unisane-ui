import type { ZodTypeAny } from 'zod';
import { z } from 'zod';

// Canonical query parser: coerce plausible numbers/booleans, then validate via Zod schema
export function parseQuery<Z extends ZodTypeAny>(
  req: Request,
  schema: Z
): z.output<Z> {
  const url = new URL(req.url);
  const params: Record<string, unknown> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (/^-?\d+$/.test(v)) params[k] = Number(v);
    else if (v === 'true' || v === 'false') params[k] = v === 'true';
    else params[k] = v;
  }
  return schema.parse(params) as z.output<Z>;
}
