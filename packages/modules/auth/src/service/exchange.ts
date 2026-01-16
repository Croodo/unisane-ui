import { connectDb, getEnv, getProviderAdapter, getAuthIdentityProvider, emitTyped } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import type { OAuthProvider } from "@unisane/kernel";
import type { ExchangeInput, ExchangeResult } from "../domain/types";
import { z } from "zod";

export type { ExchangeInput, ExchangeResult };

/**
 * AUTH-006 FIX: Zod schema for validating OAuth userInfo response.
 * Validates all critical fields to prevent injection and ensure data integrity.
 */
const ZOAuthUserInfo = z.object({
  // ID is required and must be a non-empty string (max 256 chars to prevent DoS)
  id: z.string().min(1, "Provider user ID is required").max(256, "Provider user ID too long"),
  // Email is required for account linking
  email: z.string().email("Invalid email from provider").max(320, "Email too long"),
  // Name is optional but should be sanitized if present
  name: z.string().max(200, "Name too long").optional().nullable(),
  // Picture URL is optional
  picture: z.string().url().max(2048).optional().nullable(),
}).passthrough(); // Allow additional fields from different providers

export async function exchange({
  provider,
  token,
}: ExchangeInput): Promise<ExchangeResult> {
  await connectDb();
  if (!provider || !token) throw ERR.validation("Missing provider or token");
  const p = String(provider).toLowerCase().trim() as OAuthProvider;
  const { OAUTH_PROVIDERS } = getEnv();
  const enabled = (OAUTH_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!enabled.includes(p)) throw ERR.forbidden("Provider not enabled");
  const adapter = await getProviderAdapter(p);
  if (!adapter) throw ERR.validation("Unknown provider");

  // Get user info using the access token
  const rawUserInfo = await adapter.getUserInfo({ accessToken: token });

  // AUTH-006 FIX: Validate userInfo with Zod to ensure data integrity
  const parseResult = ZOAuthUserInfo.safeParse(rawUserInfo);
  if (!parseResult.success) {
    // Log the validation error for debugging but don't expose details to client
    console.warn("[auth/exchange] Invalid userInfo from provider:", {
      provider: p,
      errors: parseResult.error.flatten().fieldErrors,
    });
    throw ERR.forbidden("Invalid user info from provider");
  }
  const userInfo = parseResult.data;

  const authUserId = `${p}:${userInfo.id}`;
  const identity = getAuthIdentityProvider();
  // Ensure user exists (synchronous - required for auth flow)
  const userId = await identity.ensureUserByEmail(userInfo.email);

  // Emit event for profile backfill (fire-and-forget, non-blocking)
  // This decouples the optional profile update from the critical auth flow
  await emitTyped('auth.oauth.profile_backfill', {
    userId,
    provider: p,
    authUserId,
    ...(userInfo.name ? { displayName: userInfo.name } : {}),
  });

  return { userId };
}
