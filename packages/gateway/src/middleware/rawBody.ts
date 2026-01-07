export async function readRawBody(req: Request): Promise<{ text: string; buffer: Uint8Array }> {
  const ab = await req.arrayBuffer();
  const buffer = new Uint8Array(ab);
  const text = new TextDecoder('utf-8').decode(buffer);
  return { text, buffer };
}

