import { kv, dbHealth } from '@unisane/kernel';
import { HEADER_NAMES } from '@unisane/gateway';

export const runtime = 'nodejs';

// Kit metadata (from saaskit.json or env)
const KIT_ID = process.env.KIT_ID ?? 'saaskit';
const KIT_CHANNEL = process.env.KIT_CHANNEL ?? 'stable';
const KIT_VERSION = process.env.KIT_VERSION ?? '0.0.0';

export async function GET() {
  const requestId = crypto.randomUUID();
  // KV probe
  let kvOk = false;
  try {
    const key = `ready:${requestId}`;
    await kv.set(key, '1', { PX: 5000 });
    kvOk = (await kv.get(key)) === '1';
  } catch {
    kvOk = false;
  }
  const db = await dbHealth();

  return new Response(
    JSON.stringify({ ok: true, data: { kv: { ok: kvOk }, db, kit: { id: KIT_ID, channel: KIT_CHANNEL, version: KIT_VERSION } } }),
    { status: 200, headers: { 'content-type': 'application/json', [HEADER_NAMES.REQUEST_ID]: requestId } }
  );
}
