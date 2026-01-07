import { kv } from '@unisane/kernel';
import { dbHealth } from '@unisane/kernel';
import { HEADER_NAMES } from '@unisane/gateway';
import { KIT_ID, KIT_CHANNEL, KIT_VERSION } from '@unisane/kernel';

export const runtime = 'nodejs';

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
