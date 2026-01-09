"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/hooks/useSession';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const router = useRouter();
  const { me } = useSession();

  async function signOut() {
    try {
      const { createApi } = await import('@/src/sdk');
      const api = await createApi();
      await api.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantSlug');
    } catch {}
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-black/60 h-14">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-base md:text-lg font-semibold">SaaSkit</Link>
          {me?.tenantName || me?.tenantSlug ? (
            <>
              <span className="hidden text-sm md:text-base text-muted-foreground sm:inline">·</span>
              <span className="hidden text-sm md:text-base text-muted-foreground sm:inline">
                {me.tenantName ?? me.tenantSlug}
              </span>
            </>
          ) : null}
        </div>
        <nav className="flex items-center gap-3 text-sm md:text-base">
          <Link className="hover:underline" href="/workspaces">Workspaces</Link>
          <Link className="hover:underline" href="/welcome">Create</Link>
          <Link className="hover:underline" href="/onboarding">Refresh</Link>
          {me?.isSuperAdmin ? (
            <Link className="hover:underline" href="/admin">Admin</Link>
          ) : null}
          {!me?.userId ? (
            <Link className="rounded-md bg-primary px-3.5 py-2 text-primary-foreground" href="/login">Sign in</Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account" className="rounded-full border p-1 hover:bg-muted">
                  <Avatar className="size-6">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={me.tenantSlug ? `/w/${me.tenantSlug}/dashboard` : me.tenantId ? '/workspaces' : '/welcome'}>Open workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspaces">Switch workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/welcome">Create workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
