"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  // Client-side check using SDK

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createApi } = await import('@/src/sdk');
        const api = await createApi();
        const me = await api.me.get();
        if (!cancelled) setAllowed(Boolean(me.userId));
        if (!me.userId) {
          const next = pathname + (search?.toString() ? `?${search.toString()}` : '');
          router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
      } catch {
        const next = pathname + (search?.toString() ? `?${search.toString()}` : '');
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, search, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
