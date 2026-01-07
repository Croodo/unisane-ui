import { base64UrlDecodeUtf8, base64UrlEncodeUtf8 } from "@unisane/kernel";

export function parseFiltersParam(param?: string | null): Record<string, unknown> {
  if (!param) return {};
  const tryParse = (value: string) => {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  };
  try {
    return tryParse(param);
  } catch {
    // Fallback for legacy double-encoded values
    try {
      return tryParse(decodeURIComponent(param));
    } catch {
      const decoded = base64UrlDecode(param);
      if (!decoded) return {};
      try {
        return tryParse(decoded);
      } catch {
        return {};
      }
    }
  }
}

export function encodeFiltersParam(filters: Record<string, unknown>): string | undefined {
  if (!filters || Object.keys(filters).length === 0) return undefined;
  try {
    const json = JSON.stringify(filters);
    const encoded = base64UrlEncodeUtf8(json);
    return encoded || json;
  } catch {
    return undefined;
  }
}

function base64UrlDecode(input: string): string | null {
  return base64UrlDecodeUtf8(input);
}
