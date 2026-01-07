import type { ZodTypeAny } from "zod";
import { ZodError, z } from "zod";
import { toHttp, ERR } from "../errors/errors";
import { HEADER_NAMES } from "../headers";

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
    const requestId =
      req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();
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
