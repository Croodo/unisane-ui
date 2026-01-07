'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/src/components/ui/input-group';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Github, Facebook } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'sonner';
// We dynamically import the browser auto SDK at call time to keep the bundle lean

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
  // Using SDK client for first-party auth
  const rawNext = searchParams.get('next') ?? searchParams.get('callbackURL') ?? undefined;
  const callbackURL = (() => {
    if (!rawNext) return undefined;
    try {
      // only allow same-origin paths to avoid open redirects
      const u = new URL(rawNext, window.location.origin);
      return u.origin === window.location.origin ? u.pathname + u.search + u.hash : undefined;
    } catch {
      return rawNext.startsWith('/') ? rawNext : undefined;
    }
  })();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  // rememberMe removed in first-party auth
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Surface provider callback errors passed via query (?error=...&rid=...)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { createApi } = await import('@/src/sdk');
      const api = await createApi();
      await api.auth.passwordSignIn({ body: { email, password } });
      // Bootstrap CSRF cookie for subsequent cookie-auth mutations
      try {
        await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
      } catch {
        // best-effort; rely on global bootstrap as fallback
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
      <Github className="h-4 w-4" />
    ) : id === 'facebook' ? (
      <Facebook className="h-4 w-4" />
    ) : (
      <FcGoogle className="h-4 w-4" />
    );

  return (
    <div className="flex w-full flex-col gap-6">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email address</Label>
          <InputGroup>
            <InputGroupAddon>
              <Mail className="h-4 w-4 text-muted-foreground/70" />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="placeholder:text-muted-foreground/40"
            />
          </InputGroup>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
            <a href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</a>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <Lock className="h-4 w-4 text-muted-foreground/70" />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="placeholder:text-muted-foreground/40"
            />
            <InputGroupAddon align="inline-end" className="bg-transparent border-l-0 hover:bg-transparent pr-2">
              <InputGroupButton
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPwd((v) => !v)}
                className="text-muted-foreground/70 hover:text-foreground"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
        {error ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="w-full font-medium">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {socialProviders.length ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid gap-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                type="button"
                className="w-full justify-center bg-background hover:bg-muted/50"
                disabled={Boolean(socialSubmitting) && socialSubmitting !== provider.id}
                onClick={() => startSocialSignIn(provider)}
              >
                {providerIcon(provider.id)}
                <span className="ml-2">
                  {socialSubmitting === provider.id ? `Redirecting to ${provider.label}…` : `Continue with ${provider.label}`}
                </span>
              </Button>
            ))}
          </div>
        </>
      ) : null}
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
          Sign up
        </a>
      </div>
    </div>
  );
}
