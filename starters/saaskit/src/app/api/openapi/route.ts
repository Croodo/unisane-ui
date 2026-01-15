export const runtime = "nodejs";

import { HEADER_NAMES } from "@unisane/gateway";
import { generateSpec } from "@/src/contracts/openapi";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readKitVersion(): string {
  try {
    const p = resolve(process.cwd(), "saaskit.json");
    const j = JSON.parse(readFileSync(p, "utf8")) as { version?: string };
    return String(j.version ?? "1.0.0");
  } catch {
    return "1.0.0";
  }
}

export async function GET(req: Request) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();

  try {
    const version = readKitVersion();
    const servers = process.env.OPENAPI_SERVER_URLS;

    const spec = generateSpec({
      version,
      ...(servers ? { servers } : {}),
    });

    return new Response(JSON.stringify(spec, null, 2), {
      headers: {
        "content-type": "application/json",
        [HEADER_NAMES.REQUEST_ID]: requestId,
      },
    });
  } catch (e) {
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
