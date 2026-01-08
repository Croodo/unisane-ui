"use client";

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/src/components/ui/input-group';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Github, Facebook } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
// Dynamically import the browser auto SDK when submitting

interface SocialProvider { id: 'google' | 'github' | 'facebook'; label: string }

export function SignupForm({ socialProviders = [] as SocialProvider[] }: { socialProviders?: SocialProvider[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Using SDK client for first-party auth
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="placeholder:text-muted-foreground/40"
            />
          </InputGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
          <InputGroup>
            <InputGroupAddon>
              <Lock className="h-4 w-4 text-muted-foreground/70" />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
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
          {isSubmitting ? 'Creating…' : 'Create account'}
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
        Already have an account?{' '}
        <a href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
          Sign in
        </a>
      </div>
    </div>
  );
}
