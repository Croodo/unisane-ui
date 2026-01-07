import { HEADER_NAMES } from '@unisane/gateway';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json', [HEADER_NAMES.REQUEST_ID]: requestId },
  });
}
