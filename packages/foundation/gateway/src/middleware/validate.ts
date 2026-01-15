import type { ZodTypeAny } from "zod";
import { ZodError, z } from "zod";
import { toHttp, ERR } from "../errors/errors";
import { HEADER_NAMES } from "../headers";

/**
 * Valid pattern for request IDs: alphanumeric, underscores, hyphens, 1-64 chars.
 * This prevents log injection attacks from malicious request ID headers.
 */
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Sanitize a request ID from headers.
 * Returns a new UUID if the input is invalid or missing.
 *
 * @param input - The raw request ID header value
 * @returns A valid request ID string
 */
export function sanitizeRequestId(input: string | null): string {
  if (!input) return crypto.randomUUID();
  if (!REQUEST_ID_PATTERN.test(input)) return crypto.randomUUID();
  return input;
}

export async function parseJson<Z extends ZodTypeAny>(
  req: Request,
  schema: Z
): Promise<z.output<Z>> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (result.success) return result.data as z.output<Z>;
    const zerr = result.error as ZodError;
    const fields = zerr.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    }));
    const err = ERR.validation("Invalid request body");
    err.details = { fields };
    throw err;
  } catch (e) {
    if (e instanceof SyntaxError) throw ERR.validation("Malformed JSON");
    throw e;
  }
}

// Map query params with a custom mapper when schema parsing isn't suitable
export function mapQuery<T extends Record<string, unknown>>(
  req: Request,
  mapper: (sp: URLSearchParams) => T
): T {
  const sp = new URL(req.url).searchParams;
  return mapper(sp);
}

export async function handle<Z extends ZodTypeAny, Out>(
  req: Request,
  schema: Z,
  fn: (body: z.output<Z>) => Promise<Out>
): Promise<Response> {
  try {
    const body = schema.parse(await req.json()) as z.output<Z>;
    const data = await fn(body);
    const requestId = sanitizeRequestId(req.headers.get(HEADER_NAMES.REQUEST_ID));
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        [HEADER_NAMES.REQUEST_ID]: requestId,
      },
    });
  } catch (e) {
    return toHttp(e);
  }
}
