import type { Metadata } from 'next';
import { SignupForm } from './signup-form';
import { getAuthConfig } from '@/src/platform/auth/config';
import { createApi } from "@/src/sdk/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your account to access your SaaS workspace.',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let isLoggedIn = false;
  try {
    const api = await createApi();
    const me = await api.me.get();
    if (me.userId) isLoggedIn = true;
  } catch {}

  if (isLoggedIn) {
    const next = typeof searchParams?.next === "string" ? searchParams.next : "/onboarding";
    redirect(next);
  }

  const { oauthProviders } = getAuthConfig();
  const known = ['google','github','facebook'] as const;
  const social = oauthProviders
    .filter((p): p is (typeof known)[number] => (known as readonly string[]).includes(p))
    .map((p) => ({ id: p, label: p.charAt(0).toUpperCase() + p.slice(1) }));
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border bg-card shadow-none md:flex-row md:shadow-xl md:shadow-black/[0.02]">
        <div className="flex flex-1 flex-col justify-center bg-muted/10 p-8 md:p-16">
          <div className="max-w-sm">
            <div className="mb-8">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-foreground md:text-5xl">
              Create account
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started with your SaaS Kit Account
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-8 md:p-16">
          <div className="mx-auto w-full max-w-sm">
            <SignupForm socialProviders={social} />
          </div>
        </div>
      </div>
      <div className="mt-8 flex w-full max-w-5xl justify-end gap-6 text-xs text-muted-foreground">
        <a href="/terms" className="hover:text-primary">
          Terms of Service
        </a>
        <a href="/privacy" className="hover:text-primary">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
