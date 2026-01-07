// Minimal CSV streaming utility (UTF-8, RFC4180-ish quoting)
function* toCsv(rows: Array<Record<string, unknown>>, headers: string[]) {
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  yield headers.join(",") + "\n";
  for (const r of rows) {
    yield headers.map((h) => esc(r[h])).join(",") + "\n";
  }
}

export function streamCsv(
  rows: Array<Record<string, unknown>>,
  headers: string[]
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        for (const chunk of toCsv(rows, headers)) controller.enqueue(enc.encode(chunk));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
