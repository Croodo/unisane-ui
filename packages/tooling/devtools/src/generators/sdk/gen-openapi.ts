/**
 * OpenAPI spec generator
 *
 * Generates openapi.json from ts-rest contracts.
 * This produces a static file that can be used for:
 * - API documentation (Swagger UI, Redoc)
 * - Mobile SDK generation (Swift, Kotlin)
 * - External integrations
 */
import * as path from 'node:path';
import { writeFile as fsWriteFile, mkdir } from 'node:fs/promises';
import { generateOpenApi } from '@ts-rest/open-api';
import type { OpenAPIObject, ReferenceObject, SecuritySchemeObject } from 'openapi3-ts/oas31';

export interface GenOpenApiOptions {
  /** Output file path (e.g., sdk/openapi.json) */
  output: string;
  /** The app router from contracts */
  appRouter: unknown;
  /** Path to router file (for error messages) */
  routerPath: string;
  /** API title */
  title?: string;
  /** API version */
  version?: string;
  /** API description */
  description?: string;
  /** Server URLs */
  servers?: Array<{ url: string; description?: string }>;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Generate OpenAPI spec file
 */
export async function genOpenApi(options: GenOpenApiOptions): Promise<void> {
  const {
    output,
    appRouter,
    title = 'SaaSKit API',
    version = '1.0.0',
    description = 'Contract-first REST API. Security: Bearer (JWT) or x-api-key. ' +
      'For cookie-authenticated, state-changing requests, send header `x-csrf-token` matching cookie `csrf_token`.',
    servers = [{ url: '{baseUrl}', description: 'API Server' }],
    dryRun = false,
  } = options;

  // Generate OpenAPI spec
  const openapi = generateOpenApi(
    appRouter as Parameters<typeof generateOpenApi>[0],
    {
      info: {
        title,
        version,
        description,
      },
      servers: servers.length ? servers : [{ url: '{baseUrl}' }],
    },
    {
      setOperationId: false,
    }
  ) as OpenAPIObject;

  // Add security schemes
  const components: NonNullable<OpenAPIObject['components']> =
    (openapi.components ??= {} as NonNullable<OpenAPIObject['components']>);

  const securitySchemes: Record<string, SecuritySchemeObject | ReferenceObject> = {
    ...(components.securitySchemes ?? {}),
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT RS256. See CSRF note for cookie-auth flows.',
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
      description: 'API key scoped to a tenant (hash stored).',
    },
  };
  components.securitySchemes = securitySchemes;

  // Add CSRF notes
  (openapi as unknown as { [k: string]: unknown })['x-notes'] = {
    csrf:
      'State-changing requests authenticated by cookies must include header \'x-csrf-token\' equal to cookie \'csrf_token\'. ' +
      'Bearer and x-api-key flows do not require CSRF.',
  };

  const content = JSON.stringify(openapi, null, 2);

  if (dryRun) {
    console.log(`[dry-run] Would write OpenAPI spec to: ${output}`);
    console.log(`[dry-run] Spec size: ${content.length} bytes`);
    return;
  }

  // Ensure directory exists
  const dir = path.dirname(output);
  await mkdir(dir, { recursive: true });

  // Write file
  await fsWriteFile(output, content, 'utf-8');
}
