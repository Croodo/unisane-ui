import { connectDb } from "@unisane/kernel";
import { ensureUserByEmail, updateUser } from "@unisane/identity";
import { ERR } from "@unisane/gateway";
import { getEnv } from "@unisane/kernel";
import { getProviderAdapter } from "@unisane/kernel";
import type { OAuthProvider } from "@unisane/kernel";
import type { ExchangeInput, ExchangeResult } from "../domain/types";

export type { ExchangeInput, ExchangeResult };

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
  const userInfo = await adapter.getUserInfo({ accessToken: token });
  if (!userInfo?.email) throw ERR.forbidden("Provider email required");
  const authUserId = `${p}:${userInfo.id}`;
  // Ensure user and backfill profile fields if missing
  const userId = await ensureUserByEmail(
    userInfo.email,
    userInfo.name ?? undefined,
    authUserId
  );
  try {
    await updateUser({
      userId,
      patch: {
        ...(userInfo.name ? { displayName: userInfo.name } : {}),
        ...(userInfo.picture ? { imageUrl: userInfo.picture } : {}),
      },
    });
  } catch {}
  return { userId };
}
