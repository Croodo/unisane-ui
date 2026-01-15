/**
 * OpenAPI specification generator
 *
 * Generates OpenAPI 3.1 spec from ts-rest contracts.
 * This lives with contracts as it's derived directly from them.
 */
import type {
  OpenAPIObject,
  ReferenceObject,
  SecuritySchemeObject,
} from "openapi3-ts/oas31";
import { generateOpenApi } from "@ts-rest/open-api";
import { appRouter } from "./app.router";

export interface OpenApiOptions {
  /** API title */
  title?: string;
  /** API version */
  version?: string;
  /** API description */
  description?: string;
  /** Server URLs (comma-separated string or array) */
  servers?: string | Array<{ url: string; description?: string }>;
}

/**
 * Generate the OpenAPI spec from ts-rest contracts.
 * Includes security schemes (bearer & apiKey) and CSRF notes.
 */
export function generateSpec(options: OpenApiOptions = {}): OpenAPIObject {
  const {
    title = "SaaSKit API",
    version = "1.0.0",
    description = "Contract-first REST API. Security: Bearer (JWT) or x-api-key. " +
      "For cookie-authenticated, state-changing requests, send header `x-csrf-token` matching cookie `csrf_token`.",
    servers,
  } = options;

  // Parse servers from string or use array directly
  const serversList = (() => {
    if (!servers) return null;
    if (Array.isArray(servers)) return servers;
    // Parse comma-separated string
    const parts = servers
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
        title,
        version,
        description,
      },
      servers:
        serversList && serversList.length
          ? serversList
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
