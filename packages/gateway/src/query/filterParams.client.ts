/**
 * Client-safe filter params utilities.
 * Inlined base64 encoding to avoid kernel dependency.
 */

function base64UrlEncodeUtf8(input: string): string {
  try {
    // Node.js / runtimes with Buffer
    if (typeof Buffer !== "undefined") {
      return Buffer.from(input, "utf8").toString("base64url");
    }

    // Browser fallback
    const ascii = btoa(
      encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p) =>
        String.fromCharCode(parseInt(p, 16))
      )
    );
    return ascii.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

function base64UrlDecodeUtf8(input: string): string | null {
  try {
    // Node.js / runtimes with Buffer
    if (typeof Buffer !== "undefined") {
      return Buffer.from(input, "base64url").toString("utf8");
    }

    // Browser fallback
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const ascii = atob(padded);
    return decodeURIComponent(
      ascii
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return null;
  }
}

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
      const decoded = base64UrlDecodeUtf8(param);
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
