import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/src/hooks/use-session';
import { browserApi } from '@/src/sdk';
import { useParams } from 'next/navigation';

export function useFeatureFlags(keys: string[]) {
  const { me } = useSession();
  const params = useParams();

  // Try to get tenantId from params (e.g. /w/[slug] or /admin/tenants/[id])
  // This is a heuristic; in a real app we might have a robust useTenant hook.
  const tenantId = (params?.tenantId as string) || (params?.slug as string);
  const userId = me?.userId;
  const email = me?.email;

  return useQuery({
    queryKey: ['flags', 'evaluate', keys.sort().join(','), userId, tenantId],
    queryFn: async () => {
      const api = await browserApi();
      const res = await api.flags.evaluate({
        body: {
          keys,
          context: {
            tenantId: tenantId ?? undefined,
            userId: userId ?? undefined,
            email: email ?? undefined, // email might be null/undefined
          },
        },
      });

      // The browser client throws on error and returns data directly on success
      return res;
    },
    enabled: keys.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}
