'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button } from '@unisane/ui/components/button';
import { Label } from '@unisane/ui/primitives/label';
import { Input } from '@unisane/ui/primitives/input';
import { Alert } from '@unisane/ui/components/alert';
import { Icon } from '@unisane/ui/primitives/icon';
import { IconButton } from '@unisane/ui/components/icon-button';
import { Text } from '@unisane/ui/primitives/text';
import Link from 'next/link';

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
      if (password !== confirm) throw new Error('Passwords do not match.');
      const res = await fetch('/api/rest/v1/auth/password/reset/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, email }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Unable to reset password.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-primary-container p-3 text-primary">
          <Icon symbol="check_circle" size="md" />
        </div>
        <div className="space-y-2">
          <Text as="h2" variant="titleMedium">Password updated</Text>
          <Text variant="bodySmall" color="onSurfaceVariant">
            You can now sign in with your new password.
          </Text>
        </div>
        <Link href="/login" className="w-full">
          <Button className="w-full gap-2">
            <Icon symbol="login" size="sm" /> Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-label-small text-on-surface-variant">
          New password
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
            placeholder="••••••••"
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
        <Text variant="labelSmall" color="onSurfaceVariant">
          Use at least 8 characters. A mix of letters, numbers, and symbols is recommended.
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm" className="text-label-small text-on-surface-variant">
          Confirm new password
        </Label>
        <div className="relative">
          <Icon
            symbol="lock"
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="pl-10 pr-10"
          />
          <IconButton
            variant="standard"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowConfirm((v) => !v)}
            ariaLabel={showConfirm ? 'Hide password' : 'Show password'}
          >
            <Icon symbol={showConfirm ? 'visibility_off' : 'visibility'} size="sm" />
          </IconButton>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
          {error.includes('Invalid or expired') && (
            <div className="mt-2">
              <Link href="/forgot-password" className="font-medium underline hover:text-on-surface">
                Request a new link
              </Link>
            </div>
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
        <Link
          href="/login"
          className="flex items-center justify-center text-body-small font-medium text-on-surface-variant hover:text-on-surface"
        >
          <Icon symbol="arrow_back" size="sm" className="mr-2" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
