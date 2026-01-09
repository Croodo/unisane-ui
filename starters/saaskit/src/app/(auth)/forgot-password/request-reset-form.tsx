'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get('next') ?? searchParams.get('callbackURL') ?? undefined;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/rest/v1/auth/password/reset/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, ...(callbackURL ? { redirectTo: callbackURL } : {}) }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Unable to send reset email.');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    const loginHref = `/login${callbackURL ? `?next=${encodeURIComponent(callbackURL)}` : ''}`;
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we sent a password reset link.
            Be sure to check your spam folder.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href={loginHref} className="w-full">
            <Button variant="default" className="w-full gap-2">
              <Mail className="h-4 w-4" /> Back to sign in
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const loginHref = `/login${callbackURL ? `?next=${encodeURIComponent(callbackURL)}` : ''}`;
  return (
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
        <p className="text-xs text-muted-foreground">We’ll email you a link to reset your password.</p>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isSubmitting} className="w-full font-medium">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link href={loginHref} className="flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
