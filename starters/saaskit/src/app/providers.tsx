"use client";
import { useEffect, useMemo, useState } from 'react';
import { HooksProvider } from '@/src/sdk/hooks';
import { hooks } from '@/src/sdk/hooks/generated';
import type { QueryClient } from '@tanstack/react-query';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [RQ, setRQ] = useState<typeof import('@tanstack/react-query') | null>(null);
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Dynamically import React Query runtime
      const rq = (await import('@tanstack/react-query')) as typeof import('@tanstack/react-query');
      if (cancelled) return;
      setRQ(rq);
      setQueryClient(new rq.QueryClient());
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

  const ready = useMemo(() => Boolean(RQ && queryClient), [RQ, queryClient]);
  if (!ready) return null;

  const QueryClientProvider = RQ!.QueryClientProvider;
  return (
    <QueryClientProvider client={queryClient!}>
      <HooksProvider providedHooks={hooks as unknown as Record<string, unknown>}>
        {children}
      </HooksProvider>
    </QueryClientProvider>
  );
}
