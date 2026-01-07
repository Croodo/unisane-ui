// Cross‑environment normalization helpers used by both server and client.
// Keep these side‑effect free and lightweight so they can be imported in UI too.

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  const u = username.trim().toLowerCase().replace(/^@+/, "");
  return u;
}

// Best‑effort E.164 normalizer. For production‑grade behavior, prefer libphonenumber‑js.
export function normalizePhoneE164(phone: string): string {
  const raw = phone.trim().replace(/[\s-]/g, "");
  // Convert leading 00 to +
  const canon = raw.startsWith("00") ? "+" + raw.slice(2) : raw;
  if (!/^\+[1-9][0-9]{7,14}$/.test(canon)) {
    throw new Error("Invalid phone number (expecting E.164 like +14155550123)");
  }
  return canon;
}

