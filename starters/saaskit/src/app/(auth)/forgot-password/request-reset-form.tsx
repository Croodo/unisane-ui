'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@unisane/ui/components/button';
import { Label } from '@unisane/ui/primitives/label';
import { Input } from '@unisane/ui/primitives/input';
import { Alert } from '@unisane/ui/components/alert';
import { Icon } from '@unisane/ui/primitives/icon';
import { Text } from '@unisane/ui/primitives/text';
import Link from 'next/link';

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
        <div className="rounded-full bg-primary-container p-3 text-primary">
          <Icon symbol="check_circle" size="md" />
        </div>
        <div className="space-y-2">
          <Text as="h2" variant="titleMedium">Check your email</Text>
          <Text variant="bodySmall" color="onSurfaceVariant">
            If an account exists for that email, we sent a password reset link.
            Be sure to check your spam folder.
          </Text>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href={loginHref} className="w-full">
            <Button variant="filled" className="w-full gap-2">
              <Icon symbol="mail" size="sm" /> Back to sign in
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outlined" className="w-full gap-2">
              <Icon symbol="arrow_back" size="sm" /> Return Home
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
        <Text variant="labelSmall" color="onSurfaceVariant">
          We'll email you a link to reset your password.
        </Text>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link
          href={loginHref}
          className="flex items-center justify-center text-body-small font-medium text-on-surface-variant hover:text-on-surface"
        >
          <Icon symbol="arrow_back" size="sm" className="mr-2" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
