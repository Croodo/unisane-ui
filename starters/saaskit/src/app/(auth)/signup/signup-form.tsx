"use client";

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@unisane/ui/components/button';
import { Typography } from '@unisane/ui/components/typography';
import { Label } from '@unisane/ui/primitives/label';
import { Input } from '@unisane/ui/primitives/input';
import { Alert } from '@unisane/ui/components/alert';
import { Icon } from '@unisane/ui/primitives/icon';
import { IconButton } from '@unisane/ui/components/icon-button';
import { toast } from "@unisane/ui/components/toast";
import { FcGoogle } from 'react-icons/fc';

interface SocialProvider {
  id: 'google' | 'github' | 'facebook';
  label: string;
}

export function SignupForm({ socialProviders = [] as SocialProvider[] }: { socialProviders?: SocialProvider[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') ?? searchParams.get('callbackURL') ?? undefined;
  const callbackURL = (() => {
    if (!rawNext) return undefined;
    try {
      const u = new URL(rawNext, window.location.origin);
      return u.origin === window.location.origin ? u.pathname + u.search + u.hash : undefined;
    } catch {
      return rawNext.startsWith('/') ? rawNext : undefined;
    }
  })();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialSubmitting, setSocialSubmitting] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { createApi } = await import('@/src/sdk');
      const api = await createApi();
      await api.auth.passwordSignUp({ body: { email, password, locale: 'en' } });
      toast.success('Account created');
      const destination = callbackURL ?? '/onboarding';
      router.replace(destination);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.';
      setError(msg);
      toast.error('Sign up failed', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  function startSocialSignIn(provider: SocialProvider) {
    setSocialSubmitting(provider.id);
    const next = callbackURL ? `?next=${encodeURIComponent(callbackURL)}` : '';
    window.location.href = `/api/auth/signin/${provider.id}${next}`;
  }

  const providerIcon = (id: SocialProvider['id']) =>
    id === 'github' ? (
      <Icon symbol="code" size="sm" />
    ) : id === 'facebook' ? (
      <Icon symbol="group" size="sm" />
    ) : (
      <FcGoogle className="h-5 w-5" />
    );

  return (
    <div className="flex w-full flex-col gap-6">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-label-small text-on-surface-variant">
            Email address
          </Label>
          <div className="relative">
            <Icon
              symbol="mail"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-label-small text-on-surface-variant">
            Password
          </Label>
          <div className="relative">
            <Icon
              symbol="lock"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="pl-10 pr-10"
            />
            <IconButton
              variant="standard"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setShowPwd((v) => !v)}
              ariaLabel={showPwd ? 'Hide password' : 'Show password'}
            >
              <Icon symbol={showPwd ? 'visibility_off' : 'visibility'} size="sm" />
            </IconButton>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      {socialProviders.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center">
              <Typography variant="labelSmall" className="bg-surface px-3 text-on-surface-variant uppercase">
                Or continue with
              </Typography>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outlined"
                type="button"
                className="w-full"
                icon={providerIcon(provider.id)}
                disabled={Boolean(socialSubmitting) && socialSubmitting !== provider.id}
                onClick={() => startSocialSignIn(provider)}
              >
                {socialSubmitting === provider.id
                  ? `Redirecting to ${provider.label}…`
                  : `Continue with ${provider.label}`}
              </Button>
            ))}
          </div>
        </>
      )}

      <Typography variant="bodySmall" className="text-center text-on-surface-variant">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign in
        </Link>
      </Typography>
    </div>
  );
}
