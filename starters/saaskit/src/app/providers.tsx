"use client";
import { useEffect, useMemo, useState } from 'react';
import { HooksProvider } from '@/src/sdk/hooks';
import { hooks } from '@/src/sdk/hooks/generated';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Default React Query options for optimal caching
 *
 * staleTime: 30s - Data is considered fresh for 30 seconds
 * gcTime: 5 min - Unused data is garbage collected after 5 minutes
 * refetchOnWindowFocus: false - Don't refetch on tab switch (can be overridden per query)
 * retry: 1 - Only retry failed requests once
 */
const QUERY_CLIENT_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds
      gcTime: 5 * 60_000,       // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

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
      setQueryClient(new rq.QueryClient(QUERY_CLIENT_OPTIONS));
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
