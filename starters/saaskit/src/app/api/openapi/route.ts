export const runtime = "nodejs";

import { HEADER_NAMES } from "@/src/gateway/headers";

export async function GET(req: Request) {
  try {
    // Contract-based spec only (legacy registry removed)
    const modContracts = await import("@/src/openapi/spec");
    const spec = modContracts.generateSpec ? modContracts.generateSpec() : {};
    return new Response(JSON.stringify(spec, null, 2), {
      headers: {
        "content-type": "application/json",
        [HEADER_NAMES.REQUEST_ID]: req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID(),
      },
    });
  } catch (e) {
    const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();
    return new Response(
      JSON.stringify({
        error: "OpenAPI unavailable",
        message: (e as Error)?.message ?? "",
        requestId,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json", [HEADER_NAMES.REQUEST_ID]: requestId },
      }
    );
  }
}
