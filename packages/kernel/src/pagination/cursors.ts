import { decodeBase64UrlJson, encodeBase64UrlJson } from "../encoding/base64urlJson";

export type CursorPayload = { id: string };

export function encodeCursor(p: CursorPayload): string {
  return encodeBase64UrlJson(p);
}

export function decodeCursor(
  s: string | null | undefined
): CursorPayload | null {
  if (!s) return null;
  try {
    const val = decodeBase64UrlJson(s) as CursorPayload | null;
    if (typeof val?.id === "string" && val.id.length > 0) return val;
    return null;
  } catch {
    return null;
  }
}
