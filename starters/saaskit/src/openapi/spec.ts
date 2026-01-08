import type {
  OpenAPIObject,
  ReferenceObject,
  SecuritySchemeObject,
} from "openapi3-ts/oas31";
import { generateOpenApi } from "@ts-rest/open-api";
import { appRouter } from "@/src/contracts/app.router";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readKitVersion(): { version: string } {
  try {
    const p = resolve(process.cwd(), "saaskit.json");
    const j = JSON.parse(readFileSync(p, "utf8")) as { version?: string };
    return { version: String(j.version ?? "0.0.0") };
  } catch {
    return { version: "0.0.0" };
  }
}

/**
 * Generate the OpenAPI spec from ts-rest contracts.
 * Includes security schemes (bearer & apiKey) and stamps the kit version.
 */
export function generateSpec(): OpenAPIObject {
  const { version } = readKitVersion();

  // Build servers list from env (comma-separated). Fallback to localhost.
  const serversFromEnv = (() => {
    const raw = (process.env.OPENAPI_SERVER_URLS ?? "").trim();
    if (!raw) return null as null | Array<{ url: string }>;
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return null;
    return parts.map((u) => ({ url: u }));
  })();

  const openapi = generateOpenApi(
    appRouter,
    {
      info: {
        title: "SaaSKit API",
        version,
        description:
          "Contract-first REST API. Security: Bearer (JWT) or x-api-key. " +
          "For cookie-authenticated, state-changing requests, send header `x-csrf-token` matching cookie `csrf_token`.",
      },
      servers:
        serversFromEnv && serversFromEnv.length
          ? serversFromEnv
          : [
              {
                url: "{baseUrl}",
                variables: { baseUrl: { default: "http://localhost:3000" } },
              },
            ],
    },
    {
      // Disable operationId auto-setting to avoid collisions on generic op names
      // across routers (e.g., many groups have a 'create' op).
      setOperationId: false,
    }
  ) as OpenAPIObject;

  // Components: security schemes
  const components: NonNullable<OpenAPIObject["components"]> =
    (openapi.components ??= {} as NonNullable<OpenAPIObject["components"]>);
  const securitySchemes: Record<
    string,
    SecuritySchemeObject | ReferenceObject
  > = {
    ...(components.securitySchemes ?? {}),
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT RS256. See CSRF note for cookie-auth flows.",
    },
    apiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "x-api-key",
      description: "API key scoped to a tenant (hash stored).",
    },
  };
  components.securitySchemes = securitySchemes;

  // Top-level note about CSRF for cookie flows
  (openapi as unknown as { [k: string]: unknown })["x-notes"] = {
    csrf:
      "State-changing requests authenticated by cookies must include header 'x-csrf-token' equal to cookie 'csrf_token'. " +
      "Bearer and x-api-key flows do not require CSRF.",
  };

  return openapi;
}

export default generateSpec;
