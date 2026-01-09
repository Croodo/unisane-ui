'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@unisane/ui/components/button';
import { Label } from '@unisane/ui/primitives/label';
import { Input } from '@unisane/ui/primitives/input';
import { Alert } from '@unisane/ui/components/alert';
import { Icon } from '@unisane/ui/primitives/icon';
import { IconButton } from '@unisane/ui/components/icon-button';
import { FcGoogle } from 'react-icons/fc';
import { toast } from "@unisane/ui/components/toast";

interface SocialProvider {
  id: 'github' | 'google' | 'facebook';
  label: string;
}

interface LoginFormProps {
  socialProviders?: SocialProvider[];
}

export function LoginForm({ socialProviders = [] }: LoginFormProps) {
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
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      const rid = searchParams.get('rid');
      const pretty = (e: string) => {
        switch (e) {
          case 'oauth_access_denied':
            return 'You canceled the sign-in with the provider.';
          case 'oauth_exchange':
            return 'We could not complete sign-in with the provider. Please try again.';
          case 'oauth_link':
            return 'We could not link your account. Please try again.';
          case 'oauth_state':
            return 'Your sign-in session expired. Please try again.';
          case 'oauth_nonce':
            return 'Security check failed. Please try again.';
          default:
            return err.startsWith('oauth_') ? 'Sign in with provider failed.' : 'Sign in failed.';
        }
      };
      setError(`${pretty(err)}${rid ? ` (req ${rid})` : ''}`);
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { createApi } = await import('@/src/sdk');
      const api = await createApi();
      await api.auth.passwordSignIn({ body: { email, password } });
      try {
        await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
      } catch {
        // best-effort
      }
      toast.success('Signed in');
      const destination = callbackURL ?? '/onboarding';
      router.replace(destination);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setError(msg);
      toast.error('Sign in failed', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startSocialSignIn(provider: SocialProvider) {
    setError(null);
    setSocialSubmitting(provider.id);
    try {
      const next = callbackURL ? `?next=${encodeURIComponent(callbackURL)}` : '';
      window.location.href = `/api/auth/signin/${provider.id}${next}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to sign in with ${provider.label}.`);
      setSocialSubmitting(null);
    }
  }

  const providerIcon = (id: SocialProvider['id']) =>
    id === 'github' ? (
      <Icon symbol="code" size="sm" />
    ) : id === 'facebook' ? (
      <Icon symbol="group" size="sm" />
    ) : (
      <FcGoogle className="h-4 w-4" />
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-label-small text-on-surface-variant">
              Password
            </Label>
            <a href="/forgot-password" className="text-label-small text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Icon
              symbol="lock"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {socialProviders.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-label-small uppercase">
              <span className="bg-surface px-2 text-on-surface-variant">Or continue with</span>
            </div>
          </div>
          <div className="grid gap-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outlined"
                type="button"
                className="w-full justify-center"
                disabled={Boolean(socialSubmitting) && socialSubmitting !== provider.id}
                onClick={() => startSocialSignIn(provider)}
              >
                {providerIcon(provider.id)}
                <span className="ml-2">
                  {socialSubmitting === provider.id
                    ? `Redirecting to ${provider.label}…`
                    : `Continue with ${provider.label}`}
                </span>
              </Button>
            ))}
          </div>
        </>
      )}

      <div className="text-center text-body-small text-on-surface-variant">
        Don&apos;t have an account?{' '}
        <a
          href="/signup"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
