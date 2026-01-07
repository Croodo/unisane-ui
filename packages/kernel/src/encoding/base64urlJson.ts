import { base64UrlDecodeUtf8, base64UrlEncodeUtf8 } from "./base64url";

export function encodeBase64UrlJson(value: unknown): string {
  try {
    return base64UrlEncodeUtf8(JSON.stringify(value));
  } catch {
    return "";
  }
}

export function decodeBase64UrlJson(input: string): unknown | null {
  const json = base64UrlDecodeUtf8(input);
  if (!json) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

