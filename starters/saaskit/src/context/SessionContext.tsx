"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BrowserApi } from "@/src/sdk";

// Widen the Me shape to allow optional displayName/email fields used in UI
type Me =
  | (Awaited<ReturnType<BrowserApi["me"]["get"]>> & {
      displayName?: string | null | undefined;
      email?: string | null | undefined;
      isSuperAdmin?: boolean | undefined;
      globalRole?: string | null | undefined;
    })
  | null;

type SessionState = {
  me: Me;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SessionCtx = createContext<SessionState | null>(null);

export function SessionProvider({
  children,
  initialMe,
}: {
  children: React.ReactNode;
  initialMe?: Me | undefined;
}) {
  const [me, setMe] = useState<Me>(initialMe ?? null);
  const [loading, setLoading] = useState(!initialMe);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const { createApi } = await import("@/src/sdk");
      const api = await createApi();
      const data = await api.me.get();
      setMe(data);
    } catch (e) {
      setMe(null);
      setError((e as { message?: string }).message ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialMe) fetchMe();
  }, [initialMe]);

  const value = useMemo<SessionState>(
    () => ({ me, loading, error, refresh: fetchMe }),
    [me, loading, error]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
