export function base64UrlEncodeUtf8(input: string): string {
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

export function base64UrlDecodeUtf8(input: string): string | null {
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

