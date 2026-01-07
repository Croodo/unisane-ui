"use client";
import { useEffect, useMemo, useState } from 'react';
import { HooksProvider } from '@/src/sdk/hooks';
import type { QueryClient } from '@tanstack/react-query';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [RQ, setRQ] = useState<typeof import('@tanstack/react-query') | null>(null);
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);
  const [hooks, setHooks] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Dynamically import React Query runtime
      const rq = (await import('@tanstack/react-query')) as typeof import('@tanstack/react-query');
      if (cancelled) return;
      setRQ(rq);
      setQueryClient(new rq.QueryClient());

      // Generate ts-rest hooks once
      const { createContractHooks } = await import('@/src/sdk/contractHooks');
      const h = await createContractHooks();
      if (!cancelled) setHooks(h as unknown as Record<string, unknown>);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
      } catch {
        // best-effort CSRF bootstrap; ignore failures
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = useMemo(() => Boolean(RQ && queryClient && hooks), [RQ, queryClient, hooks]);
  if (!ready) return null;

  const QueryClientProvider = RQ!.QueryClientProvider;
  return (
    <QueryClientProvider client={queryClient!}>
      <HooksProvider providedHooks={hooks!}>{children}</HooksProvider>
    </QueryClientProvider>
  );
}
