import { HEADER_NAMES } from '@unisane/gateway';
import { healthCheck, livenessCheck } from '@unisane/kernel';

export const runtime = 'nodejs';

/**
 * Health check endpoint.
 *
 * GET /api/health - Full health check with dependency status
 * GET /api/health?live=true - Simple liveness check (fast, no dependencies)
 */
export async function GET(req: Request) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();
  const url = new URL(req.url);

  // Simple liveness check (for K8s liveness probes)
  if (url.searchParams.get('live') === 'true') {
    return new Response(JSON.stringify(livenessCheck()), {
      status: 200,
      headers: { 'content-type': 'application/json', [HEADER_NAMES.REQUEST_ID]: requestId },
    });
  }

  // Full readiness check with all dependencies
  const health = await healthCheck();

  // Return 503 if unhealthy (for K8s readiness probes)
  const status = health.status === 'unhealthy' ? 503 : 200;

  return new Response(JSON.stringify(health), {
    status,
    headers: { 'content-type': 'application/json', [HEADER_NAMES.REQUEST_ID]: requestId },
  });
}
