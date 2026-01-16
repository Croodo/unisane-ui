import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getAuthConfig } from '@/src/config';
import { createApi } from "@/src/sdk/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Access your SaaS kit workspace.",
};

export default async function LoginPage({
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

  // Social login disabled in first-party setup; omit providers
  const { oauthProviders } = getAuthConfig();
  const known = ['google','github','facebook'] as const;
  const social = oauthProviders
    .filter((p): p is (typeof known)[number] => (known as readonly string[]).includes(p))
    .map((p) => ({ id: p, label: p.charAt(0).toUpperCase() + p.slice(1) }));
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low p-4 md:p-8">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-outline-variant bg-surface shadow-none md:flex-row md:shadow-xl md:shadow-black/2">
        <div className="flex flex-1 flex-col justify-center bg-surface-container-low p-8 md:p-16">
          <div className="max-w-sm">
            <div className="mb-8">
              {/* Placeholder for Logo if needed, or just text */}
              <div className="h-8 w-8 rounded-full bg-primary-container" />
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-on-surface md:text-5xl">
              Sign in
            </h1>
            <p className="mt-4 text-lg text-on-surface-variant">
              Use your SaaS Kit Account
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-8 md:p-16">
          <div className="mx-auto w-full max-w-sm">
            <LoginForm socialProviders={social} />
          </div>
        </div>
      </div>
      <div className="mt-8 flex w-full max-w-5xl justify-end gap-6 text-label-small text-on-surface-variant">
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
